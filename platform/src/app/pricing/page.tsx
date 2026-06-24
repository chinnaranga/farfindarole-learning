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
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Free Plan Row */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className={`bg-white border rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
          !loadingSession && isFree ? 'border-emerald-300 ring-2 ring-emerald-200' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-4">
            {!loadingSession && isFree && (
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">Active</span>
            )}
            <div>
              <h3 className="text-sm font-black text-slate-800">Free Plan</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Access 1 free preview lesson per course. No credit card required.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-xl font-black text-slate-900">₹0 <span className="text-xs font-normal text-slate-400">/ month</span></span>
            {loadingSession ? (
              <span className="px-6 py-2.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full cursor-default border border-slate-200">...</span>
            ) : !userId ? (
              <Link href="/signup" className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-full transition shadow-sm border border-transparent">
                Get Started Free
              </Link>
            ) : isFree ? (
              <span className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 text-xs font-bold rounded-full cursor-default shadow-sm">
                Your current plan
              </span>
            ) : (
              <span className="px-6 py-2.5 bg-slate-200 border border-transparent text-white text-xs font-bold rounded-full cursor-not-allowed opacity-80 shadow-sm">
                Plan Restricted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch relative w-full mb-16">
        {(Object.keys(PLANS) as PlanKey[]).map((plan) => {
          const p = PLANS[plan]
          const price = getPlanPrice(plan)
          const isCurrent = isCurrentPlan(plan)
          const isPro = plan === 'pro'
          const colorMap = {
            slate: { border: 'border-slate-200', check: 'text-emerald-600', btn: 'bg-slate-900 hover:bg-slate-800 text-white border-transparent', activeBorder: 'border-slate-700 ring-2 ring-slate-200', label: 'text-slate-400', badgeBg: 'bg-slate-900 text-white' },
            red: { border: 'border-red-200', check: 'text-red-500', btn: 'bg-red-600 hover:bg-red-700 text-white border-transparent', activeBorder: 'border-red-500 ring-2 ring-red-100', label: 'text-red-600', badgeBg: 'bg-gradient-to-r from-red-600 to-amber-500 text-white' },
            indigo: { border: 'border-indigo-200', check: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent', activeBorder: 'border-indigo-500 ring-2 ring-indigo-100', label: 'text-indigo-500', badgeBg: 'bg-indigo-600 text-white' }
          }
          const colors = colorMap[p.color as keyof typeof colorMap]

          return (
            <div
              key={plan}
              className={`relative bg-white rounded-3xl border flex flex-col justify-between transition-all duration-300 shadow-sm p-8 ${
                isCurrent ? colors.activeBorder : `${colors.border} hover:shadow-md`
              } ${isPro ? 'md:-mt-4 md:-mb-4' : ''}`}
            >
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className={`absolute top-0 left-8 ${colors.badgeBg} text-[8px] font-black uppercase py-1 px-3 rounded-b-lg tracking-wider`}>
                  Current Plan
                </div>
              )}

              {/* Popular Badge */}
              {p.badge && (
                <div className={`absolute top-0 right-8 ${colors.badgeBg} text-[8px] font-black uppercase py-1 px-4 rounded-b-lg tracking-widest`}>
                  {p.badge}
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  {plan === 'pro' && <Crown className="w-4 h-4 text-amber-500 fill-current" />}
                  {plan === 'advanced' && <Star className="w-4 h-4 text-indigo-500 fill-indigo-100" />}
                </div>
                <p className="text-xs text-slate-500 mb-6">{p.description}</p>

                {/* Pricing */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black text-slate-900">₹{price.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                {billingPeriod === 'annually' && (
                  <p className="text-[10px] text-emerald-600 font-bold mb-6">
                    ₹{getAnnualTotal(plan).toLocaleString('en-IN')} billed annually — save ₹{((PLANS[plan].monthlyPrice - PLANS[plan].annualPrice) * 12).toLocaleString('en-IN')}
                  </p>
                )}
                {billingPeriod === 'monthly' && <div className="mb-6" />}

                {/* Feature List */}
                <div className="space-y-3">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${colors.label}`}>
                    {plan === 'basic' ? 'What is included' : plan === 'pro' ? 'Pro benefits' : 'Expert Suite Features'}
                  </p>
                  {p.features.map((feat, i) => (
                    <div key={i} className={`flex items-start gap-2.5 text-xs font-semibold ${feat.included ? 'text-slate-700' : 'text-slate-350 line-through'}`}>
                      {feat.included ? (
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.check}`} />
                      ) : (
                        <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" />
                      )}
                      <span>{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                id={`btn-plan-${plan}`}
                onClick={() => handleSelectPlan(plan)}
                disabled={loadingSession || isCurrent || !!(userId && PLAN_LEVELS[plan] <= (PLAN_LEVELS[currentPlan || 'free'] || 0))}
                className={`w-full mt-8 py-3 rounded-full text-xs font-bold transition shadow-sm select-none cursor-pointer border ${
                  isCurrent
                    ? 'bg-white border-slate-200 text-slate-400 cursor-default'
                    : (userId && PLAN_LEVELS[plan] < (PLAN_LEVELS[currentPlan || 'free'] || 0))
                      ? 'bg-slate-200 border-transparent text-white cursor-not-allowed opacity-80'
                      : colors.btn + ' hover:scale-[1.01] active:scale-[0.98]'
                }`}
              >
                {loadingSession ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                ) : (
                  getPlanButtonLabel(plan)
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Trust Indicators */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Secure Checkout</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 256-bit Encryption</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Cancel Anytime</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Instant Access</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
          By subscribing you agree to our{' '}
          <button 
            type="button" 
            onClick={() => { setModalPolicyType('general'); setModalOpen(true); }}
            className="underline hover:text-slate-650 cursor-pointer bg-transparent border-none p-0 inline font-bold text-[10px] text-slate-400"
          >
            Terms of Service
          </button> and{' '}
          <button 
            type="button" 
            onClick={() => { setModalPolicyType('general'); setModalOpen(true); }}
            className="underline hover:text-slate-650 cursor-pointer bg-transparent border-none p-0 inline font-bold text-[10px] text-slate-400"
          >
            Privacy Policy
          </button>.
          Subscriptions renew automatically. Cancel at any time from your account settings.
        </p>
      </div>

      {/* FAQ Strip */}
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-base font-black text-slate-800 text-center mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel your subscription at any time from your Account Settings. Access continues until the end of your billing period.' },
            { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards, UPI, and net banking via our secure payment processor.' },
            { q: 'Is there a free trial?', a: 'All plans start with our Free tier which lets you preview lessons. Paid plans unlock full course access immediately.' },
            { q: 'Can I switch plans?', a: 'Yes. You can upgrade or downgrade your plan at any time. Prorated credits are applied automatically.' },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 mb-2">{faq.q}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Subscription Confirmation Modal ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl border border-slate-200 p-8 relative shadow-2xl flex flex-col gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Confirm Subscription</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Review your plan before activating</p>
              </div>
              {!checkoutLoading && !checkoutSuccess && (
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 cursor-pointer border border-transparent rounded-lg hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {checkoutSuccess ? (
              <div className="text-center py-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mb-2">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h4 className="text-lg font-black text-slate-900">Subscription Activated!</h4>
                <p className="text-xs text-slate-500">
                  You now have access to{' '}
                  <span className="font-bold text-slate-800">{PLANS[checkoutPlan].name}</span>.
                  Redirecting to courses...
                </p>
                <Loader2 className="w-4 h-4 text-red-600 animate-spin mt-2" />
              </div>
            ) : (
              <>
                {checkoutError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Plan Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{PLANS[checkoutPlan].name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{billingPeriod === 'monthly' ? 'Monthly Billing' : 'Annual Billing (Save 20%)'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">
                        ₹{getPlanPrice(checkoutPlan).toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-slate-400"> /mo</span>
                      </p>
                      {billingPeriod === 'annually' && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          ₹{getAnnualTotal(checkoutPlan).toLocaleString('en-IN')} billed today
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 pt-3">
                    {PLANS[checkoutPlan].features.filter(f => f.included).slice(0, 4).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Consent Checkboxes */}
                <div className="space-y-2 border-t border-b border-slate-100 py-3.5 my-1">
                  <label className="flex items-start gap-2.5 text-[10.5px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedSubscriptionTerms}
                      onChange={(e) => setAcceptedSubscriptionTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-350 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span>
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setModalPolicyType('subscription')
                          setModalOpen(true)
                        }}
                        className="text-red-650 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer text-[10.5px] inline"
                      >
                        Subscription Terms
                      </button>{' '}
                      and understand my plan will auto-renew at the end of each billing period (monthly or annually) until cancelled.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-[10.5px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptedPricingTerms}
                      onChange={(e) => setAcceptedPricingTerms(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-350 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <span>
                      I accept the{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setModalPolicyType('pricing')
                          setModalOpen(true)
                        }}
                        className="text-red-650 hover:underline font-bold bg-transparent border-none p-0 cursor-pointer text-[10.5px] inline"
                      >
                        Pricing Policy
                      </button>{' '}
                      and authorize secure checkout processing through Stripe.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-500" /> Secured by 256-bit SSL
                  </span>
                  <span>Cancel anytime</span>
                </div>

                <button
                  id="btn-confirm-checkout"
                  onClick={handleConfirmCheckout}
                  disabled={checkoutLoading || !acceptedSubscriptionTerms || !acceptedPricingTerms}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer border-none"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Activating subscription...
                    </>
                  ) : (
                    <>
                      Activate {PLANS[checkoutPlan].name} <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-[9px] text-slate-400 leading-relaxed -mt-2">
                  By confirming, you agree to our Terms of Service. Your subscription starts immediately and renews automatically.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Legal Policies Modal */}
      <PolicyModal
        isOpen={modalOpen}
        policyType={modalPolicyType}
        onClose={() => setModalOpen(false)}
        showAcceptDecline={false}
      />

      {/* ── Checkout Verification Overlay ── */}
      {searchParams.get('payment') === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl p-8 relative shadow-2xl flex flex-col items-center justify-center text-center gap-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-indigo-650" />
            
            {currentPlan && currentPlan !== 'free' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Subscription Activated!</h3>
                <p className="text-xs text-slate-400">
                  Welcome to <span className="text-white font-bold capitalize">{currentPlan} Plan</span>! Your premium learning privileges are now active.
                </p>
                <div className="flex items-center gap-2 text-slate-400 text-xs mt-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                  <span>Redirecting to your dashboard...</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 mb-2">
                  <Loader2 className="w-9 h-9 animate-spin text-indigo-400" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Confirming Payment...</h3>
                <p className="text-xs text-slate-400">
                  We are securely synchronizing with Stripe to activate your course subscription. This usually takes just a few seconds.
                </p>
                <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-slate-850 text-slate-500 text-2xs font-mono">
                  Checking database status...
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
