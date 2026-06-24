export const runtime = 'edge';
export const runtime = 'edge';

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
        accuracy: '88