export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verifyingSession, setVerifyingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  // Live password requirements
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

  useEffect(() => {
    // Check if recovery session exists in URL or active client session
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setHasSession(true)
        } else {
          // Sometimes it takes a millisecond to parse fragments or we need to wait for auth state change
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setHasSession(true)
          } else {
            setHasSession(false)
          }
        }
      } catch (err) {
        console.error('Error checking recovery session:', err)
      } finally {
        setVerifyingSession(false)
      }
    }
    
    // Listen for recovery state or session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session) {
        setHasSession(true)
        setVerifyingSession(false)
      }
    })

    checkSession()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isPasswordValid) {
      setError('Password does not meet the security requirements.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError
      
      setSuccess(true)
      // Log out user so they have to log in with new password
      await supabase.auth.signOut()
      
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Password reset update error:', err)
      setError(err.message || 'Failed to update your password. Please try requesting a new link.')
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Create a secure password to protect your student account.
            </p>
          </div>

          {verifyingSession ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-xs font-semibold">Verifying secure session...</p>
            </div>
          ) : !hasSession && !success ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mx-auto shadow-sm">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-900">Session Expired or Invalid</p>
                <p className="text-xs text-slate-550 leading-relaxed max-w-xs mx-auto">
                  Your password reset link is invalid, expired, or has already been used. Please request a new one.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/forgot"
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition active:scale-[0.98] shadow-md uppercase tracking-wider cursor-pointer"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-650 mx-auto shadow-sm">
                <Check className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-black text-slate-900">Password Changed!</p>
                <p className="text-xs text-slate-550 leading-relaxed">
                  Your password has been successfully updated. Redirecting you to the log in page...
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-5 text-left animate-fadeIn">
              
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-605 flex-shrink-0" />
                  <span className="text-left leading-normal">{error}</span>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pl-11 pr-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 focus:bg-white transition"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Requirements check panel */}
                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-[10px] font-semibold text-slate-500">
                  <p className="font-extrabold uppercase tracking-wider mb-1 text-slate-400 text-[9px]">Password Requirements</p>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>✓</div>
                      <span className={hasMinLength ? 'text-slate-700 font-bold' : ''}>8+ Characters</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${hasUppercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>✓</div>
                      <span className={hasUppercase ? 'text-slate-700 font-bold' : ''}>1 Uppercase</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${hasLowercase ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>✓</div>
                      <span className={hasLowercase ? 'text-slate-700 font-bold' : ''}>1 Lowercase</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>✓</div>
                      <span className={hasNumber ? 'text-slate-700 font-bold' : ''}>1 Number</span>
                    </div>

                    <div className="flex items-center gap-1.5 col-span-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${hasSpecial ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>✓</div>
                      <span className={hasSpecial ? 'text-slate-700 font-bold' : ''}>1 Special Symbol (!@#$