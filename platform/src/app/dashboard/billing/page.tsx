'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Award, 
  ArrowLeft, 
  Download, 
  Share2, 
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Building,
  ShieldAlert,
  Calendar,
  Lock,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UserBillingPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [certificates, setCertificates] = useState<any[]>([])

  useEffect(() => {
    async function loadBillingData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setLoading(false)
          return
        }
        setUser(authUser)

        // Fetch Certificates (joined with course title)
        const { data: certData } = await supabase
          .from('certificates')
          .select('*, courses(title)')
          .eq('user_id', authUser.email)
        setCertificates(certData || [])

      } catch (err) {
        console.error('Error loading user billing:', err)
      } finally {
        setLoading(false)
      }
    }

    loadBillingData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Synchronizing credentials and licenses...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-brand-secondary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md mb-6">You must be logged in to view your credentials and licensing details.</p>
        <Link href="/login" className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/95 font-bold text-white rounded-xl transition duration-200">
          Go to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 select-none">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        
        {/* Header Breadcrumbs */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium transition duration-150">
            <ArrowLeft className="w-4 h-4" /> Back to Workstation
          </Link>
        </div>

        {/* Brand Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Credentials & Sponsorship
            </h1>
            <p className="text-slate-600 mt-1">Inspect your enterprise-sponsored license, view verified certificates, and manage graduation badges.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-secondary animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">{user.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Sponsorship Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Sponsorship Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-primary/5 to-transparent rounded-bl-3xl" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Institutional License & Sponsorship</h2>
                  <p className="text-xs text-slate-500">Your seat is sponsored by an enterprise partner</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase tracking-wider">SPONSORING ORGANIZATION</span>
                  <span className="text-lg font-extrabold text-brand-primary">
                    FarFindARole Academy
                  </span>
                  <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 uppercase">
                    Sponsored
                  </span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase tracking-wider">LICENSE EXPIRATION</span>
                  <span className="text-lg font-bold text-slate-800">
                    Perpetual / Perpetual
                  </span>
                  <span className="text-[10px] text-slate-550 block mt-1">
                    Managed corporate seat credits
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-100 bg-brand-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Licensed Capabilities Unlocked</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>All Course Specializations Unlocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>Unlimited Coding Arena Sandboxes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>Personalized AI Roadmaps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>AI Mock Interviews & Assessments</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter Integration Info Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-850">Recruiter Pipeline Integration</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your workstation is connected to the FarFindARole global recruiting pipeline. Your coding achievements, sandbox completions, and verified certificates are compiled into a secure portfolio. Partner organizations and hiring teams can discover your achievements directly under Seat ID: <strong className="text-slate-800 font-mono select-all">FR-SEAT-2938X-{user.id.slice(0,4).toUpperCase()}</strong>.
              </p>
            </div>

          </div>

          {/* Right Column: Verifiable Certificates & Accomplishments */}
          <div className="space-y-8">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-3xl" />

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Verifiable Certificates</h2>
                  <p className="text-xs text-slate-500">Share your graduation accomplishments</p>
                </div>
              </div>

              {certificates.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl text-center border border-slate-200">
                  <Award className="w-10 h-10 text-slate-350 mb-2" />
                  <p className="text-slate-600 font-medium text-sm">No certificates earned yet</p>
                  <p className="text-xs text-slate-500 mt-1">Complete a course syllabus to 100% to unlock a PDF credential.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert) => {
                    const certFullUrl = `${window.location.origin}${cert.certificate_url}`
                    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certFullUrl)}`
                    
                    return (
                      <div 
                        key={cert.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
                      >
                        <div>
                          <span className="text-[10px] text-brand-secondary font-bold tracking-wider block mb-1 uppercase">GRADUATE CREDENTIAL</span>
                          <span className="font-bold text-slate-800 text-sm block leading-tight">{cert.courses?.title || 'Course Syllabus'}</span>
                          <span className="text-[10px] text-slate-500">Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                          <a
                            href={`/api/courses/certificate/download?courseId=${cert.course_id}&userId=${encodeURIComponent(user?.email || '')}&sendEmail=true`}
                            download
                            onClick={() => {
                              alert(`Your certificate download has started, and a copy has been sent to your registered email: ${user?.email}`);
                            }}
                            className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-350 hover:text-slate-900 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center justify-center decoration-none shadow-2xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                          
                          <a
                            href={linkedinShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 bg-brand-primary/5 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/15 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
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

            {/* Sponsorship FAQ */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand-secondary" /> Sponsorship FAQ
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">How is my account sponsored?</h4>
                  <p className="text-slate-500">Academic institutions and corporate partners purchase bulk site licenses, which grant their designated students and employees unlimited, perpetual access to our workstation.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">How do I verify credentials?</h4>
                  <p className="text-slate-500">Graduation certificates are cryptographically verified. Each certificate includes a custom URL containing an authentic verification hash that employers can use to verify your skills.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
