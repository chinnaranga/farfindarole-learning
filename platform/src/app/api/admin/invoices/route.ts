export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getInvoiceResendEmail } from '@/lib/email-templates'
import { getAllUsers } from '@/lib/server-store'
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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false })

    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,user_id.ilike.%${search}%`)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoices })
  } catch (err: any) {
    console.error('Admin invoices error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin(req))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    // Retrieve invoice details
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Resolve user name using server-store
    const users = getAllUsers()
    const matchingUser = users.find((u: any) => u.email.toLowerCase() === invoice.user_id.toLowerCase())
    const customerName = matchingUser?.name || 'Student'
    const customerEmail = invoice.user_id

    const html = getInvoiceResendEmail({
      userName: customerName,
      invoiceNumber: invoice.invoice_number
    })

    let attachments: any[] = []
    try {
      // Regenerate invoice PDF on the fly in-memory to avoid filesystem dependencies
      const invoicePdfData = {
        invoiceNumber: invoice.invoice_number,
        transactionId: invoice.transaction_id || 'N/A',
        date: new Date(invoice.created_at).toLocaleDateString('en-US'),
        customerName,
        customerEmail,
        billingAddress: invoice.billing_address || '',
        itemName: invoice.item_name || 'Premium Access Subscription',
        amount: invoice.amount || 0,
        tax: invoice.tax || 0,
        total: invoice.total || 0,
        paymentMethod: invoice.payment_method || 'Stripe Card'
      }
      const pdfBuffer = await generateInvoicePDF(invoicePdfData)
      attachments = [{
        content: pdfBuffer.toString('base64'),
        filename: `Invoice_${invoice.invoice_number}.pdf`,
        type: 'application/pdf'
      }]
    } catch (pdfErr) {
      console.error('Failed to regenerate invoice PDF for resend:', pdfErr)
    }

    const emailRes = await sendEmail({
      to: customerEmail,
      subject: `Invoice Copy: ${invoice.invoice_number}`,
      html,
      emailType: 'invoice_resend',
      attachments
    })

    if (!emailRes.success) {
      return NextResponse.json({ error: `Failed to resend email: ${emailRes.error}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin invoices resend error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
