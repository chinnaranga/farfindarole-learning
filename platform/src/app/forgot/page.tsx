export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (authError) throw authError
      setSuccess(true)
    } catch (err: any) {
      console.error('Password reset request error:', err)
      setError(err.message || 'Failed to send recovery email. Please check the email address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-12 relative select-none">
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[450px] flex flex-col gap-6 relative z-10">
        
        {/* Branding Logo */}
        <div className="flex justify-center mb-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="px-2.5 py-1 rounded bg-red-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:scale-105 transition-transform text-sm tracking-tight uppercase">
              far
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              FindA<span className="text-red-605">ROLE.</span>
              <span className="text-slate-500 font-normal text-sm ml-1">Learn</span>
            </span>
          </Link>
        </div>

        <div className="glass w-full p-8 rounded-3xl border border-slate-200 bg-white shadow-xl relative flex flex-col gap-6">
          
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              No worries! Enter your email below and we will send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-605 flex-shrink-0" />
              <span className="text-left leading-normal">{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 mx-auto shadow-sm">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-900">Check Your Email</p>
                <p className="text-xs text-slate-550 leading-relaxed">
                  We have sent password recovery instructions to <span className="font-bold text-slate-700">{email}</span>.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.98] shadow-md uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Log In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-5 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    autoComplete="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 focus:bg-white transition"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-650 text-white text-xs font-black py-3.5 rounded-xl uppercase tracking-widest transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
                </Link>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-slate-450 flex justify-between px-4">
          <span>© 2026 FarFindARole. All rights reserved.</span>
          <div className="flex gap-4 font-bold uppercase tracking-wider">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms</Link>
          </div>
        </div>

      </div>
    </div>
  )
}