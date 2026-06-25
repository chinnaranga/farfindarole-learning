'use client'

import Link from 'next/link'
import { Landmark, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function PricingTermsPage() {
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
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-brand-secondary uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Workforce Licensing &amp; Terms
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
        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-brand-primary uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-primary" /> TL;DR — Summary of Licensing
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            FarFindARole Learn is an institutional platform. Access is granted through sponsored scholar accounts, university partnerships, or corporate workforce licenses. Individual subscription sales are suspended.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Institutional Seat Allocation</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Workstation seats are assigned directly to students and engineers through organizational sponsorship keys. Sharing assigned seat credentials, credentials transfer outside your sponsoring university or corporation, or selling seats to third parties is strictly prohibited.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Sponsored Workspace Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              All active sponsored users enjoy full, unrestricted access to our interactive coding environments, mock interviews, AI mentoring models, and cryptographically signed graduation certificates. Workstations are fully funded by institutional partner agreements.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. System & API Usage Limits</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              AI outline tools and coding sandboxes are provided under fair-use guidelines to prevent resource abuse. Deploying scraping bots, automated scripts, or attempting to overload our compiler nodes violates workspace licensing policies and will result in seat suspension.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Recruiter Pipeline Integrity</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              By participating in sponsored student programs, you can opt-in to link your progress and certifications to the recruiter hiring pipeline. Providing false profile metadata or attempting to spoof coding arena scores is a violation of academic integrity.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Taxation & Institutional Billing</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              All enterprise site licenses are negotiated and processed directly via institutional purchase orders. Individual students are never charged local GST, card processing, or upgrade fees.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Policy Amendments</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              FarFindARole Academy reserves the right to adjust workspace allocations, course syllabus paths, and pipeline features to align with global engineering standards. Any major changes are coordinated directly with institutional administrators.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have licensing questions?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Contact our partner relations office.</p>
          </div>
          <a
            href="mailto:partners@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-brand-secondary hover:text-brand-secondary/80 transition"
          >
            <Mail className="w-4 h-4" /> partners@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}
