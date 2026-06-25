'use client'

import Link from 'next/link'
import { RotateCw, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function SubscriptionTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative select-none">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-secondary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-905 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/15 flex items-center justify-center text-brand-primary">
              <RotateCw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Sponsorship &amp; Scholar Terms
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-bold border-t border-slate-100 pt-4">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[10px] text-slate-600">Version 2.0</span>
            <span>&bull;</span>
            <span>Last Updated: June 25, 2026</span>
          </div>
        </div>

        {/* TL;DR Summary Box */}
        <div className="bg-brand-secondary/5 border border-brand-secondary/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-brand-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-secondary" /> TL;DR — Summary of Sponsorship
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            Workstations are fully sponsored. Sponsoring companies or academic institutions fund all scholar seats on recurring annual cycles. Scholars pay zero out-of-pocket subscription fees.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Sponsorship Allocation Cycle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Sponsor licenses are granted on a perpetual or multi-year recurring agreement funded entirely by corporate placement partners or academic organizations. Scholar seats remain fully active and funded as long as the institutional agreement remains active.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Scholar Eligibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              To maintain an active sponsored seat, scholars must be enrolled at a partner college, university, training bootcamp, or participate in a corporate upskilling program. Verified disenrollment or leaving the sponsor organization may result in seat reassignment.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Perpetual Free Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Sponsorship ensures that individual learners pay zero out-of-pocket costs for advanced workstation modules, sandboxes, AI tools, or verified credentials. There are no recurring personal cards charged and no auto-renewal billing cycles.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Academic Integrity & Non-Proration</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Sponsorship seats represent highly valuable training assets. If a scholar fails to engage with workspace courses or violates academic integrity guidelines, the institutional administrator reserves the right to reallocate the seat immediately to another scholar.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Seat Scaling & Upgrades</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Institutional administrators can dynamically scale, upgrade, or allocate additional student seats via their administrative console. Adjustments to bulk site licenses do not disrupt active student learning sessions.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Institutional Service Continuity</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              In the event of an institutional license expiration, student progress, coding arena histories, and earned credentials are saved securely. Access to premium tools is temporarily paused until sponsorship details are updated by the partner.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have sponsorship issues?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">We respond within 24 hours.</p>
          </div>
          <a
            href="mailto:sponsors@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-brand-primary hover:text-brand-primary/80 transition"
          >
            <Mail className="w-4 h-4" /> sponsors@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}
