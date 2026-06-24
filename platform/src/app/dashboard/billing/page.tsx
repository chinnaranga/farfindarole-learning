export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  CreditCard, 
  FileText, 
  Award, 
  ArrowLeft, 
  Download, 
  Share2, 
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UserBillingPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [refunds, setRefunds] = useState<any[]>([])
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null)
  
  // Refund Request Form Modal States
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [refundSuccessMsg, setRefundSuccessMsg] = useState('')

  useEffect(() => {
    async function loadBillingData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setLoading(false)
          return
        }
        setUser(authUser)

        // 1. Fetch Subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle()
        setSubscription(subData)

        // 2. Fetch Invoices
        const { data: invData } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', authUser.email)
          .order('created_at', { ascending: false })
        setInvoices(invData || [])

        // 3. Fetch Certificates (joined with course title)
        const { data: certData } = await supabase
          .from('certificates')
          .select('*, courses(title)')
          .eq('user_id', authUser.email)
        setCertificates(certData || [])

        // 4. Fetch Refunds
        if (invData && invData.length > 0) {
          const invoiceIds = invData.map((i: any) => i.id)
          const { data: refData } = await supabase
            .from('refunds')
            .select('*')
            .in('invoice_id', invoiceIds)
          setRefunds(refData || [])
        }

      } catch (err) {
        console.error('Error loading user billing:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBillingData()
  }, [])

  const handleOpenRefundModal = (invoice: any) => {
    setSelectedInvoice(invoice)
    setRefundReason('')
    setRefundSuccessMsg('')
    setShowRefundModal(true)
  }

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice || !refundReason.trim()) return

    setRefunding(true)
    try {
      const { data, error } = await supabase
        .from('refunds')
        .insert({
          invoice_id: selectedInvoice.id,
          amount: selectedInvoice.total,
          status: 'pending',
          reason: refundReason
        })
        .select()
        .single()

      if (error) throw error

      setRefunds(prev => [data, ...prev])
      setRefundSuccessMsg('Your refund request was submitted successfully! An administrator will review it shortly.')
      
      // Update local invoice state status temporarily to show requested
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          return { ...inv, refundRequested: true }
        }
        return inv
      }))

      setTimeout(() => {
        setShowRefundModal(false)
      }, 3000)
    } catch (err: any) {
      console.error('Refund insert error:', err)
      alert(`Error submitting refund request: ${err.message}`)
    } finally {
      setRefunding(false)
    }
  }

  const getRefundStatus = (invoiceId: string) => {
    const matching = refunds.find(r => r.invoice_id === invoiceId)
    if (!matching) return null
    return matching.status // 'pending', 'approved', 'rejected'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Synchronizing billing records...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-400 max-w-md mb-6">You must be logged in to view your billing details and invoices.</p>
        <Link href="/login" className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-xl transition duration-200">
          Go to Login
        </Link>
      </div>
    )
  }

  const displayPlanNames: Record<string, string> = {
    free: 'Free Learner Tier',
    basic: 'Basic Scholar Plan',
    pro: 'Student Pro Membership',
    advanced: 'Advanced Specialist Plan'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header Breadcrumbs */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium transition duration-150">
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </Link>
        </div>

        {/* Brand Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Billing & Graduate Credentials
            </h1>
            <p className="text-slate-400 mt-1">Manage subscriptions, download verifiable invoices, and access your graduation certificates.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Subscription & Invoices */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Subscription Summary */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-600/20 to-transparent rounded-bl-3xl" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Active Membership Plan</h2>
                  <p className="text-xs text-slate-400">Subscription Status & Plan Details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">CURRENT TIER</span>
                  <span className="text-xl font-extrabold text-white">
                    {subscription ? displayPlanNames[subscription.plan] || subscription.plan.toUpperCase() : 'Free Tier'}
                  </span>
                  {subscription?.status === 'active' && (
                    <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-400 block mb-1">RENEWAL / EXPIRY DATE</span>
                  <span className="text-lg font-bold text-slate-200">
                    {subscription?.current_period_end 
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : 'Lifetime Access (Free)'}
                  </span>
                  <span className="text-2xs text-slate-500 block mt-1">
                    {subscription?.billing_period === 'annually' ? 'Billed annually' : subscription ? 'Billed monthly' : 'No recurring payments'}
                  </span>
                </div>
              </div>

              {subscription && subscription.plan !== 'free' && (
                <div className="mt-6 flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-slate-500" /> Billed via Stripe secure processing. Card details are never stored here.
                  </p>
                  <Link href="/pricing" className="text-sm font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition">
                    Modify Plan <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Invoices List */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Transaction History</h2>
                    <p className="text-xs text-slate-400">Verifiable tax invoices and payment slips</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-semibold text-slate-400">
                  {invoices.length} Invoices
                </span>
              </div>

              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-950/40 rounded-2xl text-center border border-slate-800/40">
                  <Inbox className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 font-medium">No invoice logs found</p>
                  <p className="text-xs text-slate-500 mt-1">Paid courses and premium subscription invoices will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((inv) => {
                    const refundStatus = getRefundStatus(inv.id)
                    const isRefunded = inv.status === 'refunded'
                    
                    return (
                      <div 
                        key={inv.id}
                        className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition duration-200"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{inv.invoice_number}</span>
                            {isRefunded ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                REFUNDED
                              </span>
                            ) : refundStatus === 'pending' ? (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-blue-500/15 text-blue-500 border border-blue-500/20">
                                REFUND PENDING
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                                PAID
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(inv.created_at).toLocaleDateString()} • {inv.plan.toUpperCase()} Plan
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6">
                          <div className="text-right">
                            <span className="font-extrabold text-lg text-white">₹{Number(inv.total).toFixed(2)}</span>
                            <span className="block text-3xs text-slate-500">Includes {inv.tax_type}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {inv.pdf_url && (
                              <a 
                                href={inv.pdf_url} 
                                download
                                className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition duration-150"
                                title="Download PDF Invoice"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            
                            {!isRefunded && !refundStatus && !inv.refundRequested && (
                              <button
                                onClick={() => handleOpenRefundModal(inv)}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold rounded-xl transition duration-150"
                              >
                                Claim Refund
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Verifiable Certificates & Accomplishments */}
          <div className="space-y-8">
            
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-600/20 to-transparent rounded-bl-3xl" />

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Verifiable Certificates</h2>
                  <p className="text-xs text-slate-400">Share your graduation accomplishments</p>
                </div>
              </div>

              {certificates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-950/40 rounded-2xl text-center border border-slate-800/40">
                  <Award className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-slate-400 font-medium text-sm">No certificates earned yet</p>
                  <p className="text-xs text-slate-500 mt-1">Complete a course syllabus to 1000 unlock a PDF credential.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert) => {
                    const certFullUrl = `${window.location.origin}${cert.certificate_url}`
                    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certFullUrl)}`
                    
                    return (
                      <div 
                        key={cert.id}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3"
                      >
                        <div>
                          <span className="text-2xs text-amber-400 font-bold tracking-wider block mb-1">GRADUATE CREDENTIAL</span>
                          <span className="font-bold text-slate-200 text-sm block leading-tight">{cert.courses?.title || 'Course Syllabus'}</span>
                          <span className="text-3xs text-slate-500">Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                          <a
                            href={`/api/courses/certificate/download?courseId=${cert.course_id}&userId=${encodeURIComponent(user?.email || '')}&sendEmail=true`}
                            download
                            onClick={() => {
                              alert(`Your certificate download has started, and a copy has been sent to your registered email: ${user?.email}`);
                            }}
                            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center justify-center decoration-none"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                          
                          <a
                            href={linkedinShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Billing Help */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6">
              <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-red-500" /> Frequently Asked Questions
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">How do I request a refund?</h4>
                  <p className="text-slate-400">Clicking "Claim Refund" next to an invoice registers a request. Refunds are processed back to the original Stripe payment method in 5-10 days.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 mb-1">Where is my certificate?</h4>
                  <p className="text-slate-400">Certificates are automatically compiled as verifiable PDFs once you reach 100