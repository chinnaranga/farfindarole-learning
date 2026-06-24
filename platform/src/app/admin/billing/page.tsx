export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  FileText, 
  Download, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  ArrowLeft, 
  Check, 
  X, 
  Info,
  IndianRupee,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminBillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [token, setToken] = useState('')
  
  // Analytics Metrics
  const [metrics, setMetrics] = useState({
    grossRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    activeSubscriptions: 0,
    aov: 0,
    refundRate: 0
  })
  const [chartTimeline, setChartTimeline] = useState<any[]>([])

  // Invoices & Search
  const [invoices, setInvoices] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fetchingInvoices, setFetchingInvoices] = useState(false)

  // Refunds
  const [refunds, setRefunds] = useState<any[]>([])
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null)

  // Tax reports config
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString())
  const [taxQuarter, setTaxQuarter] = useState('all')
  const [downloadingTax, setDownloadingTax] = useState(false)

  // Action status messages
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    async function authenticateAndLoad() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session || session.user.email !== 'admin@farfindarole.com') {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        setIsAdmin(true)
        setToken(session.access_token)

        // Fetch Financial Stats
        const statsRes = await fetch('/api/admin/financial-stats', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setMetrics(statsData.metrics || {})
          setChartTimeline(statsData.chartTimeline || [])
        }

        // Fetch Invoices
        await loadInvoices(session.access_token)

        // Fetch Refunds list
        const refundsRes = await fetch('/api/admin/refunds', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        if (refundsRes.ok) {
          const refundData = await refundsRes.json()
          setRefunds(refundData.refunds || [])
        }

      } catch (err) {
        console.error('Admin init failure:', err)
      } finally {
        setLoading(false)
      }
    }

    authenticateAndLoad()
  }, [])

  const loadInvoices = async (accessToken: string, search = '') => {
    setFetchingInvoices(true)
    try {
      const url = `/api/admin/invoices${search ? `?search=${encodeURIComponent(search)}` : ''}`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetchingInvoices(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadInvoices(token, searchQuery)
  }

  const handleResendInvoice = async (invoiceId: string) => {
    showActionMessage('info', 'Attempting to resend invoice email...')
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceId })
      })

      if (res.ok) {
        showActionMessage('success', 'Invoice copy re-sent successfully!')
      } else {
        const data = await res.json()
        showActionMessage('error', `Failed to send: ${data.error || 'Server error'}`)
      }
    } catch (e: any) {
      showActionMessage('error', `Exception occurred: ${e.message}`)
    }
  }

  const handleProcessRefund = async (invoiceId: string, amount: number, approve: boolean) => {
    setProcessingRefundId(invoiceId)
    showActionMessage('info', 'Processing refund transaction...')
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId,
          amount,
          reason: approve ? 'Admin approved claim' : 'Admin rejected'
        })
      })

      if (res.ok) {
        showActionMessage('success', 'Refund approved and credit note sent!')
        // Reload dashboard states
        const statsRes = await fetch('/api/admin/financial-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setMetrics(statsData.metrics || {})
        }

        const refundsRes = await fetch('/api/admin/refunds', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (refundsRes.ok) {
          const refundData = await refundsRes.json()
          setRefunds(refundData.refunds || [])
        }

        loadInvoices(token, searchQuery)
      } else {
        const data = await res.json()
        showActionMessage('error', `Failed to process: ${data.error || 'Server error'}`)
      }
    } catch (e: any) {
      showActionMessage('error', `Refund exception: ${e.message}`)
    } finally {
      setProcessingRefundId(null)
    }
  }

  const handleDownloadTaxReport = async () => {
    setDownloadingTax(true)
    try {
      const url = `/api/admin/tax-reports?year=${taxYear}&quarter=${taxQuarter === 'all' ? '' : taxQuarter}&format=csv`
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `TaxReport_${taxYear}_${taxQuarter}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        showActionMessage('success', 'Tax CSV report downloaded successfully!')
      } else {
        showActionMessage('error', 'Failed to generate tax report.')
      }
    } catch (err: any) {
      showActionMessage('error', `Download error: ${err.message}`)
    } finally {
      setDownloadingTax(false)
    }
  }

  const showActionMessage = (type: string, text: string) => {
    setActionMsg({ type, text })
    setTimeout(() => {
      setActionMsg({ type: '', text: '' })
    }, 4000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <RefreshCw className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-slate-400 font-semibold">Authorizing Admin Session...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Restrict</h1>
        <p className="text-slate-400 max-w-md mb-6">This workstation portal is reserved strictly for platform administrators.</p>
        <Link href="/admin/login" className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-xl transition">
          Go to Admin Login
        </Link>
      </div>
    )
  }

  // Filter out pending refund claims to display in dashboard queue
  const pendingRefunds = refunds.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background radial effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-6 flex justify-between items-center">
          <Link href="/admin" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition duration-150">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="text-xs text-slate-500 font-medium">
            ADMIN WORKSPACE PORTAL
          </div>
        </div>

        {/* Brand Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Billing & Financial Automation Portal
            </h1>
            <p className="text-slate-400 mt-1">Review live metrics, download quarterly tax spreadsheets, and manage student refund logs.</p>
          </div>
        </div>

        {/* Action Status Notification */}
        {actionMsg.text && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
            actionMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            actionMsg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            <Info className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{actionMsg.text}</span>
          </div>
        )}

        {/* 1. FINANCIAL METRICS ANCHORS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
              <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold">₹{metrics.grossRevenue.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Gross</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Refund Adjusts</span>
              <span className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-500">₹{metrics.totalRefunds.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Returned</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Platform Earnings</span>
              <span className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400">₹{metrics.netRevenue.toLocaleString()}</span>
              <span className="text-xs text-slate-500">Net Sales</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Subscriptions</span>
              <span className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{metrics.activeSubscriptions}</span>
              <span className="text-xs text-slate-500">Pro Users</span>
            </div>
          </div>

        </div>

        {/* 2. MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Middle/Left Column: Invoices & Refund processing */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Refund Queue Manager */}
            {pendingRefunds.length > 0 && (
              <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl p-6">
                <h2 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Pending Student Refund Claims ({pendingRefunds.length})
                </h2>

                <div className="space-y-4">
                  {pendingRefunds.map(ref => {
                    const invoice = ref.invoices || {}
                    return (
                      <div 
                        key={ref.id} 
                        className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">Invoice: {invoice.invoice_number || 'N/A'}</span>
                            <span className="text-xs text-slate-400">({invoice.user_id})</span>
                          </div>
                          <p className="text-xs text-slate-500 italic">"Reason: {ref.reason || 'Not specified'}"</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-extrabold text-lg text-amber-500">₹{Number(ref.amount).toFixed(2)}</span>
                          <div className="flex gap-2">
                            <button
                              disabled={processingRefundId === ref.invoice_id}
                              onClick={() => handleProcessRefund(ref.invoice_id, ref.amount, true)}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50"
                              title="Approve Refund"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              disabled={processingRefundId === ref.invoice_id}
                              onClick={() => handleProcessRefund(ref.invoice_id, ref.amount, false)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-red-500 rounded-xl transition disabled:opacity-50"
                              title="Reject Claim"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Invoices List table */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold">Verification Invoice Ledger</h2>
                  <p className="text-xs text-slate-400">Search and audit customer payment transactions</p>
                </div>
                
                {/* Search form */}
                <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Invoice # or Email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pl-9 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-3" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    Search
                  </button>
                </form>
              </div>

              {fetchingInvoices ? (
                <div className="flex justify-center p-12">
                  <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center p-12 bg-slate-950/40 border border-slate-800/40 rounded-2xl text-slate-500 text-xs">
                  No invoices matched your query parameters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-3 font-semibold">INVOICE NUMBER</th>
                        <th className="pb-3 font-semibold">CUSTOMER</th>
                        <th className="pb-3 font-semibold">STATUS</th>
                        <th className="pb-3 font-semibold">TOTAL</th>
                        <th className="pb-3 font-semibold text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-900/20 transition">
                          <td className="py-4 font-bold text-slate-200">{inv.invoice_number}</td>
                          <td className="py-4 text-slate-400">
                            {inv.user_id}
                            <span className="block text-3xs text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</span>
                          </td>
                          <td className="py-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-3xs font-extrabold ${
                              inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                              inv.status === 'refunded' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 font-extrabold text-white">₹{Number(inv.total).toFixed(2)}</td>
                          <td className="py-4 text-right flex justify-end gap-2">
                            {inv.pdf_url && (
                              <a
                                href={inv.pdf_url}
                                download
                                className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                                title="Download Slip"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleResendInvoice(inv.id)}
                              className="px-2 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-400 text-3xs font-bold rounded-lg transition"
                            >
                              Resend Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Tax report exporter & timeline charts */}
          <div className="space-y-8">
            
            {/* Tax Exporter Utility */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Tax & GST/VAT Exporter</h3>
                  <p className="text-3xs text-slate-400">Generate quarterly collections spreadsheets</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-3xs font-semibold text-slate-500 mb-1">SELECT CALENDAR YEAR</label>
                  <select
                    value={taxYear}
                    onChange={(e) => setTaxYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="2026">2026 Calendar Year</option>
                    <option value="2025">2025 Calendar Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-3xs font-semibold text-slate-500 mb-1">QUARTER TIMEFRAME</label>
                  <select
                    value={taxQuarter}
                    onChange={(e) => setTaxQuarter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="all">Full Annual (all quarters)</option>
                    <option value="Q1">Q1 (Jan - Mar)</option>
                    <option value="Q2">Q2 (Apr - Jun)</option>
                    <option value="Q3">Q3 (Jul - Sep)</option>
                    <option value="Q4">Q4 (Oct - Dec)</option>
                  </select>
                </div>

                <button
                  onClick={handleDownloadTaxReport}
                  disabled={downloadingTax}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  {downloadingTax ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Compiling CSV...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" /> Download CSV Spreadsheet
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Simple timeline chart representation */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <h3 className="font-bold mb-4">Historical Income Stream</h3>
              
              {chartTimeline.length === 0 ? (
                <p className="text-3xs text-slate-500">No chart data computed yet.</p>
              ) : (
                <div className="space-y-3">
                  {chartTimeline.map((item, idx) => {
                    const maxVal = Math.max(...chartTimeline.map(c => c.net), 1)
                    const percent = Math.max(10, (item.net / maxVal) * 100)

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-3xs">
                          <span className="text-slate-400 font-medium">{item.name}</span>
                          <span className="font-bold text-slate-200">₹{item.net.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                          <div 
                            style={{ width: `${percent}