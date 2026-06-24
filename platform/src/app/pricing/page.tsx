export const runtime = 'edge';
export const runtime = 'edge';

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Shield, Loader2, Lock, CheckCircle, Crown, AlertCircle, Zap, Star, X, ArrowRight, Sparkles } from 'lucide-react'
import { supabase, getUserSubscription, updateUserSubscription } from '@/lib/supabase'
import PolicyModal from '@/components/PolicyModal'

// Plan metadata
const PLANS = {
  basic: {
    name: 'Basic Plan',
    monthlyPrice: 499,
    annualPrice: 399,
    color: 'slate',
    icon: null,
    description: 'Core introduction courses for absolute beginners',
    badge: null,
    features: [
      { text: 'Access to foundational beginner courses', included: true },
      { text: 'Standard code challenges & interactive quizzes', included: true },
      { text: 'Verifiable digital graduation certificates', included: true },
      { text: 'AI-Powered study roadmap generators', included: false },
      { text: 'Floating AI Mentor chatbot coaching', included: false },
      { text: 'Advanced system design & RLS modules', included: false },
    ]
  },
  pro: {
    name: 'Pro Builder',
    monthlyPrice: 799,
    annualPrice: 639,
    color: 'red',
    badge: 'POPULAR CHOICE',
    description: 'Complete suite of tools for engineering study acceleration',
    features: [
      { text: 'Everything in Basic Plan', included: true },
      { text: 'Unlimited access to all courses', included: true },
      { text: 'AI-Powered study outline tools', included: true },
      { text: 'Floating AI Mentor chatbot coaching', included: true },
      { text: 'Advanced system design & RLS modules', included: true },
      { text: 'Personalized AI Career Transition roadmaps', included: false },
    ]
  },
  advanced: {
    name: 'Advanced Plan',
    monthlyPrice: 1299,
    annualPrice: 1039,
    color: 'indigo',
    badge: null,
    description: 'Expert roadmap engineering and practice checkpoints',
    features: [
      { text: 'Everything in Pro Builder tier', included: true },
      { text: 'Personalized AI Career Transition roadmaps', included: true },
      { text: 'AI Agent coding interview checkpoints', included: true },
      { text: 'Unlimited mock coaching assessments', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Dedicated career advisor access', included: true },
    ]
  }
} as const

type PlanKey = keyof typeof PLANS

const PLAN_LEVELS: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  advanced: 3,
}

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Checkout modal state
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey>('pro')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  // Consent checkbox states
  const [acceptedSubscriptionTerms, setAcceptedSubscriptionTerms] = useState(false)
  const [acceptedPricingTerms, setAcceptedPricingTerms] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPolicyType, setModalPolicyType] = useState<'general' | 'pricing' | 'subscription' | 'course'>('general')

  // Toast for redirect success
  const [toast, setToast] = useState<string | null>(null)
  const [successRedirected, setSuccessRedirected] = useState(false)

  // Fetch real session + subscription from Supabase
  useEffect(() => {
    async function loadSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          const sub = await getUserSubscription(user.id)
          setCurrentPlan(sub.plan)
        } else {
          setCurrentPlan(null)
        }
      } catch {
        setCurrentPlan(null)
      } finally {
        setLoadingSession(false)
      }
    }
    loadSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          setUserId(session.user.id)
          const sub = await getUserSubscription(session.user.id)
          setCurrentPlan(sub.plan)
        } else {
          setUserId(null)
          setCurrentPlan(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Show success toast if returning from payment success
  useEffect(() => {
    const status = searchParams.get('payment')
    if (status === 'success') {
      setToast('Subscription activated! Welcome to your new plan.')
      setTimeout(() => setToast(null), 5000)
    }
    if (status === 'cancelled') {
      setToast('Checkout was cancelled. No charge was made.')
      setTimeout(() => setToast(null), 4000)
    }
  }, [searchParams])

  // Poll subscription when payment=success query param is present
  useEffect(() => {
    const isSuccess = searchParams.get('payment') === 'success'
    if (!isSuccess || !userId || successRedirected) return

    let intervalId: any
    let count = 0

    const pollSubscription = async () => {
      try {
        const sub = await getUserSubscription(userId)
        if (sub.plan && sub.plan !== 'free') {
          setCurrentPlan(sub.plan)
          // Fire event to tell Header and other components to reload data
          window.dispatchEvent(new Event('subscription-updated'))
          
          if (intervalId) clearInterval(intervalId)
          
          setSuccessRedirected(true)
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err) {
        console.error('Error polling subscription:', err)
      }

      count++
      if (count > 20 && intervalId) {
        clearInterval(intervalId)
        // If it times out, redirect anyway
        router.push('/dashboard')
      }
    }

    // Run immediately once
    pollSubscription()

    intervalId = setInterval(pollSubscription, 2000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [searchParams, userId, successRedirected])

  const getPlanPrice = (plan: PlanKey) => {
    const p = PLANS[plan]
    return billingPeriod === 'monthly' ? p.monthlyPrice : p.annualPrice
  }

  const getAnnualTotal = (plan: PlanKey) => {
    return PLANS[plan].annualPrice * 12
  }

  const handleSelectPlan = (plan: PlanKey) => {
    if (!userId) {
      router.push(`/login?redirect=/pricing`)
      return
    }
    if (currentPlan === plan) return
    if (currentPlan && currentPlan !== 'free') {
      const currentLevel = PLAN_LEVELS[currentPlan] || 0
      const targetLevel = PLAN_LEVELS[plan] || 0
      if (targetLevel <= currentLevel) {
        setToast('Downgrading or switching to the same plan is restricted.')
        setTimeout(() => setToast(null), 4000)
        return
      }
    }
    setCheckoutPlan(plan)
    setCheckoutError('')
    setCheckoutSuccess(false)
    setAcceptedSubscriptionTerms(false)
    setAcceptedPricingTerms(false)
    setShowCheckout(true)
  }

  const handleConfirmCheckout = async () => {
    if (!userId || checkoutLoading) return
    if (!acceptedSubscriptionTerms || !acceptedPricingTerms) {
      setCheckoutError('Please read and accept the Subscription Terms and Pricing Policy before proceeding.')
      return
    }
    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const consentHeaders = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }

      // Record subscription terms consent server-side
      const subConsentRes = await fetch('/api/policy/consent', {
        method: 'POST',
        headers: consentHeaders,
        body: JSON.stringify({
          userId,
          policy_type: 'subscription',
          policy_version: 'v1.0',
          accepted: true,
          plan_name: checkoutPlan,
          billing_period: billingPeriod,
          source_page: 'pricing_checkout'
        })
      })
      if (!subConsentRes.ok) {
        const subData = await subConsentRes.json()
        throw new Error(subData.error || 'Failed to record subscription policy consent')
      }

      // Record pricing terms consent server-side
      const pricingConsentRes = await fetch('/api/policy/consent', {
        method: 'POST',
        headers: consentHeaders,
        body: JSON.stringify({
          userId,
          policy_type: 'pricing',
          policy_version: 'v1.0',
          accepted: true,
          plan_name: checkoutPlan,
          billing_period: billingPeriod,
          source_page: 'pricing_checkout'
        })
      })
      if (!pricingConsentRes.ok) {
        const pricingData = await pricingConsentRes.json()
        throw new Error(pricingData.error || 'Failed to record pricing policy consent')
      }

      // Proceed with checkout session creation
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          userId,
          plan: checkoutPlan,
          billingPeriod
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Checkout Session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned from the server')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setCheckoutError(err.message || 'Subscription redirect failed. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const isCurrentPlan = (plan: PlanKey) => currentPlan === plan
  const isFree = !currentPlan || currentPlan === 'free'

  const getPlanButtonLabel = (plan: PlanKey) => {
    if (loadingSession) return '...'
    if (!userId) return `Get Started with ${PLANS[plan].name}`
    if (isCurrentPlan(plan)) return 'Your current plan'
    return `Upgrade to ${PLANS[plan].name}`
  }

  return (
    <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden py-16 sm:py-20 px-4">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn max-w-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Background radial blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      {/* Hero Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-red-500 to-amber-500 text-white uppercase tracking-widest mb-4 shadow-sm">
          <Crown className="w-3 h-3 fill-current" /> Premium Pricing Plans
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
          Supercharge Your Engineering{' '}
          <span className="bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent">
            Learning Speed
          </span>
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          Gain unrestricted access to AI-powered study generators, certified credentials, advanced backend playgrounds, and professional practice interviews.
        </p>

        {/* Current plan indicator */}
        {userId && currentPlan && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Currently on: <span className="text-slate-900 font-black capitalize">{currentPlan === 'free' ? 'Free Plan' : PLANS[currentPlan as PlanKey]?.name || currentPlan}</span>
          </div>
        )}
        {!userId && !loadingSession && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-700">
            <Sparkles className="w-3 h-3" />
            Sign in to manage your subscription
          </div>
        )}

        {/* Billing Switcher Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition select-none cursor-pointer ${
              billingPeriod === 'monthly'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annually')}
            className={`px-6 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 select-none cursor-pointer ${
              billingPeriod === 'annually'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Annual
            <span className="text-[9px] font-extrabold bg-amber-400 text-slate-800 px-1.5 py-0.5 rounded-full uppercase leading-none">
              Save 20