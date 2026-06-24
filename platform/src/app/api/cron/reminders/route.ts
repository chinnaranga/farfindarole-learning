export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/server-store'
import { sendEmail } from '@/lib/email'
import { getReminderEmail } from '@/lib/email-templates'

/**
 * GET /api/cron/reminders
 * Queries course progress records for incomplete courses where last_accessed is older than 3 days,
 * and sends reminder emails to prompt users to resume learning.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    // Optional secret key check to prevent unauthorized triggers in production
    const CRON_SECRET = process.env.CRON_SECRET
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const thresholdStr = threeDaysAgo.toISOString()

    // 1. Fetch incomplete enrollments older than 3 days
    const { data: inactiveEnrollments, error: dbError } = await supabase
      .from('course_progress')
      .select('*')
      .eq('completed', false)
      .lt('last_accessed', thresholdStr)

    if (dbError) throw dbError

    if (!inactiveEnrollments || inactiveEnrollments.length === 0) {
      return NextResponse.json({ success: true, message: 'No inactive learners found to remind.' })
    }

    let emailsSent = 0
    const results: string[] = []

    for (const enrollment of inactiveEnrollments) {
      const recipientEmail = enrollment.user_id.trim().toLowerCase()

      // Fetch course details
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', enrollment.course_id)
        .maybeSingle()

      if (!course) continue

      // 2. Prevent spam: Check if we already sent a reminder for this course in the last 3 days
      const { data: recentLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('recipient', recipientEmail)
        .eq('email_type', 'reminder')
        .ilike('subject', `%${course.title}%`)
        .gt('sent_at', thresholdStr)
        .maybeSingle()

      if (recentLog) {
        results.push(`Skipped ${recipientEmail} for ${course.title} (already reminded recently)`)
        continue
      }

      // Fetch user profile name
      const userDetails = getUserRole(recipientEmail)
      const userName = userDetails?.name || recipientEmail.split('@')[0]
      const lastAccessedTime = new Date(enrollment.last_accessed).getTime()
      const daysInactive = Math.max(3, Math.floor((Date.now() - lastAccessedTime) / (1000 * 60 * 60 * 24)))

      // Send the email
      const html = getReminderEmail({
        userName,
        courseTitle: course.title,
        daysInactive
      })

      const sendResult = await sendEmail({
        to: recipientEmail,
        subject: `Don't lose your streak in ${course.title}!`,
        html,
        emailType: 'reminder'
      })

      if (sendResult.success) {
        emailsSent++
        results.push(`Sent reminder to ${recipientEmail} for ${course.title}`)
      } else {
        results.push(`Failed sending reminder to ${recipientEmail} for ${course.title}: ${sendResult.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: inactiveEnrollments.length,
      sent: emailsSent,
      log: results
    })
  } catch (error: any) {
    console.error('[CRON-REMINDERS] Cron error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
