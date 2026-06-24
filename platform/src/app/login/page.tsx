export const runtime = 'edge';

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
      
      {/* ── LEFT PANEL: BRAND EXPERIENCE (60