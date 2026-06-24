export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-indigo-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                General Privacy Policy
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
        <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-650" /> TL;DR — Summary of Privacy
          </h2>
          <p className="text-xs text-emerald-950/80 leading-relaxed font-semibold">
            We value your privacy. We collect simple profile data and learning analytics to run classes, handle subscriptions securely via Stripe, track milestones, and deliver certificate tokens. We do not sell your personal data.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. What Data We Collect</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We collect personal information when you register or interact with FarFindARole Learn:
              <br />&bull; <strong>Account Information</strong>: Full name, email address, password hashes, and profile metadata.
              <br />&bull; <strong>Learning Progress</strong>: Lesson start/completions, interactive code task ratings, quiz responses, time durations, and certification dates.
              <br />&bull; <strong>Technical logs</strong>: IP addresses, user-agent details, system configuration pings, and dashboard activity.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. How We Use Data</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your data is processed strictly for the following purposes:
              <br />&bull; To authenticate your logins and authorize access to paid tiers.
              <br />&bull; To generate custom AI roadmap checklists and outline milestone recommendations.
              <br />&bull; To compile performance statistics and leaderboard cached rankings.
              <br />&bull; To issue cryptographically secure completion certificates.
              <br />&bull; To communicate critical policy announcements or security alerts.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Account &amp; Payment Data Handling</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We never store your raw credit or debit cards on our servers. All subscription payments are processed securely through Stripe. Stripe provides us with metadata (such as Customer ID, Subscription ID, billing periods, and invoice tokens) to activate your account tier, but your raw financial details remain fully protected by Stripe.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Analytics &amp; Cookies</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We use security cookies and localStorage cache records to maintain your active login session and persist workspace outline pings. You can adjust your browser settings to refuse cookies, but doing so will prevent you from staying logged in or accessing course workspaces smoothly.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Third-Party Services</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We share metadata with reliable partners only to run the application:
              <br />&bull; <strong>Supabase</strong>: Host database storage and user authentication services.
              <br />&bull; <strong>Stripe</strong>: Processes payment checkouts.
              <br />&bull; <strong>Google Gemini API / OpenAI API</strong>: Processes text queries for the AI Mentor widget.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Data Retention</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We retain account data for as long as your profile remains active. If you request account closure, we immediately initiate deactivation routines to delete or anonymize your name, email, payment history records, and progress stats from active backups.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">7. Your Privacy Rights</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Depending on your location, you have rights to query what personal data we store, request correction of inaccurate records, object to marketing alerts, or request complete removal under our structural data disposal process. To exercise these rights, email our team.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have privacy requests?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Contact our Data Officer directly.</p>
          </div>
          <a
            href="mailto:privacy@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-emerald-750 transition"
          >
            <Mail className="w-4 h-4" /> privacy@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}