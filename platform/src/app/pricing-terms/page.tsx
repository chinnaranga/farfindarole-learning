export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { Landmark, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function PricingTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-indigo-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-650 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Pricing Terms &amp; Billing Rules
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
        <div className="bg-amber-50 border border-amber-150 rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-650" /> TL;DR — Summary of Pricing
          </h2>
          <p className="text-xs text-amber-950/80 leading-relaxed font-semibold">
            We support Free tier previews and three paid levels (Basic, Pro, Advanced) charged in INR. Prices listed exclude local taxes (GST) which are added automatically on checkouts. We notify you 30 days before any price adjustments.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Plan Tiers &amp; Descriptions</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We offer different access levels based on your learning requirements:
              <br />&bull; <strong>Free Preview</strong>: Select basic lessons, catalog previews, and system setups.
              <br />&bull; <strong>Basic Plan</strong>: Complete beginner courses and standard completion credentials.
              <br />&bull; <strong>Pro Builder</strong>: Full catalog access, dynamic AI roadmaps, and chatbot mentorship.
              <br />&bull; <strong>Advanced Plan</strong>: High-end system design courses, premium tools, and priority instructor checkpoints.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Free vs. Paid Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Free users can read first module previews of specific courses but cannot submit checkpoints, take interactive graded quizzes, or lock down certificates. Accessing advanced courses requires activating a premium subscription.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Feature Limitations</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Features are bound strictly to active licenses. Paid plans are designed for individual personal study; attempting to bypass usage limitations or using automation tool bots on AI mentors is a violation of pricing terms.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Billing Currency</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              All transactions are calculated, displayed, and charged in Indian Rupees (INR - ₹). Users purchasing from foreign locations are subject to currency conversion rates applied by their bank card issuers.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Taxes &amp; Processing Fees</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Prices listed on platform banners are base rates. Local consumption taxes, including Goods and Services Tax (GST) if applicable, are calculated and appended dynamically inside the checkout sheet.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Price Change Notice</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We reserve the right to alter plan rates. Any adjustments to active subscription renewals will be announced to your registered email address at least thirty (30) days in advance.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have billing questions?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Contact our support center.</p>
          </div>
          <a
            href="mailto:billing@farfindarole.com"
            className="flex items-center gap-2 text-xs font-black text-amber-600 hover:text-amber-750 transition"
          >
            <Mail className="w-4 h-4" /> billing@farfindarole.com
          </a>
        </div>
      </div>
    </div>
  )
}