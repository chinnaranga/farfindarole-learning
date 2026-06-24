export const runtime = 'edge';

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
      
      {/* ── LEFT PANEL: BRAND & VALUE PROP (55