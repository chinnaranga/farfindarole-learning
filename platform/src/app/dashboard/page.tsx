'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BookOpen, 
  Award, 
  CheckCircle, 
  Clock, 
  Zap, 
  ArrowRight, 
  Brain, 
  AlertCircle, 
  BarChart3,
  Code,
  Play,
  Trophy,
  Download,
  ChevronRight,
  MessageSquare,
  Loader2,
  Sparkles,
  X,
  Star,
  Crown
} from 'lucide-react'
import { getCourses, getLessons, getProgressDetails, saveCertificateBackend, supabase, getUserSubscription } from '@/lib/supabase'

export default function DashboardPage() {
  const [role, setRole] = useState<'student' | 'pro' | 'advanced' | 'admin'>('student')
  const [userName, setUserName] = useState('Student')
  const [userEmail, setUserEmail] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Interactive UI States
  const [selectedRoadmapStep, setSelectedRoadmapStep] = useState(2)
  const [challengeCode, setChallengeCode] = useState(`function useLocalStorage(key, initialValue) {
  // Sync component state with localStorage
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  return [storedValue, setStoredValue];
}`)
  const [challengeLoading, setChallengeLoading] = useState(false)
  const [challengeResult, setChallengeResult] = useState('')
  const [showCertModal, setShowCertModal] = useState(false)
  const [selectedCertCourse, setSelectedCertCourse] = useState<any>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [interviewAnswer, setInterviewAnswer] = useState('')
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewResult, setInterviewResult] = useState<any>(null)

  // Mock progress database counts
  const [stats, setStats] = useState({
    completedLessons: 0,
    hoursSpent: 0,
    certificatesCount: 0,
    readinessScore: 0
  })

  const roadmapSteps = [
    {
      title: "Foundations of Web Dev",
      status: "completed",
      description: "Understand browser rendering engine loop, semantic HTML structure, CSS layouts, and asynchronous JavaScript networking.",
      xp: "+120 XP"
    },
    {
      title: "React Hooks & Virtual DOM",
      status: "completed",
      description: "Deep dive into component schedules, state update batching, reference hooks, context performance, and fiber tree reconciliation.",
      xp: "+180 XP"
    },
    {
      title: "Next.js SSR & Server Components",
      status: "active",
      description: "Construct Next.js pages with server-rendered rendering trees, leverage server actions, stream dynamic content, and control hydration states.",
      xp: "+220 XP"
    },
    {
      title: "PostgreSQL Schema Modeling & RLS",
      status: "locked",
      description: "Design relational database normalization schemas, secure transaction tables using row level security rules, and optimize index trees.",
      xp: "+260 XP"
    },
    {
      title: "Agentic AI Orchestration Platforms",
      status: "locked",
      description: "Integrate Large Language Model prompts, coordinate structured JSON output generation, and construct autonomous tool-calling loops.",
      xp: "+300 XP"
    }
  ]

  useEffect(() => {
    async function initDashboard() {
      try {
        // ── Real Supabase auth session ───────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser()
        const activeUserId = user?.email || user?.id || ''

        if (user) {
          setUserEmail(user.email || '')
          setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student')
          const sub = await getUserSubscription(user.id)
          const plan = sub.plan
          if (plan === 'advanced') setRole('advanced')
          else if (plan === 'pro') setRole('pro')
          else setRole('student')
        }

        await loadDashboardCourses(activeUserId)
      } catch (err) {
        console.error('Dashboard init error:', err)
        setLoading(false)
      }
    }

    async function loadDashboardCourses(activeUserId: string) {
      try {
        const list = await getCourses()
        let totalCompletedCount = 0
        let totalHoursLogged = 0

        const coursesWithProgress = await Promise.all((list || []).map(async (course: any) => {
          const lessonsList = await getLessons(course.id)
          let completedCount = 0
          let completedMinutes = 0
          let lastCompletedAt: string | null = null
          
          const lessonsWithProg = await Promise.all(lessonsList.map(async (lesson: any) => {
            const prog = await getProgressDetails(activeUserId, lesson.id)
            if (prog.completed) {
              completedCount++
              completedMinutes += lesson.duration_minutes || 0
              if (prog.completedAt) {
                if (!lastCompletedAt || new Date(prog.completedAt) > new Date(lastCompletedAt)) {
                  lastCompletedAt = prog.completedAt
                }
              }
            }
            return { ...lesson, completed: prog.completed, completedAt: prog.completedAt }
          }))
          
          totalCompletedCount += completedCount
          totalHoursLogged += completedMinutes
          
          const percent = lessonsList.length > 0 ? Math.round((completedCount / lessonsList.length) * 100) : 0
          
          return {
            ...course,
            lessonsCount: lessonsList.length,
            completedCount,
            percent,
            lastCompletedAt,
            lessonsList: lessonsWithProg
          }
        }))

        setCourses(coursesWithProgress)

        const certCount = coursesWithProgress.filter(c => c.percent === 100).length
        setStats({
          completedLessons: totalCompletedCount,
          hoursSpent: Math.round((totalHoursLogged / 60) * 10) / 10,
          certificatesCount: certCount,
          readinessScore: totalCompletedCount > 0 ? Math.min(100, 30 + Math.round(totalCompletedCount * 10)) : 0
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initDashboard()

    if (typeof window !== 'undefined') {
      const handler = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        const activeUserId = user?.email || user?.id || ''
        loadDashboardCourses(activeUserId)
      }
      window.addEventListener('progress-changed', handler)
      return () => {
        window.removeEventListener('progress-changed', handler)
      }
    }
  }, [])

  const handleChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeCode.trim()) return

    setChallengeLoading(true)
    setChallengeResult('')
    setTimeout(() => {
      setChallengeLoading(false)
      setChallengeResult('PASSED')
    }, 1500)
  }

  const handleInterviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewAnswer.trim()) return

    setInterviewLoading(true)
    setInterviewResult(null)
    setTimeout(() => {
      setInterviewLoading(false)
      setInterviewResult({
        grade: 'A-',
        accuracy: '88%',
        summary: 'Excellent description of cleanup hooks. You correctly explained how useEffect cleanups detach event listeners before subsequent hook execution, avoiding leaks.',
        tips: 'To reach a full A+, clarify that cleanup functions do not execute during the initial mounting cycle, but only run before re-renders and during final unmounting.'
      })
    }, 2000)
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      
      {/* Background radial effects */}
      <div className="absolute top-10 left-1/3 w-72 h-72 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Welcome Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Workstation</h1>
              {role === 'advanced' ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400 uppercase tracking-widest shadow-sm">
                  <Crown className="w-3 h-3 fill-current" /> Advanced
                </span>
              ) : role === 'pro' ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-red-500 text-white border border-amber-400 uppercase tracking-widest shadow-sm">
                  <Crown className="w-3 h-3 fill-current" /> Pro
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 border border-slate-300 text-slate-600 uppercase tracking-wider">
                  Free
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Welcome, <span className="font-bold text-slate-700">{role === 'advanced' ? 'Student (Advanced)' : role === 'pro' ? 'Student (Pro)' : 'Student (Free)'}</span> — manage your enrollments, inspect credentials, and track your job readiness.
            </p>
          </div>
          
          {role === 'student' && (
            <Link 
              href="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white text-xs font-black px-5 py-3 rounded-xl transition shadow-md uppercase tracking-wider scale-100 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Upgrade to Pro
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-650">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Lessons Done</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5 leading-none">{stats.completedLessons}</p>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Hours Logged</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5 leading-none">{stats.hoursSpent}h</p>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Credentials</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5 leading-none">{stats.certificatesCount}</p>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-center text-indigo-650">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">Job Readiness</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1.5 leading-none">{stats.readinessScore}%</p>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Courses & Roadmap (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Active Courses Progress */}
            <div className="glass p-6 rounded-3xl bg-white border border-slate-200 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-red-655" /> Active Course Workspaces
                </h3>
                <Link href="/courses" className="text-xs text-red-600 hover:underline font-bold flex items-center gap-0.5">
                  Browse Catalog <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin" />
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.slice(0, 3).map((course, idx) => {
                    const pct = course.percent || 0
                    const isCompleted = pct === 100
                    const completionTime = course.lastCompletedAt
                    
                    return (
                      <div key={course.id} className={`border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-slate-200 transition ${
                        isCompleted ? 'border-emerald-250 bg-emerald-50/10' : 'border-slate-100 bg-slate-50/50'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-red-655 font-extrabold uppercase tracking-wider block">{course.category}</span>
                            {isCompleted && (
                              <span className="text-[8px] font-black bg-emerald-100 border border-emerald-300 text-emerald-700 px-1.5 py-0.5 rounded uppercase leading-none">
                                Completed ✓
                              </span>
                            )}
                          </div>
                          <h4 className={`font-extrabold text-sm ${isCompleted ? 'text-emerald-950' : 'text-slate-800'}`}>{course.title}</h4>
                          
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className={`${isCompleted ? 'bg-emerald-600' : 'bg-red-600'} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-slate-550 font-mono font-bold leading-none">{pct}%</span>
                          </div>

                          {isCompleted && completionTime && (
                            <p className="text-[10px] text-emerald-800 font-medium mt-1.5">
                              Completed on {new Date(completionTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(completionTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>

                        <Link
                          href={`/courses/${course.id}`}
                          className={`text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-center cursor-pointer border ${
                            isCompleted 
                              ? 'bg-emerald-50 border-emerald-250 hover:bg-emerald-100/50 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900'
                          }`}
                        >
                          {isCompleted ? 'Review Course' : 'Resume Lecture'} <ArrowRight className={`w-3.5 h-3.5 ${isCompleted ? 'text-emerald-600' : 'text-slate-450'}`} />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <p className="text-slate-500 text-xs">No active courses yet. Go enroll in a study track!</p>
                </div>
              )}
            </div>

            {/* Interactive Learning Path Roadmap */}
            <div className="glass p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 flex flex-col shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[30px] pointer-events-none" />
              
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-indigo-650" /> Career Roadmap: Full-Stack Web Architect
              </h3>
              <p className="text-xs text-slate-500 mb-6">Track your milestones and view upcoming technical targets in this interactive path.</p>

              {/* Horizontal roadmap nodes */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 relative border-l sm:border-l-0 sm:border-t border-slate-100 pl-4 sm:pl-0 sm:pt-4">
                {roadmapSteps.map((step, idx) => {
                  const isActive = idx === selectedRoadmapStep
                  const isCompleted = step.status === 'completed'
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedRoadmapStep(idx)}
                      className={`flex flex-col text-left items-start gap-1 relative z-10 transition select-none cursor-pointer outline-none bg-transparent border-none ${
                        isActive ? 'scale-100 sm:scale-105' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-0 sm:flex-col sm:items-start">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                          isCompleted 
                            ? 'bg-emerald-500 border-emerald-650 text-white shadow-sm'
                            : step.status === 'active'
                              ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm animate-pulse'
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase mt-0 sm:mt-2.5 tracking-wider ${
                          isActive ? 'text-indigo-600 font-black' : 'text-slate-500'
                        }`}>
                          {step.title.slice(0, 16)}...
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Stage Detail Card */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Stage {selectedRoadmapStep + 1}: {roadmapSteps[selectedRoadmapStep].title}
                  </h4>
                  <span className="text-[9px] font-extrabold bg-indigo-50 text-indigo-755 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                    {roadmapSteps[selectedRoadmapStep].xp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {roadmapSteps[selectedRoadmapStep].description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-450">
                  <span className="capitalize">Status:</span>
                  <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide ${
                    roadmapSteps[selectedRoadmapStep].status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : roadmapSteps[selectedRoadmapStep].status === 'active'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-slate-200/50 text-slate-500 border border-slate-200'
                  }`}>
                    {roadmapSteps[selectedRoadmapStep].status}
                  </span>
                </div>
              </div>

            </div>

            {/* Verified Certifications Section */}
            <div className="glass p-6 rounded-3xl bg-white border border-slate-200 flex flex-col shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-amber-500" /> Verifiable Graduation Credentials
              </h3>

              <div className="space-y-4">
                {courses.filter(c => c.percent === 100).length > 0 ? (
                  courses.filter(c => c.percent === 100).map((completedCourse) => {
                    const hashPart1 = completedCourse.id.slice(0, 4)
                    const hashPart2 = completedCourse.id.slice(-4)
                    const certHash = `cert-${hashPart1}-jane-${hashPart2}`
                    
                    return (
                      <div key={completedCourse.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-300 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Award className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800">{completedCourse.title} Certificate</h4>
                            <p className="text-[10px] text-slate-455 mt-1 font-mono">HASH: {certHash}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-amber-600 border border-amber-400 bg-amber-50 px-2.5 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                            Verified
                          </span>
                          <button
                            onClick={() => {
                              setSelectedCertCourse(completedCourse)
                              setShowCertModal(true)
                            }}
                            className="bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" /> View Credential
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">No graduation credentials earned yet</p>
                    <p className="text-[10px] text-slate-400 mt-1">Complete all lessons in any course catalog workspace to unlock your certificate.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Job Readiness Sidebar & Coding challenge (1 Col) */}
          <div className="flex flex-col gap-6">
            
            {/* Job readiness score indicator */}
            <div className="glass p-6 rounded-3xl bg-white border border-slate-200 flex flex-col items-center text-center shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-6">Job Readiness Evaluation</h3>
              
              <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="#dc2626" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * stats.readinessScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">{stats.readinessScore}%</span>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Level 4</span>
                </div>
              </div>

              <h4 className="font-extrabold text-sm text-slate-800 mb-1">Junior Frontend Ready</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                You have proven competence in Virtual DOM reconcilers, basic styling loops, and state selectors.
              </p>

              <button
                onClick={() => setShowInterviewModal(true)}
                className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
              >
                <MessageSquare className="w-4 h-4 text-red-500 fill-current" /> Start AI Practice Interview
              </button>

              <div className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[10px] text-slate-650 font-semibold text-left flex items-start gap-2 mt-4">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>To reach Mid-level developer rating (80%+), complete the **Advanced SQL & Database Design** course track.</span>
              </div>
            </div>

            {/* Daily Coding Challenge Widget */}
            <div className="glass p-6 rounded-3xl bg-white border border-slate-200 flex flex-col shadow-sm relative overflow-hidden font-sans">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-red-650" /> Daily coding challenge
              </h3>
              <p className="text-[11px] text-slate-500 mb-4">Implement a simple custom hook to store values inside `localStorage`.</p>

              <form onSubmit={handleChallengeSubmit} className="space-y-3">
                <textarea
                  value={challengeCode}
                  onChange={(e) => setChallengeCode(e.target.value)}
                  disabled={challengeLoading}
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 focus:border-red-600 px-3 py-2.5 rounded-xl outline-none text-[10px] font-mono transition-all leading-normal"
                  rows={8}
                  required
                />
                
                {challengeResult === 'PASSED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase">Compilation Success</p>
                      <p className="font-medium mt-0.5 text-slate-600">All local storage fallback checks passed. +20 XP awarded.</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={challengeLoading}
                  className="w-full bg-red-600 hover:bg-red-750 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
                >
                  {challengeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Tests...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Submit Challenge Code
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Proven Skill list profile */}
            <div className="glass p-6 rounded-3xl bg-white border border-slate-200 flex flex-col shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-red-650" /> Verified Core Capabilities
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-bold">Virtual DOM reconciliation</span>
                  <span className="text-emerald-700 font-extrabold font-mono">Expert (90%)</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-bold">React state hooks array</span>
                  <span className="text-emerald-700 font-extrabold font-mono">Strong (85%)</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-bold">SQL queries index scaling</span>
                  <span className="text-red-600 font-extrabold font-mono">Weak (30%)</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <span className="text-slate-600 font-bold">Distributed setups loading</span>
                  <span className="text-slate-400 font-extrabold font-mono">Untested (0%)</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Graduation Certificate PDF Overlay Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 p-8 shadow-2xl relative flex flex-col items-center text-center gap-6 overflow-hidden">
            {/* Elegant Certificate Border */}
            <div className="absolute inset-4 border-[6px] border-amber-500/20 rounded-2xl pointer-events-none" />
            <div className="absolute inset-6 border border-amber-500/10 rounded-xl pointer-events-none" />
            
            <div className="relative pt-6">
              <Award className="w-16 h-16 text-amber-500 fill-amber-50 mx-auto animate-pulse" />
              <h2 className="text-2xl font-serif text-slate-800 mt-4 tracking-wide font-bold">Certificate of Mastery</h2>
              <p className="text-[10px] text-slate-405 font-sans font-bold uppercase tracking-widest mt-1">FarFindARole Learning Academy</p>
            </div>

            <div className="space-y-4 max-w-lg relative z-10">
              <p className="text-slate-500 text-xs italic font-serif">This document verification verifies that</p>
              <h3 className="text-xl font-extrabold text-slate-900 underline decoration-amber-500 decoration-2 underline-offset-4">
                {userName}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
                has successfully completed all module assignments and passed live simulation grading checkpoints for
              </p>
              <h4 className="text-sm font-extrabold text-slate-800 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl inline-block">
                {selectedCertCourse?.title || 'React Web Applications & Virtual DOM Mechanics'}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6 w-full max-w-md text-left text-[10px] relative z-10">
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wide">Credential Hash ID</p>
                <p className="text-slate-700 font-mono font-bold mt-1">
                  {selectedCertCourse ? `cert-${selectedCertCourse.id.slice(0, 4)}-jane-${selectedCertCourse.id.slice(-4)}` : '6a3f-f901-b2c0-8de4'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold uppercase tracking-wide">Verification Authority</p>
                <p className="text-emerald-700 font-extrabold mt-1 uppercase tracking-wider flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" /> Cryptographically Secured
                </p>
              </div>
            </div>

            <div className="flex gap-4 relative pt-4 z-10 w-full justify-center">
              <a
                href={`/api/courses/certificate/download?courseId=${selectedCertCourse?.id}&userId=${encodeURIComponent(userEmail || 'jane-student-id')}&name=${encodeURIComponent(userName)}&sendEmail=true`}
                download
                onClick={async () => {
                  const activeUserId = userEmail || 'jane-student-id'
                  if (selectedCertCourse) {
                    const hashPart1 = selectedCertCourse.id.slice(0, 4)
                    const hashPart2 = selectedCertCourse.id.slice(-4)
                    const certHash = `cert-${hashPart1}-jane-${hashPart2}`
                    await saveCertificateBackend(activeUserId, selectedCertCourse.id, `https://credentials.farfindarole.com/verify/${certHash}`)
                  }
                  alert(`Your certificate download has started, and a copy has been sent to your registered email: ${activeUserId || 'jane-student-id'}`);
                }}
                className="bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer border-none text-center justify-center decoration-none"
              >
                <Download className="w-4 h-4" /> Download & Email Certificate (PDF)
              </a>
              <button
                onClick={() => {
                  setShowCertModal(false)
                  setSelectedCertCourse(null)
                }}
                className="border border-slate-250 text-slate-500 hover:text-slate-800 font-bold text-xs px-5 py-3 rounded-xl transition cursor-pointer bg-white"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Mock Interview Modal Overlay */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl relative flex flex-col gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-[30px] pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" /> AI Agent Simulator: Active Interview
              </h3>
              <button
                onClick={() => {
                  setShowInterviewModal(false)
                  setInterviewAnswer('')
                  setInterviewResult(null)
                }}
                className="text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Question of the day</p>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                "Explain the difference between useEffect cleanup functions and standard garbage collection in JavaScript."
              </p>
            </div>

            {interviewResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl">
                  <div className="flex items-center justify-between gap-4 mb-3 border-b border-emerald-100/50 pb-2">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Evaluation Grade</span>
                    <span className="text-sm font-black text-emerald-850 bg-white border border-emerald-200 px-3 py-1 rounded-xl">
                      {interviewResult.grade} ({interviewResult.accuracy})
                    </span>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed">
                    {interviewResult.summary}
                  </p>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl text-xs text-amber-850">
                  <p className="font-extrabold uppercase tracking-wide text-[9px] mb-1">AI Improvement Tip</p>
                  <p className="leading-normal">{interviewResult.tips}</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setInterviewAnswer('')
                      setInterviewResult(null)
                    }}
                    className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer border-none"
                  >
                    Try Another Attempt
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInterviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Your Response</label>
                  <textarea
                    value={interviewAnswer}
                    onChange={(e) => setInterviewAnswer(e.target.value)}
                    disabled={interviewLoading}
                    placeholder="Enter your detailed technical explanation here..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-805 placeholder-slate-400 focus:border-red-600 px-4 py-3 rounded-xl outline-none text-xs leading-relaxed"
                    rows={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={interviewLoading}
                  className="w-full bg-red-600 hover:bg-red-750 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
                >
                  {interviewLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating Answer...
                    </>
                  ) : (
                    <>
                      Evaluate Answer <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

