export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { Award, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function CourseTermsPage() {
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
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-655 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Course &amp; Certification Terms
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
        <div className="bg-red-50 border border-red-150 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-red-650" /> TL;DR — Summary of Course Terms
          </h2>
          <p className="text-xs text-red-950/80 leading-relaxed font-semibold">
            All course content is copyrighted. Sharing premium lessons is prohibited. Verification certificates are issued only on 100ompletion of lessons and quizzes. Plagiarism or cheat codes will result in access revocation.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Course Access Rules</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your enrollment grants a personal, non-transferable license to access specific modules. You must complete modules in their logical progression order (Module 1, 2, 3, etc.). Attempting to bypass progress constraints or fetch lesson parameters programmatically is prohibited.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Content Restrictions</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You agree not to copy, print, record, replicate, or share lecture slides, coding text exercises, sandbox codes, or quiz details. All material provided within workspaces is copyrighted by FarFindARole.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Anti-Sharing Violations</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We monitor account logins and session pings. Accessing your account concurrently from multiple locations or sharing workspace details with friends to avoid plan subscription upgrades will lead to account suspension.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Plagiarism &amp; Academic Misconduct</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Quizzes and code challenges must represent your own individual effort. Submitting copied codes, exploiting quiz answers, or using automation scripts to answer questions is a violation. Verified plagiarism will lead to progress resets and certificate deactivation.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Completion Requirements</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              To complete a course path, you must:
              <br />&bull; Visit and fully scroll each lesson content page.
              <br />&bull; Attain passing marks on all lesson checks.
              <br />&bull; Complete all lesson quizzes with a 100ubmission rating.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Certificate Rules &amp; Share Policy</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Digital graduation certificates are issued automatically when all completion requirements are met. You are authorized to link, post, or share certificate credentials on LinkedIn or resumes. We reserve the right to revoke certificates if subsequent violations (plagiarism or payment chargebacks) are discovered.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have certificate queries?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Contact our learning specialists.</p>
          </div>
          <a
            href="mailto:courses@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-red-650 hover:text-red-750 transition"
          >
            <Mail className="w-4 h-4" /> courses@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}