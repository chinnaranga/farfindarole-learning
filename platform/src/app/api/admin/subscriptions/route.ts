import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Initialize Stripe client lazily to prevent module load crashes when key is temporarily missing
let stripeInstance: Stripe | null = null
function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is missing on the server. Please check your environment variables.')
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia' as any,
    })
  }
  return stripeInstance
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin role
    const authHeader = req.headers.get('Authorization')
    let userId = ''
    let userEmail = ''
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
        userEmail = user.email || ''
      }
    }

    if (!userId || userEmail !== 'admin@farfindarole.com') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // 2. Fetch checkout sessions from Stripe
    const stripe = getStripe()
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    })

    // 3. Fetch all profiles from Supabase to correlate names
    const { data: dbProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
    
    const profileMap = new Map(dbProfiles?.map(p => [p.id, p.full_name]) || [])

    // 4. Extract transaction details
    const transactions = sessions.data.map(session => {
      const uId = session.metadata?.userId || ''
      const plan = session.metadata?.plan || 'free'
      const billingPeriod = session.metadata?.billingPeriod || 'monthly'
      
      const dbName = uId ? profileMap.get(uId) : null
      const displayName = dbName || session.customer_details?.name || 'Guest User'

      return {
        id: session.id, // Checkout Session ID
        customerId: session.customer as string || '',
        subscriptionId: session.subscription as string || '',
        transactionId: (session.invoice as string) || (session.payment_intent as string) || 'N/A',
        email: session.customer_details?.email || session.customer_email || 'N/A',
        name: displayName,
        plan,
        billingPeriod,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: (session.currency || 'INR').toUpperCase(),
        status: session.payment_status || 'unpaid',
        createdAt: new Date(session.created * 1000).toISOString()
      }
    })

    return NextResponse.json({ transactions })
  } catch (err: any) {
    console.error('Error listing Stripe transactions:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
