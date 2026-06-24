import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getRefundConfirmationEmail } from '@/lib/email-templates'
import { generateInvoicePDF } from '@/lib/pdf-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (!error && user && user.email === 'admin@farfindarole.com') {
      return true
    }
  }
  return false
}

export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*, invoices(invoice_number, user_id, amount, plan, pdf_url)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching refunds:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ refunds })
  } catch (err: any) {
    console.error('Admin refunds error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { invoiceId, amount, reason } = await req.json()

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Missing invoiceId or amount' }, { status: 400 })
    }

    // Retrieve original invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    if (invError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'refunded') {
      return NextResponse.json({ error: 'Invoice is already refunded' }, { status: 400 })
    }

    // Create refund record
    const { data: refund, error: refError } = await supabase
      .from('refunds')
      .insert({
        invoice_id: invoiceId,
        amount,
        status: 'approved',
        reason: reason || 'Admin manual refund'
      })
      .select()
      .single()

    if (refError) {
      console.error('Failed to create refund record:', refError)
      return NextResponse.json({ error: refError.message }, { status: 500 })
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', invoiceId)

    if (updateError) {
      console.error('Failed to update invoice status:', updateError)
    }

    // Compile Credit Note PDF in-memory
    const refundInvoiceNumber = `REF-${invoice.invoice_number}`
    let pdfBuffer: Buffer | null = null
    try {
      pdfBuffer = await generateInvoicePDF({
        invoiceNumber: refundInvoiceNumber,
        transactionId: invoice.transaction_id || 'N/A',
        date: new Date().toLocaleDateString('en-US'),
        customerName: 'Student',
        customerEmail: invoice.user_id,
        billingAddress: '',
        itemName: `Refund Credit Note - ${invoice.plan || 'Plan'}`,
        amount: -amount,
        tax: 0,
        total: -amount,
        paymentMethod: 'Stripe Refund'
      })
    } catch (e) {
      console.error('Failed to generate credit note PDF:', e)
    }

    // Send refund confirmation email
    try {
      const html = getRefundConfirmationEmail({
        userName: 'Student',
        invoiceNumber: invoice.invoice_number,
        amount: `₹${Number(amount).toFixed(2)}`,
        reason: reason || 'Admin manual refund'
      })

      let attachments: any[] = []
      if (pdfBuffer) {
        attachments = [{
          content: pdfBuffer.toString('base64'),
          filename: `CreditNote_${refundInvoiceNumber}.pdf`,
          type: 'application/pdf'
        }]
      }

      await sendEmail({
        to: invoice.user_id,
        subject: `Your Refund Has Been Processed`,
        html,
        emailType: 'refund_confirmation',
        attachments
      })
    } catch (e) {
      console.error('Failed to send refund email:', e)
    }

    return NextResponse.json({ success: true, refund })
  } catch (err: any) {
    console.error('Manual refund error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
