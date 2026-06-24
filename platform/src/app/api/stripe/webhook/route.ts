export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { updateUserRole } from '@/lib/server-store'
import { sendEmail } from '@/lib/email'
import { 
  getPurchaseConfirmationEmail, 
  getFailedPaymentEmail, 
  getRefundConfirmationEmail 
} from '@/lib/email-templates'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import fs from 'fs'
import path from 'path'

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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Prioritize service role key for webhook database writes to bypass RLS securely
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Map Stripe Price IDs back to Plan names and billing periods
function getPlanFromPriceId(priceId: string): { plan: 'free' | 'basic' | 'pro' | 'advanced'; billingPeriod: 'monthly' | 'annually' } {
  const basicMonthly = process.env.STRIPE_BASIC_MONTHLY
  const basicAnnual = process.env.STRIPE_BASIC_ANNUAL
  const proMonthly = process.env.STRIPE_PRO_MONTHLY
  const proAnnual = process.env.STRIPE_PRO_ANNUAL
  const advancedMonthly = process.env.STRIPE_ADVANCED_MONTHLY
  const advancedAnnual = process.env.STRIPE_ADVANCED_ANNUAL

  if (priceId === basicMonthly) return { plan: 'basic', billingPeriod: 'monthly' }
  if (priceId === basicAnnual) return { plan: 'basic', billingPeriod: 'annually' }
  if (priceId === proMonthly) return { plan: 'pro', billingPeriod: 'monthly' }
  if (priceId === proAnnual) return { plan: 'pro', billingPeriod: 'annually' }
  if (priceId === advancedMonthly) return { plan: 'advanced', billingPeriod: 'monthly' }
  if (priceId === advancedAnnual) return { plan: 'advanced', billingPeriod: 'annually' }

  return { plan: 'free', billingPeriod: 'monthly' }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature') || ''

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
      return NextResponse.json({ error: 'Webhook secret missing on server' }, { status: 500 })
    }

    let event: Stripe.Event
    try {
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    console.log(`Received Stripe Webhook event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as 'free' | 'basic' | 'pro' | 'advanced' | undefined
        const billingPeriod = session.metadata?.billingPeriod as 'monthly' | 'annually' | undefined
        
        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        if (!userId) {
          console.error('No userId found in session metadata')
          break
        }

        // Retrieve subscription details to get period start and end times
        const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId) as any
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        const displayNames: Record<string, string> = {
          free: 'Free',
          basic: 'Basic',
          pro: 'Student Pro',
          advanced: 'Advanced'
        }
        const planName = plan || 'free'
        const oldPlanValue = displayNames[planName] || 'Free'

        // Upsert subscription table record
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan: planName,
            billing_period: billingPeriod || 'monthly',
            status: 'active',
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })

        if (subError) {
          console.error(`Error saving subscription record for user ${userId}:`, subError.message)
        } else {
          console.log(`Successfully activated subscription in database for user: ${userId}`)
        }

        // Sync role in profiles table
        let newRole = 'student'
        if (planName === 'pro' || planName === 'advanced') newRole = 'pro'

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', userId)

        if (profileError) {
          console.error(`Error updating profile role for user ${userId}:`, profileError.message)
        }

        // Sync with local server-store API
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .maybeSingle()

        if (profile?.email) {
          updateUserRole(profile.email, newRole === 'pro' ? 'pro' : 'student', profile.full_name || 'Student')
          console.log(`Synced local server-store role for: ${profile.email}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const stripeCustomerId = subscription.customer as string
        const stripeSubscriptionId = subscription.id
        
        // Find corresponding user in subscriptions table by subscription_id or customer_id
        const { data: subData, error: subFetchError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .maybeSingle()

        let userId = subData?.user_id

        if (!userId && !subFetchError) {
          // Fall back to looking up by customer id
          const { data: fallbackData } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_customer_id', stripeCustomerId)
            .maybeSingle()
          userId = fallbackData?.user_id
        }

        if (!userId) {
          console.error(`User not found for Stripe Subscription update: customer=${stripeCustomerId}, sub=${stripeSubscriptionId}`)
          break
        }

        // Retrieve price ID to determine plan
        const priceId = subscription.items.data[0]?.price.id
        const { plan, billingPeriod } = getPlanFromPriceId(priceId)
        
        const isCancelled = subscription.cancel_at_period_end || subscription.status === 'canceled'
        const status = isCancelled ? 'cancelled' : (subscription.status === 'active' ? 'active' : subscription.status)
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString()
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

        const displayNames: Record<string, string> = {
          free: 'Free',
          basic: 'Basic',
          pro: 'Student Pro',
          advanced: 'Advanced'
        }
        const oldPlanValue = displayNames[plan] || 'Free'

        // Update database record
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan,
            billing_period: billingPeriod,
            status,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        if (updateError) {
          console.error(`Failed to update subscription in DB for user ${userId}:`, updateError.message)
        }

        // Sync role in profiles if subscription is active
        if (!isCancelled && subscription.status === 'active') {
          let newRole = 'student'
          if (plan === 'pro' || plan === 'advanced') newRole = 'pro'

          const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId)

          if (profileError) console.error('Failed to sync profile role:', profileError.message)

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .maybeSingle()

          if (profile?.email) {
            updateUserRole(profile.email, newRole === 'pro' ? 'pro' : 'student', profile.full_name || 'Student')
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const stripeSubscriptionId = subscription.id
        
        // Find corresponding user in subscriptions table
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', stripeSubscriptionId)
          .maybeSingle()

        if (subData?.user_id) {
          const userId = subData.user_id
          
          // Reset subscription to free / inactive in database
          const { error: deleteError } = await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              status: 'inactive',
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)

          if (deleteError) {
            console.error(`Failed to update subscription to free/inactive for user ${userId}:`, deleteError.message)
          }

          // Reset user role to student
          await supabase
            .from('profiles')
            .update({ role: 'student', updated_at: new Date().toISOString() })
            .eq('id', userId)

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .maybeSingle()

          if (profile?.email) {
            updateUserRole(profile.email, 'student', profile.full_name || 'Student')
          }
          console.log(`Subscription deleted and access revoked for user ${userId}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const stripeCustomerId = invoice.customer as string
        const stripeSubscriptionId = invoice.subscription as string
        const paymentIntentId = invoice.payment_intent as string || invoice.charge as string || 'N/A'

        console.log(`[Stripe Webhook] Processing invoice.payment_succeeded for customer ${stripeCustomerId}`)

        // Fetch user from subscriptions
        let userId: string | null = null
        let planName = 'basic' // Default fallback
        let billingPeriod = 'monthly'

        if (stripeSubscriptionId) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id, plan, billing_period')
            .eq('stripe_subscription_id', stripeSubscriptionId)
            .maybeSingle()
          
          if (subData) {
            userId = subData.user_id
            planName = subData.plan || 'basic'
            billingPeriod = subData.billing_period || 'monthly'
          }
        }

        if (!userId && stripeCustomerId) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('user_id, plan, billing_period')
            .eq('stripe_customer_id', stripeCustomerId)
            .maybeSingle()
          
          if (subData) {
            userId = subData.user_id
            planName = subData.plan || 'basic'
            billingPeriod = subData.billing_period || 'monthly'
          }
        }

        // Fetch profile
        let customerName = invoice.customer_name || 'Student'
        let customerEmail = invoice.customer_email || ''

        if (userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .maybeSingle()
          
          if (profile?.full_name) {
            customerName = profile.full_name
          }
        }

        if (!customerEmail && stripeCustomerId) {
          try {
            const customerObj = await getStripe().customers.retrieve(stripeCustomerId) as any
            customerEmail = customerObj.email || ''
          } catch (e) {
            console.error('Failed to retrieve stripe customer email:', e)
          }
        }

        if (!customerEmail) {
          console.error('[Stripe Webhook] No email found for invoice payment success notification')
          break
        }

        const invoiceNumber = invoice.number || `INV-${Date.now()}`
        const amount = (invoice.subtotal || invoice.amount_paid) / 100
        const tax = (invoice.tax || 0) / 100
        const total = invoice.amount_paid / 100
        
        let billingAddress = ''
        if (invoice.customer_address) {
          const addr = invoice.customer_address
          billingAddress = [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
            .filter(Boolean)
            .join(', ')
        }

        const displayNames: Record<string, string> = {
          free: 'Free Plan',
          basic: 'Basic Plan',
          pro: 'Student Pro Plan',
          advanced: 'Advanced Plan'
        }
        const itemName = `${displayNames[planName] || 'Pro Plan'} - ${billingPeriod === 'annually' ? 'Annual' : 'Monthly'}`

        // Generate PDF invoice
        let pdfUrl = ''
        try {
          pdfUrl = await generateInvoicePDF({
            invoiceNumber,
            transactionId: paymentIntentId,
            date: new Date(invoice.created * 1000).toLocaleDateString(),
            customerName,
            customerEmail,
            billingAddress,
            itemName,
            amount,
            tax,
            total,
            paymentMethod: 'Stripe Card'
          })
          console.log(`[Stripe Webhook] Invoice PDF generated at: ${pdfUrl}`)
        } catch (e) {
          console.error('Failed to generate invoice PDF:', e)
        }

        // Insert invoice record in database
        const { error: invError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            user_id: customerEmail, // text email
            transaction_id: paymentIntentId,
            amount,
            tax,
            total,
            tax_type: tax > 0 ? 'GST' : 'NONE',
            status: 'paid',
            billing_address: invoice.customer_address || {},
            plan: planName,
            pdf_url: pdfUrl
          })

        if (invError) {
          console.error('[Stripe Webhook] Error writing invoice to database:', invError.message)
        }

        // Send Purchase Confirmation Email with Attachment
        if (pdfUrl) {
          try {
            const html = getPurchaseConfirmationEmail({
              userName: customerName,
              itemName,
              amount: `₹${total.toFixed(2)}`,
              transactionId: paymentIntentId,
              date: new Date(invoice.created * 1000).toLocaleDateString()
            })

            const filePath = path.join(process.cwd(), 'public', pdfUrl)
            if (fs.existsSync(filePath)) {
              const pdfBase64 = fs.readFileSync(filePath).toString('base64')
              await sendEmail({
                to: customerEmail,
                subject: `Your Course Purchase is Confirmed! (Invoice: ${invoiceNumber})`,
                html,
                emailType: 'purchase_confirmation',
                attachments: [{
                  content: pdfBase64,
                  filename: `Invoice_${invoiceNumber}.pdf`,
                  type: 'application/pdf'
                }]
              })
            } else {
              console.error(`[Stripe Webhook] Generated PDF not found at path: ${filePath}`)
            }
          } catch (e) {
            console.error('Failed to send purchase confirmation email:', e)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const customerEmail = invoice.customer_email
        const stripeSubscriptionId = invoice.subscription as string

        if (!customerEmail) {
          console.error('[Stripe Webhook] No customer email for failed payment event')
          break
        }

        console.log(`[Stripe Webhook] Processing invoice.payment_failed for ${customerEmail}`)

        // Increment retry count or log failed payment
        const { data: existingFailed } = await supabase
          .from('failed_payments')
          .select('id, retry_count')
          .eq('user_id', customerEmail)
          .eq('subscription_id', stripeSubscriptionId || '')
          .eq('status', 'failed')
          .maybeSingle()

        let retryCount = 1
        if (existingFailed) {
          retryCount = (existingFailed.retry_count || 0) + 1
          await supabase
            .from('failed_payments')
            .update({
              retry_count: retryCount,
              failure_reason: invoice.last_payment_error?.message || 'Card declined',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFailed.id)
        } else {
          await supabase
            .from('failed_payments')
            .insert({
              user_id: customerEmail,
              subscription_id: stripeSubscriptionId || null,
              amount: (invoice.amount_due || 0) / 100,
              failure_reason: invoice.last_payment_error?.message || 'Card declined',
              retry_count: retryCount,
              status: 'failed'
            })
        }

        // Email customer
        try {
          const customerName = invoice.customer_name || 'Student'
          const planName = stripeSubscriptionId ? 'Subscription Renewal' : 'Course Platform Plan'
          const html = getFailedPaymentEmail({
            userName: customerName,
            planName,
            amount: `₹${((invoice.amount_due || 0) / 100).toFixed(2)}`,
            attemptNumber: retryCount
          })

          await sendEmail({
            to: customerEmail,
            subject: `Action Required: Subscription Payment Failed`,
            html,
            emailType: 'failed_payment'
          })
        } catch (e) {
          console.error('Failed to send payment failure email:', e)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string
        const chargeId = charge.id

        console.log(`[Stripe Webhook] Processing charge.refunded for payment intent ${paymentIntentId}`)

        // Find invoice by transaction_id (matches paymentIntentId or chargeId)
        let { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('transaction_id', paymentIntentId)
          .maybeSingle()

        if (!invData && chargeId) {
          const { data: invDataFallback } = await supabase
            .from('invoices')
            .select('*')
            .eq('transaction_id', chargeId)
            .maybeSingle()
          invData = invDataFallback
        }

        if (!invData) {
          console.error(`[Stripe Webhook] Invoice not found for refunded transaction: ${paymentIntentId || chargeId}`)
          break
        }

        // Update invoice status to refunded
        await supabase
          .from('invoices')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', invData.id)

        // Insert refund record
        const refundAmount = (charge.amount_refunded || 0) / 100
        const refundReason = charge.failure_message || 'Refunded via Stripe'
        await supabase
          .from('refunds')
          .insert({
            invoice_id: invData.id,
            amount: refundAmount,
            status: 'approved',
            reason: refundReason
          })

        // Generate Credit Note PDF
        const refundInvoiceNumber = `REF-${invData.invoice_number}`
        let refundPdfUrl = ''
        try {
          refundPdfUrl = await generateInvoicePDF({
            invoiceNumber: refundInvoiceNumber,
            transactionId: chargeId,
            date: new Date().toLocaleDateString(),
            customerName: charge.billing_details?.name || 'Student',
            customerEmail: charge.billing_details?.email || invData.user_id,
            billingAddress: invData.billing_address || '',
            itemName: `Refund Credit Note - ${invData.plan || 'Plan'}`,
            amount: -refundAmount,
            tax: 0,
            total: -refundAmount,
            paymentMethod: 'Stripe Refund'
          })
        } catch (e) {
          console.error('Failed to generate refund PDF:', e)
        }

        // Email customer
        try {
          const customerEmail = charge.billing_details?.email || invData.user_id
          const customerName = charge.billing_details?.name || 'Student'
          const html = getRefundConfirmationEmail({
            userName: customerName,
            invoiceNumber: invData.invoice_number,
            amount: `₹${refundAmount.toFixed(2)}`,
            reason: refundReason
          })

          const filePath = path.join(process.cwd(), 'public', refundPdfUrl)
          if (fs.existsSync(filePath)) {
            const pdfBase64 = fs.readFileSync(filePath).toString('base64')
            await sendEmail({
              to: customerEmail,
              subject: `Your Refund Has Been Processed`,
              html,
              emailType: 'refund_confirmation',
              attachments: [{
                content: pdfBase64,
                filename: `CreditNote_${refundInvoiceNumber}.pdf`,
                type: 'application/pdf'
              }]
            })
          }
        } catch (e) {
          console.error('Failed to send refund confirmation email:', e)
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}