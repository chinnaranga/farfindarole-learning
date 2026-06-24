export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { UserCheck, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function AccountTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-emerald-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-emerald-200 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                User Account Terms &amp; Rules
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-bold border-t border-slate-100 pt-4">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[10px] text-slate-600">Version 1.0</span>
            <span>&bull;</span>
            <span>Last Updated: June 21, 2026</span>
          </div>
        </div>

        {/* TL;DR Summary Box */}
        <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-650" /> TL;DR — Summary of Account Terms
          </h2>
          <p className="text-xs text-indigo-950/80 leading-relaxed font-semibold">
            To hold an account you must be at least 13 (or 18 depending on region), verify your email address, maintain password safety, and accept sole responsibility for all activities registered under your credentials.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Signup Requirements</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You must register using a valid, individual email address. Creating placeholder profiles, masquerading as other individuals, or using temporary disposal emails to access resources is prohibited.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Age Eligibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You must be at least thirteen (13) years old to create a self-managed account. If you are under the age of eighteen (18), you represent that you have received parental or legal guardian consent to register and participate in courses.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Email &amp; Identity Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We require double-opt-in email verification to complete registrations. Unverified accounts may be locked or auto-pruned from databases after thirty (30) days of inactivity. We reserve the right to verify user identities at any time.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Login Security Guidelines</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You must create a strong password containing at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character. You must not disclose login credentials to third parties. We are not responsible for hacking incidents arising from weak passwords.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Activity Responsibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You assume full legal and operational responsibility for all actions, comments, stripe checkouts, and progress submissions executed under your account credentials. You agree to notify us immediately at the support contact email if you detect unauthorized breaches.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Need account support?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">We respond within 2-3 business days.</p>
          </div>
          <a
            href="mailto:support@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-indigo-650 hover:text-indigo-755 transition"
          >
            <Mail className="w-4 h-4" /> support@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}