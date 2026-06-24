export const runtime = 'edge';

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

    // 1. Fetch all invoices
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')

    if (invError) {
      console.error('Error fetching invoices for stats:', invError)
      return NextResponse.json({ error: invError.message }, { status: 500 })
    }

    // 2. Fetch all refunds
    const { data: refunds, error: refError } = await supabase
      .from('refunds')
      .select('*')

    if (refError) {
      console.error('Error fetching refunds for stats:', refError)
      return NextResponse.json({ error: refError.message }, { status: 500 })
    }

    // 3. Fetch active subscriptions count
    const { count: activeSubs, error: subError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .neq('plan', 'free')

    // Calculate core metrics
    const paidInvoices = (invoices || []).filter(inv => inv.status === 'paid')
    const refundedInvoices = (invoices || []).filter(inv => inv.status === 'refunded')

    const grossRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)
    const totalRefunds = (refunds || []).reduce((sum, ref) => sum + Number(ref.amount || 0), 0)
    const netRevenue = grossRevenue - totalRefunds

    const totalTransactions = paidInvoices.length + refundedInvoices.length
    const aov = paidInvoices.length > 0 ? grossRevenue / paidInvoices.length : 0
    const refundRate = totalTransactions > 0 ? (refundedInvoices.length / totalTransactions) * 100 : 0

    // Compute monthly timelines for charting (past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const timelineData: Record<string, { gross: number; refunds: number; net: number }> = {}

    // Initialize past 6 months
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`
      timelineData[label] = { gross: 0, refunds: 0, net: 0 }
    }

    // Populate timeline from invoices
    paidInvoices.forEach((inv: any) => {
      const date = new Date(inv.created_at)
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`
      if (timelineData[label] !== undefined) {
        timelineData[label].gross += Number(inv.total || 0)
        timelineData[label].net += Number(inv.total || 0)
      }
    });

    // Populate timeline from refunds
    (refunds || []).forEach((ref: any) => {
      const date = new Date(ref.created_at)
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`
      if (timelineData[label] !== undefined) {
        timelineData[label].refunds += Number(ref.amount || 0)
        timelineData[label].net -= Number(ref.amount || 0)
      }
    });

    const chartTimeline = Object.entries(timelineData).map(([name, val]) => ({
      name,
      gross: Number(val.gross.toFixed(2)),
      refunds: Number(val.refunds.toFixed(2)),
      net: Number(val.net.toFixed(2))
    }))

    return NextResponse.json({
      metrics: {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        totalRefunds: Number(totalRefunds.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        activeSubscriptions: activeSubs || 0,
        aov: Number(aov.toFixed(2)),
        refundRate: Number(refundRate.toFixed(2))
      },
      chartTimeline
    })
  } catch (err: any) {
    console.error('Financial stats calculations error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}