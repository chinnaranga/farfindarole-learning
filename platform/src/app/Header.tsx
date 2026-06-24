'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Sparkles, Crown, ChevronDown, LogOut, Star, Zap } from 'lucide-react'
import { supabase, getUserSubscription } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Load user data from Supabase Auth & joined profiles/subscriptions
  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()

        // Fetch subscription via safe helper
        const sub = await getUserSubscription(authUser.id)

        setUser({
          id: authUser.id,
          full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
          email: authUser.email,
          avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
          role: profile?.role || authUser.user_metadata?.role || 'student'
        })

        setSubscription({
          subscription_plan: sub.subscription_plan
        })
      } else {
        setUser(null)
        setSubscription(null)
      }
    } catch (err) {
      console.error('Error loading user data in Header:', err)
      // Fallback if DB queries fail but auth session is active
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
          email: authUser.email,
          avatar_url: authUser.user_metadata?.avatar_url || '',
          role: authUser.user_metadata?.role || 'student'
        })
        setSubscription({
          subscription_plan: 'Free'
        })
      } else {
        setUser(null)
        setSubscription(null)
      }
    }
  }

  useEffect(() => {
    loadUserData()

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        loadUserData()
      } else {
        setUser(null)
        setSubscription(null)
      }
    })

    const handleProfileUpdate = () => loadUserData()
    window.addEventListener('profile-updated', handleProfileUpdate)
    window.addEventListener('subscription-updated', handleProfileUpdate)

    return () => {
      authListener?.unsubscribe()
      window.removeEventListener('profile-updated', handleProfileUpdate)
      window.removeEventListener('subscription-updated', handleProfileUpdate)
    }
  }, [])

  // Automatically refresh user subscription and profile data on navigation/pathname changes
  useEffect(() => {
    loadUserData()
  }, [pathname])

  // Handle Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Failed to logout via Supabase Auth:', e)
    }
    
    setUser(null)
    setSubscription(null)
    setDropdownOpen(false)
    
    router.push('/')
  }

  const getInitials = (fullName?: string, email?: string) => {
    if (fullName) {
      const parts = fullName.split(' ').filter(Boolean)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      if (parts.length === 1) {
        return parts[0][0].toUpperCase()
      }
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'US'
  }

  const isProPlan = (planName?: string) => {
    if (!planName) return false
    const lower = planName.toLowerCase()
    return lower === 'student pro' || lower === 'pro' || lower === 'advanced'
  }

  const renderPlanBadge = (plan?: string) => {
    const normPlan = (plan || 'Free').toLowerCase()
    if (normPlan === 'advanced') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400 shadow-sm uppercase tracking-widest leading-none">
          Advanced
        </span>
      )
    }
    if (normPlan === 'student pro' || normPlan === 'pro') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-white border border-amber-400 shadow-sm uppercase tracking-widest leading-none animate-pulse">
          Student Pro
        </span>
      )
    }
    if (normPlan === 'basic') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider leading-none">
          Basic
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-wider leading-none">
        Free
      </span>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="px-2.5 py-1 rounded bg-red-600 flex items-center justify-center font-bold text-white shadow-sm group-hover:scale-105 transition-transform text-sm tracking-tight uppercase">
              far
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              FindA<span className="text-red-605">ROLE.</span>
              <span className="text-slate-450 font-normal text-sm ml-1">Learn</span>
            </span>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/courses" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                pathname.startsWith('/courses') ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
              }`}
            >
              Explore Courses
            </Link>
            
            {user && user.role !== 'admin' && (
              <>
                <Link 
                  href="/dashboard" 
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname === '/dashboard' ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  My Dashboard
                </Link>
                <Link 
                  href="/dashboard/coding" 
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/dashboard/coding') ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Coding Arena
                </Link>
                <Link 
                  href="/dashboard/contests" 
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/dashboard/contests') ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Contests
                </Link>
              </>
            )}
            
            <Link 
              href="/pricing" 
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                pathname === '/pricing' ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
              }`}
            >
              Pricing Plans
            </Link>

            {user && (
              <Link 
                href="/ai-tool" 
                className={`text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${
                  pathname === '/ai-tool' ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" /> AI Content Tool
              </Link>
            )}

            {user && user.role === 'admin' && user.email === 'admin@farfindarole.com' && (
              <>
                <Link 
                  href="/admin" 
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname === '/admin' ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Admin Control
                </Link>
                <Link 
                  href="/admin/coding" 
                  className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    pathname.startsWith('/admin/coding') ? 'text-red-655 font-black' : 'text-slate-550 hover:text-slate-900'
                  }`}
                >
                  Challenge Editor
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User profile dropdown menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 bg-white text-left outline-none cursor-pointer transition select-none shadow-sm"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-[10px]">
                    {getInitials(user.full_name, user.email)}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none">
                    {user.full_name}
                  </p>
                </div>
                <div className="hidden sm:block">
                  {renderPlanBadge(subscription?.subscription_plan)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Options */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-2.5 shadow-2xl flex flex-col gap-2 z-50 animate-fadeIn">
                  
                  {/* Section 1: User Info */}
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50/60 rounded-xl border border-slate-100/50">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-sm">
                        {getInitials(user.full_name, user.email)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate leading-none mb-0.5">{user.full_name}</h4>
                      <p className="text-[10px] text-slate-500 truncate leading-none mb-2">{user.email}</p>
                      <div className="inline-block">{renderPlanBadge(subscription?.subscription_plan)}</div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 my-0.5" />

                  {/* Section 2: Workspace Links */}
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      My Dashboard
                    </Link>
                    <Link
                      href="/courses"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      My Courses
                    </Link>
                    <Link
                      href="/dashboard?tab=certificates"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      My Certificates
                    </Link>
                    <Link
                      href="/dashboard?tab=progress"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Learning Progress
                    </Link>
                    <Link
                      href="/dashboard?tab=saved"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-650 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Saved Content
                    </Link>
                  </div>

                  <div className="h-px bg-slate-100 my-0.5" />

                  {/* Section 3: Settings */}
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Account Settings
                    </Link>
                    <Link
                      href="/pricing"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Billing & Subscription
                    </Link>
                    <Link
                      href="/settings/notifications"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Notifications
                    </Link>
                    <Link
                      href="/settings/privacy"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Privacy Settings
                    </Link>
                    <Link
                      href="/settings/security"
                      onClick={() => setDropdownOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      Security
                    </Link>
                  </div>

                  {/* Section 4: Pro Features */}
                  {isProPlan(subscription?.subscription_plan) && (
                    <>
                      <div className="h-px bg-slate-100 my-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <div className="px-2.5 py-1 text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 fill-current" /> Student Pro Features
                        </div>
                        <Link
                          href="/courses"
                          onClick={() => setDropdownOpen(false)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-amber-50/20 transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>AI Mentor</span>
                        </Link>
                        <Link
                          href="/courses?tab=roadmap"
                          onClick={() => setDropdownOpen(false)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-amber-50/20 transition-colors flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-indigo-500 fill-current" />
                          <span>Career Roadmap</span>
                        </Link>
                        <Link
                          href="/dashboard?tab=interviews"
                          onClick={() => setDropdownOpen(false)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-amber-50/20 transition-colors flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
                          <span>Mock Interviews</span>
                        </Link>
                        <Link
                          href="/courses?tab=resources"
                          onClick={() => setDropdownOpen(false)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-655 hover:text-slate-900 hover:bg-amber-50/20 transition-colors flex items-center gap-1.5"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>Premium Resources</span>
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-slate-100 my-0.5" />

                  {/* Section 5: Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2 cursor-pointer border-none bg-transparent"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Log Out</span>
                  </button>

                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-transparent transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition shadow-sm select-none"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
