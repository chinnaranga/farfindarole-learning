export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { RotateCw, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function SubscriptionTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Ambient background blur */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-red-500/5 pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-200 flex items-center justify-center text-indigo-650">
              <RotateCw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest">Legal Policy</span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                Subscription Terms &amp; Conditions
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
            <CheckCircle className="w-4 h-4 text-indigo-650" /> TL;DR — Summary of Subscriptions
          </h2>
          <p className="text-xs text-indigo-950/80 leading-relaxed font-semibold">
            All plans are billed on recurring cycles (monthly/annually) and renew automatically. You can cancel renewal anytime in settings. Upgrades apply immediately; downgrading active paid plans is disabled. Refunds are not issued.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">1. Recurring Billing Cycle</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              By purchasing a paid subscription, you authorize us (via Stripe) to charge the transaction fee recurringly on a monthly or annual basis, depending on your selected frequency. Your billing cycle begins on the date of successful checkout payment.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">2. Automatic Renewal</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your subscription plan will renew automatically at the end of each billing cycle using the card details on file. To avoid automatic renewal charges, you must submit a cancellation request before the renewal date.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">3. Cancellation Policy</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You can cancel subscription auto-renewal at any time. Simply navigate to your account settings and click cancel. Following cancellation, your paid workspace access remains fully active until the end of your pre-paid cycle, at which point your plan returns to the Free tier.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">4. Refunds Policy</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Payments are non-refundable. We do not provide credit or prorated refunds for partially used billing cycles, cancelled plans, or uncompleted lessons.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">5. Upgrades &amp; Downgrades</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              <br />&bull; <strong>Upgrades</strong>: Upgrading your paid plan takes effect immediately. The system calculates prorated credit and charges the difference.
              <br />&bull; <strong>Downgrades</strong>: Downgrading to a cheaper paid plan or to the Free tier is disabled during active prepaid periods. You must cancel renewal, let the plan expire, and subscribe to a cheapear tier thereafter.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">6. Failed Payment Handling</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              If an automatic renewal payment fails (due to card expiry, insufficient funds, or bank holds), Stripe will automatically re-attempt charges. We provide a grace period of three (3) business days, after which subscription features are locked until valid payment details are recorded.
            </p>
          </div>

        </div>

        {/* Contact Footer */}
        <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Have subscription issues?</h4>
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