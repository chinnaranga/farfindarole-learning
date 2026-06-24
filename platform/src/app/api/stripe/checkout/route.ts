export const runtime = 'edge'

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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Map plan + billingPeriod to Stripe Price IDs
const planPriceMap: Record<string, Record<string, string | undefined>> = {
  basic: {
    monthly: process.env.STRIPE_BASIC_MONTHLY,
    annually: process.env.STRIPE_BASIC_ANNUAL
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY,
    annually: process.env.STRIPE_PRO_ANNUAL
  },
  advanced: {
    monthly: process.env.STRIPE_ADVANCED_MONTHLY,
    annually: process.env.STRIPE_ADVANCED_ANNUAL
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Stripe Configuration via lazy helper call
    const stripe = getStripe()

    // 2. Validate User Session from JWT in Authorization Header
    const authHeader = req.headers.get('Authorization')
    let userId = ''
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    }

    const body = await req.json().catch(() => ({}))
    const { plan, billingPeriod } = body

    // Fallback to body's userId for local testing only if authorization header is not provided
    if (!userId && body.userId) {
      userId = body.userId
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Access token is missing or invalid' }, { status: 401 })
    }

    if (!plan || !billingPeriod) {
      return NextResponse.json({ error: 'Missing plan or billingPeriod' }, { status: 400 })
    }

    const normPlan = plan.toLowerCase()
    const normBillingPeriod = billingPeriod.toLowerCase()

    // 3. Resolve the Stripe Price ID
    const planPrices = planPriceMap[normPlan]
    if (!planPrices) {
      return NextResponse.json({ error: `Invalid plan selection: ${plan}` }, { status: 400 })
    }

    const priceId = planPrices[normBillingPeriod]
    if (!priceId) {
      return NextResponse.json({ error: `Price ID not configured for plan ${plan} and period ${billingPeriod}` }, { status: 400 })
    }

    // 4. Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/pricing?payment=success`,
      cancel_url: `${appUrl}/pricing?payment=cancelled`,
      metadata: {
        userId,
        plan: normPlan,
        billingPeriod: normBillingPeriod
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Error creating Stripe checkout session:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
