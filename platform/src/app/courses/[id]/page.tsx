export const runtime = 'edge';

'use client'

import { useState, useEffect } from 'react'
import { getCourse, getLessons, getProgressDetails, supabase, getUserSubscription } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PolicyModal from '@/components/PolicyModal'
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  BarChart3, 
  ArrowLeft, 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  Share2, 
  Users, 
  Star, 
  Zap, 
  ChevronRight, 
  Code, 
  AlertCircle, 
  Loader2, 
  HelpCircle, 
  Send, 
  Check, 
  Crown, 
  MessageSquare, 
  Flame, 
  ArrowUpRight, 
  LockKeyhole, 
  Lightbulb,
  X
} from 'lucide-react'


export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [userRole, setUserRole] = useState<'student' | 'pro' | 'admin'>('student')
  const [userEmail, setUserEmail] = useState('')
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'pro' | 'advanced'>('free')

  // State to hold progress of lessons
  const [lessonsProgress, setLessonsProgress] = useState<Record<string, { completed: boolean, completedAt: string | null }>>({})

  // Interactive states
  const [activeTab, setActiveTab] = useState<'modules' | 'overview' | 'instructor'>('modules')
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [selectedLockedLesson, setSelectedLockedLesson] = useState<any>(null)

  // Course-specific legal consent states
  const [showCourseConsentModal, setShowCourseConsentModal] = useState(false)
  const [hasCourseConsent, setHasCourseConsent] = useState(true)

  // AI Study Assistant states
  const [studyHours, setStudyHours] = useState('5')
  const [studyPlanLoading, setStudyPlanLoading] = useState(false)
  const [generatedStudyPlan, setGeneratedStudyPlan] = useState<string[] | null>(null)

  useEffect(() => {
    async function loadData(showLoading = true) {
      if (!courseId) return
      try {
        if (showLoading) setLoading(true)

        // Fetch real Supabase session
        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email || ''
        setUserEmail(email)

        if (user) {
          const sub = await getUserSubscription(user.id)
          const plan = sub.plan
          setSubscriptionPlan(plan)
          if (plan === 'advanced' || plan === 'pro') setUserRole('pro')
          else setUserRole('student')
        }

        const courseData = await getCourse(courseId)
        const lessonsList = await getLessons(courseId)
        
        setCourse(courseData)
        setLessons(lessonsList)

        // Load progress for each lesson
        const progressMap: Record<string, any> = {}
        for (const lesson of lessonsList) {
          const prog = await getProgressDetails(email, lesson.id)
          progressMap[lesson.id] = prog
        }
        setLessonsProgress(progressMap)

        // Check course consent if paid/premium course
        if (user && courseData && courseData.tier !== 'Free') {
          const { data: consents, error: consentError } = await supabase
            .from('policy_consents')
            .select('id')
            .eq('user_id', user.id)
            .eq('policy_type', 'course')
            .eq('policy_version', 'v1.0')
            .limit(1)

          if (consentError) {
            if (consentError.code === 'PGRST205' || consentError.code === '42P01' || consentError.message?.includes('does not exist')) {
              console.warn('policy_consents table does not exist in Supabase yet. Skipping course policy consent gate.')
              setHasCourseConsent(true)
            } else {
              console.error('Error checking course consent:', consentError)
            }
          } else if (!consents || consents.length === 0) {
            setShowCourseConsentModal(true)
            setHasCourseConsent(false)
          } else {
            setHasCourseConsent(true)
          }
        } else {
          setHasCourseConsent(true)
        }
      } catch (err: any) {
        console.error('Course Detail load error:', err)
        setErrorMsg(err.message || 'Failed to load course details')
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    loadData(true)

    const handleProgressChange = () => loadData(false)
    window.addEventListener('progress-changed', handleProgressChange)
    return () => {
      window.removeEventListener('progress-changed', handleProgressChange)
    }
  }, [courseId])

  const handleAcceptCourseTerms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('policy_consents')
        .insert({
          user_id: user.id,
          policy_type: 'course',
          policy_version: 'v1.0',
          accepted: true,
          source_page: `course_details_${courseId}`
        })

      if (error) throw error

      setHasCourseConsent(true)
      setShowCourseConsentModal(false)
    } catch (err) {
      console.error('Failed to record course policy consent:', err)
      alert('Could not record your agreement. Please try again.')
    }
  }

  const handleDeclineCourseTerms = () => {
    router.push('/courses')
  }

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 text-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-650 animate-spin" />
          <span className="text-[10px] text-slate-550 font-extrabold tracking-wider uppercase">Loading course workspace...</span>
        </div>
      </div>
    )
  }

  if (errorMsg || !course) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="glass max-w-md p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <BookOpen className="w-12 h-12 text-red-505 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Workspace Lost</h3>
          <p className="text-slate-500 mb-6 text-xs">{errorMsg || 'The requested course could not be found.'}</p>
          <Link href="/courses" className="bg-red-600 hover:bg-red-750 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition">
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  // Setup values from database course record
  const courseTier = course.tier || 'Free'
  const skillsGainedList = course.skills_gained || []
  const outcomesList = course.outcomes || []
  const instructorNameVal = course.instructor_name || 'AI Curriculum Expert'
  const instructorTitleVal = course.instructor_title || 'Academy Specialist Lead'
  const instructorAvatarVal = course.instructor_avatar || (course.instructor_name ? course.instructor_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'AI')
  const avgRatingVal = course.avg_rating ?? 4.5
  const enrollmentCountVal = course.enrollment_count ?? 1200

  const totalDuration = lessons.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)
  const completedCount = lessons.filter(l => lessonsProgress[l.id]?.completed).length
  const isCourseCompleted = lessons.length > 0 && completedCount === lessons.length

  // Find completion timestamp
  let courseCompletedAt: string | null = null
  if (isCourseCompleted) {
    let latestTime = 0
    lessons.forEach(l => {
      const ts = lessonsProgress[l.id]?.completedAt
      if (ts) {
        const time = new Date(ts).getTime()
        if (time > latestTime) {
          latestTime = time
          courseCompletedAt = ts
        }
      }
    })
  }

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return ''
    const dateObj = new Date(isoString)
    return dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Tier hierarchy: higher plan unlocks all lower tiers
  // Free=0, Basic=1, Pro=2, Advanced=3
  const TIER_RANK: Record<string, number> = { 'Free': 0, 'Basic': 1, 'Pro': 2, 'Advanced': 3 }
  const PLAN_RANK: Record<string, number> = { 'free': 0, 'basic': 1, 'pro': 2, 'advanced': 3 }

  const handleLessonClick = (lesson: any, index: number) => {
    // Read tier from DB
    const courseRank = TIER_RANK[courseTier] ?? 0
    const userRank = PLAN_RANK[subscriptionPlan] ?? 0

    // A course is locked if its tier rank is HIGHER than user's plan rank
    const isCourseLockedForPlan = userRole !== 'admin' && courseRank > userRank

    // Locked for plan → show upgrade modal
    if (isCourseLockedForPlan) {
      setSelectedLockedLesson(lesson)
      setShowUnlockModal(true)
      return
    }

    // Free-preview: first lesson is always accessible; others need at least Free plan
    if (!lesson.free_preview && index > 0 && subscriptionPlan === 'free' && courseTier !== 'Free') {
      setSelectedLockedLesson(lesson)
      setShowUnlockModal(true)
      return
    }

    router.push(`/courses/${course.id}/lessons/${lesson.id}`)
  }

  // Generate Custom AI Study Plan
  const generateStudySchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setStudyPlanLoading(true)
    setGeneratedStudyPlan(null)

    try {
      const prompt = `Create a brief 4-week study schedule for a course titled "${course.title}". The student plans to study ${studyHours} hours per week. Break it down into Week 1, Week 2, Week 3, and Week 4 recommendations.`
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail || 'student@farfindarole.com'
        },
        body: JSON.stringify({ type: 'notes', prompt })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          const lines = data.text.split('
').filter((l: string) => l.trim().length > 0)
          setGeneratedStudyPlan(lines.slice(0, 4))
          setStudyPlanLoading(false)
          return
        }
      }

      setGeneratedStudyPlan(['AI Study Planner is currently offline (API key not configured).'])
      setStudyPlanLoading(false)

    } catch (err) {
      console.error(err)
      setGeneratedStudyPlan(['Error generating schedule. Please try again later.'])
      setStudyPlanLoading(false)
    }
  }

  return (
    <div className="flex-1 bg-slate-50 py-12 select-none relative">
      {/* Background radial effects */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Back Link */}
        <Link href="/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* ========================================================================= */}
        {/* COURSE COMPLETED BANNER CONTAINER */}
        {/* ========================================================================= */}
        {isCourseCompleted && (
          <div className="glass p-6 sm:p-8 rounded-3xl border border-amber-255 bg-amber-50/10 shadow-lg mb-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-red-500/5 pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <Award className="w-8 h-8 fill-current animate-bounce" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-905">Verifiable Mastery Earned!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  You completed all lectures in <span className="font-bold">{course.title}</span> on {formatDateTime(courseCompletedAt)}.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase leading-none">
                    Secured Hash
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">HASH: cert-{course.id.slice(0, 4)}-jane-{course.id.slice(-4)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Link
                href="/dashboard"
                className="flex-1 md:flex-none text-center bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-750 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md uppercase tracking-wider cursor-pointer border-none"
              >
                Claim & Share Certificate
              </Link>
              <button
                onClick={() => alert('Credential link copied to clipboard.')}
                className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 p-3 rounded-xl transition flex items-center justify-center cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SPLIT LAYOUT: CORE HERO & CONTENT SIDEBAR */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Main Hero & Description Area (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Rich Glassmorphism Hero Panel */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row gap-6 items-center">
                {course.thumbnail_url && (
                  <div className="w-full sm:w-48 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>
                )}
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="text-[10px] font-black text-red-655 uppercase tracking-widest block">
                      {course.category || 'Engineering'}
                    </span>
                    {courseTier && courseTier !== 'Free' ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-white px-2 py-0.5 rounded shadow-sm">
                        <Crown className="w-2.5 h-2.5 fill-current" /> {courseTier.toUpperCase()} TRACK
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-slate-100 border border-slate-350 text-slate-500 px-2 py-0.5 rounded leading-none">
                        FREE TRACK
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
                    {course.title}
                  </h1>
                  
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4 text-indigo-500" /> {enrollmentCountVal.toLocaleString()} students</span>
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-current" /> {avgRatingVal} Rating</span>
                  </div>
                </div>
              </div>

              {/* Tabs Switchers */}
              <div className="flex border-b border-slate-150 mt-8 gap-6">
                {[
                  { id: 'modules', label: 'Course Modules', count: lessons.length },
                  { id: 'overview', label: 'Target Outcomes', count: null },
                  { id: 'instructor', label: 'Instructor Bio', count: null }
                ].map(tb => (
                  <button
                    key={tb.id}
                    onClick={() => setActiveTab(tb.id as any)}
                    className={`pb-3 text-xs font-black uppercase tracking-wider relative transition outline-none border-none bg-transparent cursor-pointer ${
                      activeTab === tb.id ? 'text-red-600' : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    {tb.label} {tb.count !== null && <span className="font-mono text-[10px] ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{tb.count}</span>}
                    {activeTab === tb.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full animate-fadeIn" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Render Content */}
              <div className="pt-6">
                
                {/* 1. Modules Connected Visual Timeline Tab */}
                {activeTab === 'modules' && (
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 py-2">
                    {lessons.map((lesson: any, idx: number) => {
                      const isLocked = !lesson.free_preview && idx > 0 && userRole === 'student'
                      const isCompleted = !!lessonsProgress[lesson.id]?.completed
                      const isActive = !isCompleted && (!lessons[idx - 1] || lessonsProgress[lessons[idx - 1].id]?.completed)

                      return (
                        <div key={lesson.id} className="relative group/timeline">
                          
                          {/* Left Dot Icon Node */}
                          <div className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border transition z-10 ${
                            isCompleted 
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm'
                              : isActive
                                ? 'bg-red-600 border-red-700 text-white shadow-sm animate-pulse'
                                : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            ) : isLocked ? (
                              <Lock className="w-2.5 h-2.5" />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            )}
                          </div>

                          <div 
                            onClick={() => handleLessonClick(lesson, idx)}
                            className={`p-4 rounded-2xl border transition duration-200 cursor-pointer select-none text-left flex items-center justify-between gap-4 ${
                              isCompleted 
                                ? 'border-emerald-250 bg-emerald-500/5 hover:bg-emerald-500/10' 
                                : isActive
                                  ? 'border-red-500/20 bg-red-500/5 shadow-sm'
                                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                            }`}
                          >
                            <div className="flex-1 truncate">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-wider ${
                                  isCompleted ? 'text-emerald-700' : 'text-slate-450'
                                }`}>
                                  Module {idx + 1}
                                </span>
                                {lesson.free_preview && (
                                  <span className="text-[8px] font-black text-indigo-705 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded uppercase">
                                    Free Preview
                                  </span>
                                )}
                                {isLocked && (
                                  <span className="flex items-center gap-0.5 text-[8px] font-black text-amber-705 bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded uppercase">
                                    <Crown className="w-2.5 h-2.5 text-amber-550 fill-current" /> Pro Lock
                                  </span>
                                )}
                              </div>
                              
                              <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                                isCompleted ? 'text-emerald-950' : 'text-slate-800'
                              }`}>
                                {lesson.title}
                              </h4>
                              
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">⏱️ {lesson.duration_minutes} mins duration</span>
                            </div>

                            <button className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-lg transition border cursor-pointer ${
                              isCompleted 
                                ? 'bg-emerald-50 border-emerald-250 hover:bg-emerald-100 text-emerald-700'
                                : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900 shadow-sm'
                            }`}>
                              {isCompleted ? 'Review' : 'Start'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 2. Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">What You Will Learn</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {outcomesList.length > 0 ? (
                          outcomesList.map((ot: string, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-650 font-semibold leading-relaxed">
                              <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{ot}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-500 text-xs italic">Outcomes list is dynamically updating.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Skills Gained Checklist</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {skillsGainedList.length > 0 ? (
                          skillsGainedList.map((sk: string) => (
                            <span key={sk} className="text-[9px] font-black text-indigo-650 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wide">
                              {sk}
                            </span>
                          ))
                        ) : (
                          <p className="text-slate-500 text-xs italic">Skills gained data will load shortly.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Instructor Profile Tab */}
                {activeTab === 'instructor' && (
                  <div className="p-5 bg-slate-50 border border-slate-150 rounded-2xl flex items-start gap-4 animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                      {instructorAvatarVal}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-905">{instructorNameVal}</h4>
                      <p className="text-[10px] text-red-655 font-bold uppercase tracking-wider mt-0.5">{instructorTitleVal}</p>
                      <p className="text-slate-500 text-xs leading-relaxed mt-3 max-w-lg">
                        Learn directly from {instructorNameVal}, a seasoned industry veteran. Our course developers possess years of real-world deployment experience, designing curriculum roadmaps that match top-tier industry expectations.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Smart AI Study Planner Box */}
            <div className="glass p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-100 animate-pulse" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">AI Study Scheduler</h3>
              </div>
              <p className="text-slate-500 text-xs mb-6 max-w-xl leading-relaxed">
                Estimate how many hours per week you can dedicate to this course, and our AI assistant will formulate a weekly milestone checklist.
              </p>

              <form onSubmit={generateStudySchedule} className="flex gap-3 items-center">
                <input 
                  type="number" 
                  min="1" 
                  max="40"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  className="w-20 bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-600 py-2.5 px-3 rounded-xl outline-none text-xs font-bold text-center"
                  required
                />
                <span className="text-xs text-slate-500 font-semibold">Hours per Week</span>
                
                <button
                  type="submit"
                  disabled={studyPlanLoading}
                  className="bg-slate-900 hover:bg-black disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1 border-none cursor-pointer"
                >
                  {studyPlanLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <>Schedule Milestones</>
                  )}
                </button>
              </form>

              {generatedStudyPlan && (
                <div className="mt-6 p-4 border border-indigo-100 bg-indigo-500/5 rounded-2xl flex flex-col gap-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Your Weekly Roadmap</span>
                    <button onClick={() => setGeneratedStudyPlan(null)} className="text-slate-400 hover:text-slate-650 transition">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {generatedStudyPlan.map((wk, idx) => (
                      <p key={idx} className="text-xs text-slate-650 font-medium leading-relaxed">
                        📅 {wk}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Metadata & Stats (1 Col) */}
          <div className="flex flex-col gap-6">
            
            {/* Quick Completion Stats */}
            <div className="glass p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-6">Course Work Completed</h3>
              
              <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f8fafc" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="50" 
                    // Verify correct offset
                    cy="50" 
                    r="40" 
                    stroke="#dc2626" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * completedCount) / (lessons.length || 1)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {Math.round((completedCount / (lessons.length || 1)) * 100)}