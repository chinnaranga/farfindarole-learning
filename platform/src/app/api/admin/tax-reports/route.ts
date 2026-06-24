export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const quarter = searchParams.get('quarter') // 'Q1', 'Q2', 'Q3', 'Q4' or 'all'
    const format = searchParams.get('format') || 'json' // 'json' or 'csv'

    let startDateStr = `${year}-01-01T00:00:00.000Z`
    let endDateStr = `${year}-12-31T23:59:59.999Z`

    if (quarter) {
      if (quarter === 'Q1') {
        startDateStr = `${year}-01-01T00:00:00.000Z`
        endDateStr = `${year}-03-31T23:59:59.999Z`
      } else if (quarter === 'Q2') {
        startDateStr = `${year}-04-01T00:00:00.000Z`
        endDateStr = `${year}-06-30T23:59:59.999Z`
      } else if (quarter === 'Q3') {
        startDateStr = `${year}-07-01T00:00:00.000Z`
        endDateStr = `${year}-09-30T23:59:59.999Z`
      } else if (quarter === 'Q4') {
        startDateStr = `${year}-10-01T00:00:00.000Z`
        endDateStr = `${year}-12-31T23:59:59.999Z`
      }
    }

    // Fetch invoices within range
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr)
      .eq('status', 'paid')

    if (error) {
      console.error('Error fetching tax data:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compute summaries
    let totalSales = 0
    let totalTax = 0
    let gstCollections = 0
    let vatCollections = 0
    let noneCollections = 0

    const rows = (invoices || []).map(inv => {
      const amt = Number(inv.amount || 0)
      const tx = Number(inv.tax || 0)
      const tot = Number(inv.total || 0)
      totalSales += amt
      totalTax += tx

      if (inv.tax_type === 'GST') gstCollections += tx
      else if (inv.tax_type === 'VAT') vatCollections += tx
      else noneCollections += tx

      return {
        invoiceNumber: inv.invoice_number,
        date: new Date(inv.created_at).toLocaleDateString(),
        customer: inv.user_id,
        plan: inv.plan,
        amount: amt,
        tax: tx,
        taxType: inv.tax_type,
        total: tot
      }
    })

    const summary = {
      period: quarter ? `${year} ${quarter}` : `${year} Full Year`,
      invoiceCount: rows.length,
      totalSales,
      totalTax,
      taxBreakdown: {
        GST: gstCollections,
        VAT: vatCollections,
        NONE: noneCollections
      }
    }

    if (format === 'csv') {
      // Compile CSV string
      const headers = ['Invoice Number', 'Date', 'Customer Email', 'Plan', 'Amount (INR)', 'Tax (INR)', 'Tax Type', 'Total (INR)']
      const csvLines = [headers.join(',')]
      rows.forEach(r => {
        csvLines.push([
          r.invoiceNumber,
          r.date,
          r.customer,
          r.plan,
          r.amount.toFixed(2),
          r.tax.toFixed(2),
          r.taxType,
          r.total.toFixed(2)
        ].join(','))
      })

      // Add summary details at the bottom of the CSV
      csvLines.push('\n')
      csvLines.push('SUMMARY,')
      csvLines.push(`Total Transactions,${summary.invoiceCount}`)
      csvLines.push(`Total Net Sales,${summary.totalSales.toFixed(2)}`)
      csvLines.push(`Total Taxes Collected,${summary.totalTax.toFixed(2)}`)
      csvLines.push(`GST Collected,${summary.taxBreakdown.GST.toFixed(2)}`)
      csvLines.push(`VAT Collected,${summary.taxBreakdown.VAT.toFixed(2)}`)

      const csvContent = csvLines.join('\n')
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tax_report_${summary.period.replace(/\s+/g, '_')}.csv"`
        }
      })
    }

    return NextResponse.json({ summary, records: rows })
  } catch (err: any) {
    console.error('Tax reports error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
