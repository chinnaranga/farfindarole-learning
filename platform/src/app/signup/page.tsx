'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PolicyModal from '@/components/PolicyModal'
import { 
  Sparkles, 
  User, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  X, 
  Users, 
  BookOpen, 
  Award,
  Zap
} from 'lucide-react'
import { supabase, getPlatformAnalytics } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [isPolicyOpen, setIsPolicyOpen] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>({
    active_learners: 12500,
    courses_published: 6,
    hiring_success_rate: 94
  })

  // Password requirements live checks
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

  useEffect(() => {
    async function loadStats() {
      try {
        const platformStats = await getPlatformAnalytics()
        if (platformStats) {
          setStats(platformStats)
        }
      } catch (e) {
        console.warn('Failed to load live platform stats in signup:', e)
      }
    }
    loadStats()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all registration fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.')
      return
    }

    if (!agreeTerms || !agreePrivacy) {
      setError('You must agree to both the Terms & Conditions and the Privacy Policy.')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
            role: 'student',
            accepted_terms: true,
            accepted_privacy: true,
            policy_version: 'v1.0'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (authError) throw authError

      setLoading(false)
      router.push('/verify-email')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create account. Please check your credentials.')
      setLoading(false)
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
      
      {/* ── LEFT PANEL: BRAND & VALUE PROP (55% Desktop) ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-slate-50 via-slate-100 to-white relative overflow-hidden flex-col justify-between p-12 text-slate-800 border-r border-slate-200">
        {/* Dynamic ambient gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#dc2626,transparent_45%)] opacity-[0.03] z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#4f46e5,transparent_40%)] opacity-[0.03] z-0" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:40px_40px] z-0" />

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

        {/* Copy / Tagline */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-amber-500 text-white uppercase tracking-widest mb-6 shadow-sm">
            <Sparkles className="w-3 h-3 fill-current" /> AI-Powered e-learning
          </span>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-6 text-slate-900">
            Start Building Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-650 via-red-500 to-indigo-655">Career Today</span>
          </h1>
          <p className="text-slate-605 text-sm xl:text-base leading-relaxed mb-8">
            Join thousands of learners gaining industry-ready skills through AI-powered learning paths. Accelerate your career placements starting today.
          </p>

          {/* Benefits Bulletins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {[
              "AI Learning Assistant",
              "Personalized Roadmaps",
              "Professional Certificates",
              "Interview Preparation",
              "Career Accelerator"
            ].map((benefit, idx) => (
              <div key={idx} className="flex gap-2.5 items-center p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:bg-slate-50 transition duration-300 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Real Platform Statistics */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 max-w-lg">
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.active_learners?.toLocaleString() || '12k'}+</p>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Active Learners
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.courses_published || 6}</p>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" /> Live Courses
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats.hiring_success_rate || 94}%</p>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Placement Rate
              </p>
            </div>
          </div>
        </div>

        {/* Footer info seals */}
        <div className="relative z-10 border-t border-slate-200 pt-6 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-4">
          <span>Trusted Learning Platform</span>
          <span>•</span>
          <span>Privacy Protected</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: ONBOARDING CARD (45% Desktop) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-y-auto min-h-screen">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Mobile branding logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-red-600 flex items-center justify-center font-bold text-white text-xs uppercase">far</div>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">FindARole. <span className="text-slate-450 font-normal">Learn</span></span>
          </Link>
        </div>

        <div className="glass max-w-[480px] w-full p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xl relative z-10 flex flex-col gap-6">
          
          {/* Header Title */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Account</h2>
            <p className="text-xs text-slate-500 mt-1">Start your learning journey today.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-start gap-2 animate-fadeIn">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Signups */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="bg-white hover:bg-slate-50 border border-slate-205 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {/* Google Inline SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="bg-white hover:bg-slate-50 border border-slate-205 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {/* GitHub Inline SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </button>
            <button
              onClick={() => handleSocialLogin('linkedin')}
              disabled={loading}
              className="bg-white hover:bg-slate-50 border border-slate-205 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              {/* LinkedIn Inline SVG */}
              <svg className="w-4 h-4 fill-indigo-650 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="h-px bg-slate-200 flex-1" />
            <span>or sign up with email</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 transition"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jane@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 transition"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 transition"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-600 transition"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Password Validation Requirements Display */}
            {password.length > 0 && (
              <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl text-[10px] space-y-1.5">
                <p className="font-extrabold text-slate-500 uppercase tracking-wider mb-1">Password Requirements Check</p>
                <div className="grid grid-cols-2 gap-1.5 text-slate-600 font-semibold">
                  <span className="flex items-center gap-1">
                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-350" />}
                    <span>8+ characters</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-350" />}
                    <span>Uppercase letter</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {hasLowercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-350" />}
                    <span>Lowercase letter</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-350" />}
                    <span>Number (0-9)</span>
                  </span>
                  <span className="flex items-center gap-1 col-span-2">
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-350" />}
                    <span>Special character (e.g. @, #, $, %)</span>
                  </span>
                </div>
              </div>
            )}

            {/* Terms of Service & Privacy Policy Checkboxes */}
            <div className="space-y-2 py-1">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  disabled={loading}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 accent-red-650 rounded border-slate-300 mt-0.5 cursor-pointer outline-none"
                  required
                />
                <label htmlFor="agreeTerms" className="text-[10px] text-slate-500 font-semibold leading-relaxed cursor-pointer select-none">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => { setIsPolicyOpen(true); }}
                    className="text-slate-700 underline hover:text-slate-900 bg-transparent border-none p-0 inline font-bold cursor-pointer"
                  >
                    Terms &amp; Conditions
                  </button>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreePrivacy"
                  disabled={loading}
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 accent-red-650 rounded border-slate-300 mt-0.5 cursor-pointer outline-none"
                  required
                />
                <label htmlFor="agreePrivacy" className="text-[10px] text-slate-500 font-semibold leading-relaxed cursor-pointer select-none">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => { setIsPolicyOpen(true); }}
                    className="text-slate-700 underline hover:text-slate-900 bg-transparent border-none p-0 inline font-bold cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !agreeTerms || !agreePrivacy || !isPasswordValid}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition active:scale-[0.98] disabled:opacity-40 select-none cursor-pointer uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning workspace...
                </>
              ) : (
                <>
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Policy Consent Modal Overlay */}
            <PolicyModal
              isOpen={isPolicyOpen}
              onClose={() => setIsPolicyOpen(false)}
              onAccept={() => {
                setAgreeTerms(true);
                setAgreePrivacy(true);
                setIsPolicyOpen(false);
              }}
              onDecline={() => {
                setAgreeTerms(false);
                setAgreePrivacy(false);
                setIsPolicyOpen(false);
              }}
              policyType="general"
            />
          </form>

          {/* Bottom Security Seals */}
          <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Encryption</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Secure Authentication</span>
          </div>

          {/* Redirect to Log In */}
          <div className="text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="text-red-605 hover:underline font-bold">
              Log in here
            </Link>
          </div>

        </div>
      </div>
      
    </div>
  )
}
