'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  Shield, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  CreditCard, 
  Award, 
  Sparkles, 
  BarChart3, 
  ShieldCheck, 
  KeyRound, 
  Fingerprint, 
  LockKeyhole, 
  Terminal, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Future MFA Support Prep UI States
  const [mfaPrepOpen, setMfaPrepOpen] = useState(false)
  const [selectedMfaType, setSelectedMfaType] = useState<'otp' | 'totp' | 'recovery' | null>(null)

  // Check if admin is already logged in
  useEffect(() => {
    async function checkAdminSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        
        const userRole = userProfile?.role
        if (userRole === 'admin') {
          router.push('/admin')
        }
      }
    }
    checkAdminSession()
  }, [router])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
        // Query profiles database table to verify the user has the 'admin' role strictly
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', data.user.id)
          .maybeSingle()

        const userRole = userProfile?.role

        if (userRole !== 'admin') {
          // Access denied, sign user out immediately
          await supabase.auth.signOut()
          setError('Access Denied. Only authorized administrators can access this workspace.')
          setLoading(false)
          return
        }

        setAdminName(userProfile?.full_name || data.user.email?.split('@')[0] || 'Administrator')
        setShowSuccess(true)
        setTimeout(() => {
          router.push('/admin')
        }, 1500)
      }
    } catch (err: any) {
      console.error('Admin Login Error:', err)
      
      // Map standard database error messages to clear enterprise error classifications
      let friendlyError = err.message || 'Authentication failed. Please check credentials.'
      if (err.message?.includes('Invalid login credentials') || err.message?.includes('invalid_credentials')) {
        friendlyError = 'Invalid Credentials. Please double check your admin email and password.'
      } else if (err.message?.includes('Email not confirmed') || err.message?.includes('email_not_confirmed')) {
        friendlyError = 'Unauthorized Account. Email confirmation is required for security clearance.'
      } else if (err.message?.includes('User disabled') || err.message?.includes('user_disabled')) {
        friendlyError = 'Account Disabled. This administrator seat has been revoked. Contact SOC team.'
      } else if (err.message?.includes('Session expired') || err.message?.includes('session_expired')) {
        friendlyError = 'Session Expired. Please authenticate again to establish secure context.'
      }
      
      setError(friendlyError)
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    alert('Security Policy: Self-service password recovery is disabled for Administrative seats. Please submit a credential rotation ticket to the Security Operations Center.')
  }

  return (
    <div className="flex-1 bg-slate-50 flex flex-col lg:flex-row select-none min-h-screen relative overflow-hidden text-slate-800 font-sans">
      
      {/* ── LEFT PANEL: ENTERPRISE BRANDING (60% Desktop) ── */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-slate-50 via-slate-100 to-white border-r border-slate-200">
        
        {/* Animated grid mesh pattern and lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,#ef4444,transparent_45%)] opacity-[0.02] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#4f46e5,transparent_45%)] opacity-[0.02] pointer-events-none" />
        
        {/* Logo / Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="px-2.5 py-1 rounded bg-red-605 flex items-center justify-center font-black text-white shadow-sm text-xs uppercase tracking-wider">
              far
            </div>
            <span className="font-extrabold text-md tracking-tight text-slate-900">
              FindA<span className="text-red-500">ROLE.</span>
              <span className="text-slate-500 font-normal text-xs ml-1.5 border-l border-slate-250 pl-1.5">Management Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-600">CONSOLE: ACTIVE</span>
          </div>
        </div>

        {/* Brand Headline Copy */}
        <div className="relative z-10 max-w-xl my-auto space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-white border border-slate-200 text-red-600 uppercase tracking-widest mb-4 shadow-xs">
              <Shield className="w-3.5 h-3.5" /> FarFindARole Admin Console
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 text-left">
              Enterprise Learning Management System
            </h1>
            <p className="text-slate-500 text-xs xl:text-sm leading-relaxed mt-3 text-left">
              Manage courses, users, subscriptions, certificates, AI tools, analytics, and platform operations from a centralized workspace.
            </p>
          </div>

          {/* Enterprise Features Display Cards */}
          <div className="grid grid-cols-2 gap-3.5">
            {[
              { title: "User Management", desc: "Provision profiles, roles & permissions", icon: <Users className="w-4 h-4" /> },
              { title: "Course Management", desc: "Build & structure training tracks", icon: <BookOpen className="w-4 h-4" /> },
              { title: "Subscription Management", desc: "Control paid plans & license seats", icon: <CreditCard className="w-4 h-4" /> },
              { title: "Certificate Verification", desc: "Validate completed credentials", icon: <Award className="w-4 h-4" /> },
              { title: "AI Content Studio", desc: "Configure assistant prompt templates", icon: <Sparkles className="w-4 h-4" /> },
              { title: "Platform Analytics", desc: "View real-time metric visualizations", icon: <BarChart3 className="w-4 h-4" /> }
            ].map((feat, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50/50 hover:border-slate-300 transition duration-300 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                  {feat.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-800">{feat.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security indicators */}
        <div className="relative z-10 border-t border-slate-200 pt-6 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span>256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            <span>Role-Based Access Control</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LockKeyhole className="w-3.5 h-3.5 text-red-500" />
            <span>Secure Authentication</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-red-500" />
            <span>Audit Logging Enabled</span>
          </div>
        </div>

      </div>

      {/* ── RIGHT PANEL: AUTHENTICATION (40% Desktop) ── */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 min-h-screen relative bg-slate-50">
        
        {/* Subtle radial behind card */}
        <div className="absolute w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-[480px] flex flex-col gap-6 relative z-10">
          
          {/* Light-theme Card */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl flex flex-col gap-6">
            
            {/* Header */}
            <div className="text-center">
              <span className="inline-flex px-3 py-1 bg-red-50/80 border border-red-200 text-red-650 text-[10px] font-black rounded-full uppercase tracking-widest mb-3">
                Admin Console
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Administrator Access</h2>
              <p className="text-xs text-slate-500 mt-1">Sign in to continue. Only authorized administrators can access this workspace.</p>
            </div>

            {error && (
              <div 
                className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-start gap-2.5"
                role="alert"
                aria-live="assertive"
              >
                <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <span className="block font-black uppercase text-[10px] tracking-wider text-red-600">Security Clearance Failed</span>
                  <span className="text-[11px] leading-normal font-medium text-slate-650">{error}</span>
                  {error.includes('Access Denied') && (
                    <Link href="/login" className="inline-block mt-2 text-[10px] font-bold text-red-600 hover:underline">
                      Go to Student Login &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Credentials Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Admin Email</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@farfindarole.com"
                    autoComplete="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Password</label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] font-black text-red-605 hover:underline leading-none bg-transparent border-none outline-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 pl-11 pr-11 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded border-slate-200 bg-slate-50 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer accent-red-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-500">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-750 hover:from-red-655 hover:to-red-750 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-md transition active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer border-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="h-[1px] bg-slate-200 w-full" />

            {/* Future MFA Support Prep Section */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => setMfaPrepOpen(!mfaPrepOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 transition bg-transparent border-none outline-none cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><KeyRound className="w-4 h-4" /> Multi-Factor Authentication (MFA)</span>
                <span className="text-[10px] text-slate-400 font-mono">{mfaPrepOpen ? "HIDE" : "SETUP PREP"}</span>
              </button>

              {mfaPrepOpen && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fadeIn">
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-2.5">Future support is preloaded. Choose an MFA strategy to view configuration guidelines:</p>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { type: 'otp' as const, label: 'Email OTP', desc: 'Secure one-time passcodes sent to authorized inbox' },
                      { type: 'totp' as const, label: 'Authenticator', desc: 'Time-based code via Google Auth or 1Password' },
                      { type: 'recovery' as const, label: 'Backup Codes', desc: 'Pre-generated fallback hardware recovery codes' }
                    ].map((mfa) => (
                      <button
                        key={mfa.type}
                        type="button"
                        onClick={() => setSelectedMfaType(mfa.type === selectedMfaType ? null : mfa.type)}
                        className={`p-2 rounded-lg border text-[10px] font-bold text-center transition flex flex-col items-center justify-center gap-1 min-h-[56px] cursor-pointer ${
                          selectedMfaType === mfa.type
                            ? 'bg-red-50 border-red-200 text-red-655'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {mfa.type === 'otp' && <Mail className="w-3.5 h-3.5" />}
                        {mfa.type === 'totp' && <Fingerprint className="w-3.5 h-3.5" />}
                        {mfa.type === 'recovery' && <FileText className="w-3.5 h-3.5" />}
                        <span>{mfa.label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedMfaType && (
                    <div className="mt-2.5 p-2 bg-slate-100 border border-slate-200 rounded-lg text-[9px] text-slate-655 font-mono leading-normal">
                      {selectedMfaType === 'otp' && "Clearance Hook: [auth.mfa.challenge] will trigger an OTP challenge to verified admin credentials."}
                      {selectedMfaType === 'totp' && "TOTP Configuration: QR code registration helper [auth.mfa.enroll] is ready to bind authenticated devices."}
                      {selectedMfaType === 'recovery' && "Hardware Recovery: Static emergency codes [auth.mfa.backup] can be cached for offline disaster recovery."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Redirect links */}
            <div className="text-center text-xs text-slate-500 lg:hidden border-t border-slate-200 pt-4 mt-2">
              Not an administrator?{' '}
              <Link href="/login" className="text-red-650 hover:underline font-bold">
                Go to Student Login
              </Link>
            </div>

          </div>

          {/* Secure Monitoring details section */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-left shadow-xs">
            <ShieldCheck className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Enterprise Security Notice</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">This area is restricted to authorized administrators. All login attempts are monitored and logged.</p>
            </div>
          </div>

        </div>
      </div>

      {/* Success Experience Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn text-slate-850">
          <div className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Welcome back, {adminName}</h3>
            <p className="text-xs text-slate-500 mt-1">Loading dashboard...</p>
            <Loader2 className="w-5 h-5 text-red-605 animate-spin mt-6" />
          </div>
        </div>
      )}

    </div>
  )
}
