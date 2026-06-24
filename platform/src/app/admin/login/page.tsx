export const runtime = 'edge';

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
      
      {/* ── LEFT PANEL: ENTERPRISE BRANDING (60