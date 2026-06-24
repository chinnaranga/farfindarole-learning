export const runtime = 'edge';

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import {
  getCourses,
  getLessons,
  getProgressDetails,
  getPlatformAnalytics,
  getCareerPaths,
  getUserLearningStats,
  upsertUserLearningStats,
  getLeaderboard,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  saveAiLearningPath,
  getUserAiLearningPaths,
  supabase,
  getUserSubscription,
  type CareerPath
} from '@/lib/supabase'
import Link from 'next/link'
import {
  BookOpen, Search, Filter, Loader2, ArrowRight, Sparkles, Trophy,
  Zap, Award, ChevronRight, Star, Play, Users, CheckCircle, Calendar,
  ChevronDown, Heart, BarChart3, Clock, Lock, Crown, MessageSquare,
  Share2, HelpCircle, Send, Check, Plus, ArrowUpRight, BookMarked,
  SlidersHorizontal, TrendingUp, X, Flame, ShieldAlert, GraduationCap,
  Target, Monitor, Server, Layers, Brain, Cloud, Shield, Code,
  Briefcase, ChevronUp, RefreshCw, Cpu, Globe, Database
} from 'lucide-react'

// ─── Tier constants ───────────────────────────────────────────────────────────
const TIER_RANK: Record<string, number> = { 'Free': 0, 'Basic': 1, 'Pro': 2, 'Advanced': 3 }
const PLAN_RANK: Record<string, number> = { 'free': 0, 'basic': 1, 'pro': 2, 'advanced': 3 }

function isCourseLocked(courseTier: string, plan: string, role: string): boolean {
  if (role === 'admin') return false
  return (TIER_RANK[courseTier] ?? 0) > (PLAN_RANK[plan] ?? 0)
}

function getRequiredPlan(courseTier: string): string {
  if (courseTier === 'Advanced') return 'Advanced'
  if (courseTier === 'Pro') return 'Pro'
  if (courseTier === 'Basic') return 'Basic'
  return 'Free'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function tierColor(tier: string): string {
  switch (tier) {
    case 'Advanced': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'Pro': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'Basic': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

function difficultyColor(difficulty: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'advanced': return 'text-red-700 bg-red-50 border-red-200'
    case 'intermediate': return 'text-amber-700 bg-amber-50 border-amber-200'
    default: return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  }
}

// Dynamic icon map for career paths
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Monitor, Server, Layers, Brain, BarChart3, Cloud, Shield, Code,
  Briefcase, Database, Globe, Cpu, GraduationCap, Target, Sparkles
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  tier: string
  thumbnail_url: string
  instructor_name: string
  skills_gained: string[]
  duration_hours: number
  language: string
  enrollment_count: number
  completion_count: number
  avg_rating: number | null
  total_ratings: number
  percent?: number
  lessonsCount?: number
  completedLessonsCount?: number
}


interface LeaderboardEntry {
  user_id: string
  xp_total: number
  courses_completed: number
  current_streak_days: number
}

interface AiMessage {
  sender: 'user' | 'mentor'
  text: string
  ts: Date
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-slate-100 rounded-full w-1/3" />
        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
        <div className="h-3 bg-slate-100 rounded-full w-1/2" />
        <div className="h-8 bg-slate-100 rounded-xl mt-4" />
      </div>
    </div>
  )
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number | null, count: number }) {
  if (!rating || count === 0) return (
    <span className="text-[10px] text-slate-400 font-semibold">No ratings yet</span>
  )
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star
          key={s}
          className={`w-3 h-3 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
      <span className="text-[10px] font-bold text-slate-600 ml-0.5">{rating.toFixed(1)}</span>
      <span className="text-[10px] text-slate-400">({formatNumber(count)})</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoursesPage() {
  // ── Data state ───────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<Course[]>([])
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([])
  const [platformStats, setPlatformStats] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  // ── User identity ─────────────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'student' | 'pro' | 'admin'>('student')
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'pro' | 'advanced'>('free')

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [requiredPlan, setRequiredPlan] = useState('')
  const [showLockedCourses, setShowLockedCourses] = useState(true)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'catalog' | 'careers' | 'leaderboard' | 'roadmap'>('catalog')

  // ── Search ────────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── Filters ───────────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedSort, setSelectedSort] = useState<'newest' | 'rating' | 'popular' | 'completed'>('newest')

  // ── AI Roadmap ────────────────────────────────────────────────────────────────
  const [roadmapCurrentSkill, setRoadmapCurrentSkill] = useState('')
  const [roadmapTargetRole, setRoadmapTargetRole] = useState('')
  const [roadmapExperience, setRoadmapExperience] = useState('beginner')
  const [roadmapLoading, setRoadmapLoading] = useState(false)
  const [roadmapResult, setRoadmapResult] = useState<any>(null)
  const [savedRoadmaps, setSavedRoadmaps] = useState<any[]>([])

  // ── AI Mentor ─────────────────────────────────────────────────────────────────
  const [mentorOpen, setMentorOpen] = useState(false)
  const [mentorInput, setMentorInput] = useState('')
  const [mentorMessages, setMentorMessages] = useState<AiMessage[]>([
    { sender: 'mentor', text: "Hi! I'm your AI Career Mentor. Ask me about course recommendations, career paths, interview prep, or skill planning.", ts: new Date() }
  ])
  const [mentorLoading, setMentorLoading] = useState(false)
  const mentorScrollRef = useRef<HTMLDivElement>(null)

  // ─── Load all data ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true)

        // Fetch real Supabase session
        const { data: { user } } = await supabase.auth.getUser()
        const email = user?.email || ''
        const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
        let plan: 'free' | 'basic' | 'pro' | 'advanced' = 'free'
        let role: 'student' | 'pro' | 'admin' = 'student'

        if (user) {
          const sub = await getUserSubscription(user.id)
          plan = sub.plan
          if (plan === 'advanced' || plan === 'pro') role = 'pro'
        }

        setUserEmail(email)
        setUserName(name)
        setUserRole(role)
        setSubscriptionPlan(plan)

        // Load in parallel
        const [courseList, paths, stats, lb, searches] = await Promise.all([
          getCourses(),
          getCareerPaths(),
          getPlatformAnalytics(),
          getLeaderboard(10),
          email ? getSearchHistory(email) : Promise.resolve([])
        ])

        // Enrich courses with user progress
        let enrolledCount = 0
        let completedCount = 0
        let xpTotal = 0

        const enriched = await Promise.all((courseList || []).map(async (course: any) => {
          if (!email) return { ...course, percent: 0, lessonsCount: 0, completedLessonsCount: 0 }
          const lessonsList = await getLessons(course.id)
          let lessonsCompleted = 0

          for (const l of lessonsList) {
            const prog = await getProgressDetails(email, l.id)
            if (prog.completed) {
              lessonsCompleted++
              xpTotal += 100
            }
          }

          const percent = lessonsList.length > 0 ? Math.round((lessonsCompleted / lessonsList.length) * 100) : 0
          if (percent > 0) enrolledCount++
          if (percent === 100) {
            completedCount++
            xpTotal += 500
          }

          return {
            ...course,
            percent,
            lessonsCount: lessonsList.length,
            completedLessonsCount: lessonsCompleted
          }
        }))

        setCourses(enriched)
        setCareerPaths(paths)
        setPlatformStats(stats)
        setLeaderboard(lb)
        setRecentSearches(searches)

        // Update user learning stats in DB
        if (email && (enrolledCount > 0 || completedCount > 0)) {
          await upsertUserLearningStats(email, {
            xp_total: xpTotal,
            courses_enrolled: enrolledCount,
            courses_completed: completedCount,
            lessons_completed: enriched.reduce((a, c) => a + (c.completedLessonsCount || 0), 0)
          })
          const freshStats = await getUserLearningStats(email)
          setUserStats(freshStats)
        } else if (email) {
          const freshStats = await getUserLearningStats(email)
          setUserStats(freshStats)
        }

        // Load saved AI roadmaps
        if (email) {
          const roadmaps = await getUserAiLearningPaths(email)
          setSavedRoadmaps(roadmaps)
        }
      } catch (err) {
        console.error('Error loading courses page:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAll()

    const onProgress = () => loadAll()
    window.addEventListener('progress-changed', onProgress)
    return () => window.removeEventListener('progress-changed', onProgress)
  }, [])

  // Auto-scroll mentor chat
  useEffect(() => {
    if (mentorScrollRef.current) {
      mentorScrollRef.current.scrollTop = mentorScrollRef.current.scrollHeight
    }
  }, [mentorMessages])

  // ─── Search handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback((val: string) => {
    setSearchTerm(val)
    setShowSuggestions(val.length > 0)
  }, [])

  const commitSearch = useCallback(async (term: string) => {
    if (!term.trim()) return
    setSearchTerm(term)
    setShowSuggestions(false)
    if (userEmail) {
      await saveSearchHistory(userEmail, term)
      const updated = await getSearchHistory(userEmail)
      setRecentSearches(updated)
    }
  }, [userEmail])

  const handleClearHistory = useCallback(async () => {
    setRecentSearches([])
    if (userEmail) await clearSearchHistory(userEmail)
  }, [userEmail])

  // ─── Filtered & sorted courses ─────────────────────────────────────────────
  const filteredCourses = courses
    .filter(course => {
      if (!showLockedCourses && isCourseLocked(course.tier, subscriptionPlan, userRole)) return false

      const term = searchTerm.toLowerCase()
      const matchesSearch = !term ||
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        (course.skills_gained || []).some(s => s.toLowerCase().includes(term)) ||
        (course.instructor_name || '').toLowerCase().includes(term)

      const matchesCategory = selectedCategory === 'all' ||
        (selectedCategory === 'frontend' && course.category === 'web-dev') ||
        (selectedCategory === 'backend' && course.category === 'backend') ||
        (selectedCategory === 'aiml' && course.category === 'python')

      const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty
      const matchesTier = selectedTier === 'all' || course.tier === selectedTier

      return matchesSearch && matchesCategory && matchesDifficulty && matchesTier
    })
    .sort((a, b) => {
      if (selectedSort === 'rating') return (b.avg_rating || 0) - (a.avg_rating || 0)
      if (selectedSort === 'popular') return b.enrollment_count - a.enrollment_count
      if (selectedSort === 'completed') return b.completion_count - a.completion_count
      return 0 // newest = default DB order
    })

  // Search autocomplete from course titles + skills
  const autocompleteSuggestions = searchTerm.length > 1
    ? [...new Set([
        ...courses.flatMap(c => c.skills_gained || []),
        ...courses.map(c => c.title)
      ].filter(s => s.toLowerCase().includes(searchTerm.toLowerCase())))].slice(0, 6)
    : []

  // ─── AI Roadmap Generator ──────────────────────────────────────────────────
  const generateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roadmapCurrentSkill.trim() || !roadmapTargetRole.trim()) return
    setRoadmapLoading(true)
    setRoadmapResult(null)

    const prompt = `You are a career coach AI. Generate a structured JSON learning roadmap for a student with this profile:
- Current Skill: "${roadmapCurrentSkill}"
- Target Role: "${roadmapTargetRole}"
- Experience Level: "${roadmapExperience}"

Return ONLY valid JSON in this exact format:
{
  "title": "Career Transition: ${roadmapCurrentSkill} → ${roadmapTargetRole}",
  "timeline": "X months",
  "skillGaps": ["gap1", "gap2", "gap3"],
  "phases": [
    {"phase": 1, "name": "Foundation", "duration": "4 weeks", "topics": ["topic1", "topic2"], "milestone": "milestone description"},
    {"phase": 2, "name": "Core Skills", "duration": "6 weeks", "topics": ["topic3", "topic4"], "milestone": "milestone description"},
    {"phase": 3, "name": "Advanced Practice", "duration": "4 weeks", "topics": ["topic5", "topic6"], "milestone": "milestone description"},
    {"phase": 4, "name": "Interview Prep", "duration": "2 weeks", "topics": ["topic7", "topic8"], "milestone": "Ready for interviews"}
  ],
  "projects": ["project1", "project2", "project3"],
  "interviewTopics": ["topic1", "topic2", "topic3", "topic4"]
}`

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userEmail || 'student' },
        body: JSON.stringify({ type: 'course', prompt })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          try {
            // Extract JSON from markdown code block if wrapped
            const jsonMatch = data.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, data.text]
            const parsed = JSON.parse(jsonMatch[1] || data.text)
            setRoadmapResult(parsed)

            // Save to DB
            if (userEmail) {
              await saveAiLearningPath(userEmail, roadmapCurrentSkill, roadmapTargetRole, roadmapExperience, parsed)
              const updated = await getUserAiLearningPaths(userEmail)
              setSavedRoadmaps(updated)
            }
            return
          } catch {
            // AI returned non-JSON — display as text
            setRoadmapResult({ title: `${roadmapCurrentSkill} → ${roadmapTargetRole}`, rawText: data.text })
          }
        }
      }

      setRoadmapResult({ error: 'AI service is unavailable. Please try again in a moment.' })
    } catch {
      setRoadmapResult({ error: 'Network error. Please check your connection and try again.' })
    } finally {
      setRoadmapLoading(false)
    }
  }

  // ─── AI Mentor ─────────────────────────────────────────────────────────────
  const sendMentorMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorInput.trim() || mentorLoading) return

    const userMsg = mentorInput.trim()
    setMentorInput('')
    setMentorMessages(prev => [...prev, { sender: 'user', text: userMsg, ts: new Date() }])
    setMentorLoading(true)

    const enrolledTitles = courses.filter(c => (c.percent || 0) > 0).map(c => c.title).join(', ')
    const systemContext = `You are an expert AI Career Mentor for FarFindARole Learn platform.
The user's name is "${userName || 'Student'}". Their subscription plan is "${subscriptionPlan}".
They are enrolled in: ${enrolledTitles || 'no courses yet'}.
Available courses on the platform: ${courses.map(c => c.title).join(', ')}.
Provide concise, actionable career and learning advice. Be encouraging but specific. Keep replies under 150 words.`

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userEmail || 'student' },
        body: JSON.stringify({ type: 'notes', prompt: `${systemContext}

Student: ${userMsg}` })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          setMentorMessages(prev => [...prev, { sender: 'mentor', text: data.text, ts: new Date() }])
          return
        }
      }
      setMentorMessages(prev => [...prev, { sender: 'mentor', text: 'I had trouble connecting. Please try again.', ts: new Date() }])
    } catch {
      setMentorMessages(prev => [...prev, { sender: 'mentor', text: 'Network error. Please check your connection.', ts: new Date() }])
    } finally {
      setMentorLoading(false)
    }
  }

  // ─── Derived stats for hero ────────────────────────────────────────────────
  const heroStats = [
    {
      label: 'Active Learners',
      value: platformStats?.active_learners > 0 ? formatNumber(platformStats.active_learners) : '—',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: 'Courses Published',
      value: platformStats?.courses_published > 0 ? String(platformStats.courses_published) : String(courses.length || '—'),
      icon: BookOpen,
      color: 'text-red-600'
    },
    {
      label: 'Certificates Issued',
      value: platformStats?.certificates_issued > 0 ? formatNumber(platformStats.certificates_issued) : '—',
      icon: Award,
      color: 'text-amber-600'
    },
    {
      label: 'Hiring Success Rate',
      value: platformStats?.hiring_success_rate > 0 ? `${platformStats.hiring_success_rate}