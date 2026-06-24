export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { 
  getReminderEmail, 
  getSubscriptionRenewalEmail 
} from '@/lib/email-templates'
import { getAllUsers } from '@/lib/server-store'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Secure cron endpoints by verifying a secret key passed in headers or search params
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization')
  const secretParam = new URL(req.url).searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET || 'billing_cron_secret_key_123'
  
  if (authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret) {
    return true
  }
  return false
}

export async function GET(req: NextRequest) {
  try {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON-BILLING] Starting automated billing and inactivity sweep...')
    const logs: string[] = []

    // ── 1. SWEEP INACTIVE LEARNERS (7 days inactive) ──
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('user_learning_stats')
      .select('user_id, last_active_date')
      .lte('last_active_date', sevenDaysAgoStr)
      .order('last_active_date', { ascending: true })

    if (inactiveError) {
      console.error('[CRON-BILLING] Inactivity sweep fetch failed:', inactiveError.message)
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      logs.push(`Found ${inactiveUsers.length} inactive learners. Sending reminders...`)
      
      for (const stat of inactiveUsers) {
        const userEmail = stat.user_id
        const days = Math.floor((Date.now() - new Date(stat.last_active_date).getTime()) / (1000 * 60 * 60 * 24))

        // Resolve user name using server-store
        const users = getAllUsers()
        const matchingUser = users.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase())
        const customerName = matchingUser?.name || 'Student'
        const courseTitle = 'Introduction to Machine Learning' // Default/Fallback course representation

        const html = getReminderEmail({
          userName: customerName,
          courseTitle,
          daysInactive: days
        })

        await sendEmail({
          to: userEmail,
          subject: `Ready to jump back in? (Inactivity Streak: ${days} days)`,
          html,
          emailType: 'reminder'
        })
      }
    }

    // ── 2. SWEEP SUBSCRIPTION RENEWALS (7 days before end date) ──
    const targetRenewalDate = new Date()
    targetRenewalDate.setDate(targetRenewalDate.getDate() + 7)
    const targetRenewalStr = targetRenewalDate.toISOString().split('T')[0]

    // Find subscriptions expiring exactly 7 days from now
    const { data: renewalSubs, error: renewalError } = await supabase
      .from('subscriptions')
      .select('user_id, plan, billing_period, current_period_end')
      .eq('status', 'active')
      .neq('plan', 'free')

    if (renewalError) {
      console.error('[CRON-BILLING] Renewal sweep fetch failed:', renewalError.message)
    } else if (renewalSubs && renewalSubs.length > 0) {
      // Filter for subscriptions expiring exactly 7 days from now
      const matchingSubs = renewalSubs.filter(sub => {
        if (!sub.current_period_end) return false
        const endDay = sub.current_period_end.split('T')[0]
        return endDay === targetRenewalStr
      })

      if (matchingSubs.length > 0) {
        logs.push(`Found ${matchingSubs.length} upcoming renewals. Sending reminder alerts...`)

        for (const sub of matchingSubs) {
          // Resolve email (user_id in subscriptions is user UUID, let's fetch profile email or placeholder)
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', sub.user_id)
            .maybeSingle()

          // If we can't map profile to email (since profiles table lacks email column),
          // check if they are in our server store active user directory or try fallback
          const customerName = profile?.full_name || 'Student'
          // Standard subscription pricing map
          const priceMap: Record<string, string> = {
            basic: '₹799.00',
            pro: '₹2,499.00',
            advanced: '₹7,999.00'
          }
          const price = priceMap[sub.plan] || '₹2,499.00'

          const html = getSubscriptionRenewalEmail({
            userName: customerName,
            planName: sub.plan.toUpperCase(),
            amount: price,
            renewalDate: new Date(sub.current_period_end).toLocaleDateString()
          })

          // Fallback email route
          const targetEmail = 'rchinnarangaswamyreddyr@gmail.com' // Send mock to test recipient
          await sendEmail({
            to: targetEmail,
            subject: `Subscription Renewal Reminder`,
            html,
            emailType: 'subscription_renewal'
          })
        }
      }
    }

    return NextResponse.json({ success: true, processed: logs })
  } catch (err: any) {
    console.error('[CRON-BILLING] Error during billing sweep:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
