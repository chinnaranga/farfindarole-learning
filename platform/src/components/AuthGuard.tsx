'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase, getUserSubscription } from '@/lib/supabase'

const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot',
  '/reset-password',
  '/pricing',
  '/',
  '/admin/login',
  '/terms',
  '/privacy',
  '/pricing-terms',
  '/subscription-terms',
  '/course-terms',
  '/account-terms'
]

// Derive the user's role strictly from the profiles table:
async function resolveUserRole(user: any): Promise<'admin' | 'pro' | 'student'> {
  // Check profiles table explicit role
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (userProfile) {
    const userRole = userProfile.role
    if (userRole === 'admin') {
      if (user.email && user.email.toLowerCase() !== 'admin@farfindarole.com') {
        let correctRole: 'pro' | 'student' = 'student'
        try {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', user.id)
            .maybeSingle()
          if (sub?.plan === 'pro' || sub?.plan === 'advanced') {
            correctRole = 'pro'
          }
          await supabase
            .from('profiles')
            .update({ role: correctRole, updated_at: new Date().toISOString() })
            .eq('id', user.id)
        } catch (e) {
          console.error('Failed to correct user role from admin to student/pro:', e)
        }
        return correctRole
      }
      return 'admin'
    }
    if (userRole === 'pro') return 'pro'
    return 'student'
  }

  // Self-healing: if profile doesn't exist, provision it in the DB dynamically
  const defaultRole = user.email === 'admin@farfindarole.com' ? 'admin' : 'student'
  try {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
      role: defaultRole,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('Failed to auto-provision user profile:', err)
  }

  return defaultRole
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        const isLoggedIn = !!user

        let userRole: 'admin' | 'pro' | 'student' = 'student'
        if (user) {
          userRole = await resolveUserRole(user)

          // Proactively register/ping active session for Live Monitoring
          fetch('/api/active-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Student',
              email: user.email,
              role: userRole
            })
          }).catch(() => {})
        }

        const isPublic = PUBLIC_ROUTES.includes(pathname)
        const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login'

        if (!active) return

        if (isAdminRoute) {
          if (!isLoggedIn) {
            setAuthorized(false)
            router.push('/admin/login')
            setChecking(false)
            return
          }
          if (userRole !== 'admin') {
            // Not an admin — send back to their appropriate place
            setAuthorized(false)
            router.push('/dashboard')
            setChecking(false)
            return
          }
        } else if (pathname === '/dashboard') {
          if (!isLoggedIn) {
            setAuthorized(false)
            router.push('/login')
            setChecking(false)
            return
          }
          if (userRole === 'admin') {
            // Admin accidentally on student dashboard → send to admin
            setAuthorized(false)
            router.push('/admin')
            setChecking(false)
            return
          }
        } else if (!isPublic && !isLoggedIn) {
          setAuthorized(false)
          router.push('/login')
          setChecking(false)
          return
        }

        setAuthorized(true)
        setChecking(false)
      } catch (err) {
        console.error('AuthGuard verification error:', err)
        if (active) {
          setAuthorized(false)
          setChecking(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, _session: any) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        checkAuth()
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (checking) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin mb-3" />
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Verifying Session...</span>
      </div>
    )
  }

  if (!authorized && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin mb-3" />
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Redirecting...</span>
      </div>
    )
  }

  return <>{children}</>
}
