'use client'

import Link from 'next/link'
import { FileText, ArrowLeft, Mail, ShieldAlert, CheckCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-indigo-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-200 flex items-center justify-center text-red-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                General Terms &amp; Conditions
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
            <CheckCircle className="w-4 h-4 text-indigo-650" /> TL;DR — Summary of Terms
          </h2>
          <p className="text-xs text-indigo-950/80 leading-relaxed font-semibold">
            This agreement governs your use of the FarFindARole Learn platform. By registering or using our platform, you promise to follow account requirements, use the content responsibly, respect intellectual property, and accept our limits on liability.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Account Creation Rules</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              To access many parts of the platform, you must create a personal user profile. You agree to provide current, accurate, and complete registration data. Sharing user credentials to bypass course restrictions or sharing account usage is strictly forbidden. You must keep your credentials secure at all times.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Acceptable Use Policy</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Our e-learning platform is intended solely for educational development. You agree not to exploit our interactive compilers, quiz engines, AI mentorship models, or sandbox environments. You are prohibited from executing automated scraping bots, launching denial-of-service queries, or sharing obscene or abusive feedback in discussions.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Content Ownership &amp; IP</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              All courses, lecture outlines, video segments, coding challenges, and AI answers are intellectual property of FarFindARole and protected by copyright law. You receive a personal, non-exclusive license to view content. Downloading, screen-recording, repackaging, or commercially redistributing our teaching materials is illegal.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. User Responsibilities</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You are responsible for obtaining your own network equipment and internet connections to load classes. You are responsible for all actions taken under your credentials, and you agree to notify us immediately of any unauthorized account access.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Termination Rules</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We reserve the right to temporarily suspend or permanently terminate your account without notice if you violate these terms, share account access, commit quiz plagiarism, or disrupt the community boards. Upon termination, your credentials will deactivate and all active learning records will be archived.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-650" /> 6. Limitation of Liability
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              OUR SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY. IN NO EVENT SHALL FARFINDAROLE OR ITS INSTRUCTORS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT LIMITED TO LOST OPPORTUNITIES, JOB SEARCH OUTCOMES, OR CODING MISTAKES) RESULTING FROM PLATFORM DOWN TIMES, CODE CHALLENGE VERIFICATION ERRORS, OR AI MENTOR INSTRUCTION MISSTEPS.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have legal questions?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">We respond within 2-3 business days.</p>
          </div>
          <a
            href="mailto:legal@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-red-600 hover:text-red-750 transition"
          >
            <Mail className="w-4 h-4" /> legal@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}
