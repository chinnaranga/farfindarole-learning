'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  Shield, 
  Crown, 
  Check, 
  CheckCircle,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  // Redirect already-authenticated users (run once on mount only)
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: any } }) => {
      if (data.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()
        
        const userRole = userProfile?.role || data.user.user_metadata?.role || (data.user.email === 'admin@farfindarole.com' ? 'admin' : 'student')
        if (userRole === 'admin' && data.user.email === 'admin@farfindarole.com') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailNotConfirmed(false)
    setResendSent(false)

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) throw authError

      if (data?.user) {
        setShowSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }
    } catch (err: any) {
      console.error(err)
      const msg: string = err.message || ''
      if (msg.toLowerCase().includes('email not confirmed')) {
        setEmailNotConfirmed(true)
      } else {
        setError(msg || 'Incorrect email or password. Please try again.')
      }
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError('Please enter your email address above, then click Resend.')
      return
    }
    setResendLoading(true)
    setResendSent(false)
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      })
      if (resendError) throw resendError
      setResendSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github' | 'linkedin') => {
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (authError) throw authError
    } catch (err: any) {
      console.error(err)
      setError(`Failed to sign in with ${provider}: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row relative">
      
      {/* ── LEFT PANEL: BRAND EXPERIENCE (60% Desktop) ── */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-slate-50 via-slate-100 to-white relative overflow-hidden flex-col justify-between p-12 text-slate-800 border-r border-slate-200">
        {/* Modern decorative gradient background blobs */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#dc2626,transparent_45%)] opacity-[0.03] z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#4f46e5,transparent_40%)] opacity-[0.03] z-0" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
        
        {/* Floating animated blobs */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-red-500/5 rounded-full blur-[80px] animate-pulse duration-10000 z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[90px] animate-pulse duration-10000 z-0" />

        {/* Branding Logo */}
        <div className="relative z-10">
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

        {/* Brand Headline Copy */}
        <div className="relative z-10 max-w-xl my-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-amber-500 text-white uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3 h-3 fill-current" /> AI-Powered e-learning
          </span>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6 text-slate-900 text-left">
            Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-650 via-red-500 to-indigo-650">Job-Ready Skills</span> With AI-Powered Learning
          </h1>
          <p className="text-slate-600 text-sm xl:text-base leading-relaxed mb-8 text-left">
            Learn industry-relevant skills, earn certificates, and accelerate your career with personalized learning paths.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { text: "AI Learning Assistant", desc: "Interactive prompt coach & workspace helpers" },
              { text: "Industry-Focused Curriculum", desc: "Expert syllabus from Web Dev to Python ML" },
              { text: "Certificates", desc: "Earn verified badges & credential documents" },
              { text: "Personalized Roadmaps", desc: "AI builds path from current skill to target role" },
              { text: "Interview Preparation", desc: "Master assessments & practice questions" },
              { text: "Career Accelerator", desc: "Fast-track your job placements" }
            ].map((feat, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 transition duration-300">
                <div className="w-5.5 h-5.5 rounded-full bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-100">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black text-slate-800">{feat.text}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 border-t border-slate-200 pt-6 text-[10px] text-slate-500 flex justify-between">
          <span>© 2026 FarFindARole. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: AUTHENTICATION (40% Desktop) ── */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 bg-slate-50 min-h-screen relative">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="w-full max-w-[450px] flex flex-col gap-6 relative z-10">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="inline-flex lg:hidden px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-4">
              farfindarole learn
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1.5">Enter your credentials to continue your learning journey.</p>
          </div>

          {emailNotConfirmed && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-white font-black text-[10px]">!</span>
                <div className="text-left">
                  <p className="text-xs font-black text-amber-900">Email Not Confirmed</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Your account exists but you haven't verified your email yet.
                    Check <span className="font-bold">{email.trim() || 'your inbox'}</span> for a confirmation link, or resend it below.
                  </p>
                </div>
              </div>
              {resendSent ? (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Confirmation email sent! Check your inbox (and spam folder).
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-xl transition disabled:opacity-60 cursor-pointer"
                >
                  {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-605 flex-shrink-0" />
              <span className="text-left leading-normal">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Password</label>
                <Link href="/forgot" className="text-[10px] font-black text-red-650 hover:underline leading-none">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="current-password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 focus:bg-white transition"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-305 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer accent-red-600"
                />
                <span className="text-[11px] font-semibold text-slate-500">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer border-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Workspace...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-[1px] bg-slate-200 flex-1" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Continue With</span>
              <div className="h-[1px] bg-slate-200 flex-1" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition text-xs font-bold text-slate-700 cursor-pointer shadow-xs"
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('github')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition text-xs font-bold text-slate-700 cursor-pointer shadow-xs"
              >
                GitHub
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('linkedin')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 transition text-xs font-bold text-slate-700 cursor-pointer shadow-xs"
              >
                LinkedIn
              </button>
            </div>
          </div>

          {/* Redirect links */}
          <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4 mt-2">
            Don't have an account?{' '}
            <Link href="/signup" className="text-red-650 hover:underline font-bold">
              Sign Up Free
            </Link>
          </div>

          <div className="text-center text-xs text-slate-500">
            Authorized admin?{' '}
            <Link href="/admin/login" className="text-red-650 hover:underline font-bold">
              Admin Login Console
            </Link>
          </div>

          {/* Promo Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 mt-2 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0 mt-0.5">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Sponsorship Active</h4>
                <span className="text-[8px] font-black bg-brand-primary text-white px-1.5 py-0.5 rounded-full uppercase leading-none scale-90 origin-right">Unlocked</span>
              </div>
              <p className="text-[10px] text-slate-550 mt-1.5 leading-normal">All student workstations are currently unlocked. Enjoy full, sponsored access to premium courses, coding playgrounds, AI mentors, and certifications.</p>
              <Link href="/pricing" className="inline-flex items-center gap-0.5 text-[9px] font-black text-brand-secondary hover:underline mt-2">
                View Sponsorship Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Success Experience Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-650 flex items-center justify-center mb-4 border border-emerald-250">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Welcome Back</h3>
            <p className="text-xs text-slate-505 mt-1">Authenticating your secure workstation...</p>
            <Loader2 className="w-5 h-5 text-red-650 animate-spin mt-6" />
          </div>
        </div>
      )}

    </div>
  )
}
