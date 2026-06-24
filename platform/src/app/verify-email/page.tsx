export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import Link from 'next/link'
import { MailCheck, ArrowRight, ShieldCheck, Fingerprint, Lock } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center py-20 px-4 select-none relative min-h-[85vh]">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass max-w-md w-full p-8 rounded-3xl border border-slate-200 bg-white shadow-2xl relative z-10 flex flex-col items-center text-center gap-6">
        
        {/* Animated Check Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 shadow-sm relative overflow-hidden animate-pulse">
          <MailCheck className="w-9 h-9" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Check Your Inbox</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            We have sent a verification link to your email address. Click the link in the message to activate your student account.
          </p>
        </div>

        {/* Instructions checklist */}
        <div className="w-full text-left space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 font-semibold">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">1</span>
            <span>Check spam or promotion folders if you do not see it within 2 minutes.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">2</span>
            <span>Use the unique link to authorize your learning workstation.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">3</span>
            <span>Return here and log in to explore courses.</span>
          </div>
        </div>

        <div className="w-full">
          <Link
            href="/login"
            className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.98] shadow-md uppercase tracking-wider"
          >
            Go to Log In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 border-t border-slate-100 pt-6 w-full text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> 256-bit Encryption</span>
          <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-slate-400" /> Secure Auth</span>
        </div>

      </div>
    </div>
  )
}