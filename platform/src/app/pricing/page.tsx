'use client'

import Link from 'next/link'
import { Clock, Building, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'

export default function PricingPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-4 py-20 relative select-none">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] bg-radial from-brand-primary/5 via-slate-200/25 to-transparent pointer-events-none" />

      <div className="max-w-xl w-full text-center space-y-8 relative">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-secondary/5 border border-brand-secondary/10 text-brand-secondary text-[10px] font-black uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" /> Premium Plans: Coming Soon
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Individual Plans & Self-Paced Pricing
          </h1>
          <p className="text-xs sm:text-sm text-slate-550 leading-relaxed">
            We are currently transitioning FarFindARole Learn into an institutional learning ecosystem. Individual self-paced premium plans are undergoing a major upgrade and will launch soon.
          </p>
        </div>

        {/* Current Active Sponsorship Banner */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl text-left shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-[20px]" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Sponsorship Active</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Good news! To support our global transition, **all student workstations are currently unlocked**. You have full access to our interactive coding environments, mock interviews, and AI outline tools completely free. No subscription or credit card is required.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Call to Action */}
        <div className="p-6 bg-slate-900 rounded-3xl text-white text-left space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 rounded-full blur-[30px]" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-amber-400 fill-current animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-secondary">Corporate & University Licensing</span>
          </div>
          <h3 className="text-sm font-black">Looking for Workforce Solutions?</h3>
          <p className="text-xs text-slate-350 leading-relaxed">
            We offer robust custom licensing, cohort skill tracking, and direct recruiter pipeline integrations for engineering teams, schools, and coding bootcamps.
          </p>
          <div className="pt-2">
            <Link
              href="/workforce"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-brand-secondary transition-colors group"
            >
              <span>Explore Workforce Solutions</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Return Button */}
        <div>
          <Link
            href="/courses"
            className="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Return to Courses
          </Link>
        </div>
      </div>
    </div>
  )
}
