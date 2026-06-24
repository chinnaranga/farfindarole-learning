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
        body: JSON.stringify({ type: 'notes', prompt: `${systemContext}\n\nStudent: ${userMsg}` })
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
      value: platformStats?.hiring_success_rate > 0 ? `${platformStats.hiring_success_rate}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-600'
    }
  ]

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-slate-50 min-h-screen select-none">

      {/* ── HERO SECTION ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px'}} />
        </div>

        <div className="relative max-w-[1800px] mx-auto px-[clamp(16px,4vw,64px)] py-16 sm:py-20">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">AI-Powered Learning Platform</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-5">
              Advance Your Career With
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
                AI-Powered Learning
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              Build job-ready skills through structured learning paths, industry certifications, and AI-guided mentorship tailored to your career goals.
            </p>

            {/* Hero search bar */}
            <div className="relative max-w-lg">
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden hover:border-white/40 transition focus-within:border-white/60">
                <Search className="w-4 h-4 text-white/50 ml-4 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && commitSearch(searchTerm)}
                  onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search courses, skills, instructors..."
                  className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white placeholder-white/40 outline-none"
                />
                {searchTerm && (
                  <button onClick={() => { setSearchTerm(''); setShowSuggestions(false) }} className="px-3 text-white/50 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => commitSearch(searchTerm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3.5 text-xs transition flex-shrink-0"
                >
                  Search
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (autocompleteSuggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                  {recentSearches.length > 0 && (
                    <div className="p-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent</span>
                        <button onClick={handleClearHistory} className="text-[9px] text-red-500 hover:text-red-700 font-bold">Clear</button>
                      </div>
                      {recentSearches.map((s, i) => (
                        <button key={i} onClick={() => commitSearch(s)} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-600 transition">
                          <Clock className="w-3 h-3 text-slate-300 flex-shrink-0" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {autocompleteSuggestions.length > 0 && (
                    <div className="p-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Suggestions</span>
                      {autocompleteSuggestions.map((s, i) => (
                        <button key={i} onClick={() => commitSearch(s)} className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs text-slate-600 transition">
                          <Search className="w-3 h-3 text-slate-300 flex-shrink-0" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Platform stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-10 border-t border-white/10">
            {heroStats.map(stat => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-black text-white leading-none">{loading ? '...' : stat.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto px-[clamp(16px,4vw,64px)] py-10">

        {/* ── USER DASHBOARD STRIP ─────────────────────────────────────────────── */}
        {userEmail && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Dashboard</p>
                <h2 className="text-base font-extrabold text-slate-900">
                  {userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Your Learning Progress'}
                </h2>
              </div>
              <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                subscriptionPlan === 'advanced' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                subscriptionPlan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                subscriptionPlan === 'basic' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {subscriptionPlan} plan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  label: 'XP Earned',
                  value: userStats?.xp_total != null ? formatNumber(userStats.xp_total) : courses.reduce((a, c) => a + (c.completedLessonsCount || 0) * 100, 0) > 0 ? formatNumber(courses.reduce((a, c) => a + (c.completedLessonsCount || 0) * 100, 0)) : '—',
                  icon: Zap, color: 'bg-amber-50 text-amber-600'
                },
                {
                  label: 'Day Streak',
                  value: userStats?.current_streak_days != null ? `${userStats.current_streak_days}d` : '—',
                  icon: Flame, color: 'bg-red-50 text-red-600'
                },
                {
                  label: 'Enrolled',
                  value: userStats?.courses_enrolled != null ? String(userStats.courses_enrolled) : String(courses.filter(c => (c.percent || 0) > 0).length || '—'),
                  icon: BookOpen, color: 'bg-blue-50 text-blue-600'
                },
                {
                  label: 'Completed',
                  value: userStats?.courses_completed != null ? String(userStats.courses_completed) : String(courses.filter(c => c.percent === 100).length || '—'),
                  icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600'
                },
                {
                  label: 'Certificates',
                  value: userStats?.certificates_earned != null ? String(userStats.certificates_earned) : '—',
                  icon: Award, color: 'bg-purple-50 text-purple-600'
                },
                {
                  label: 'Hours Learned',
                  value: userStats?.learning_hours != null && userStats.learning_hours > 0 ? `${userStats.learning_hours.toFixed(1)}h` : '—',
                  icon: Clock, color: 'bg-slate-100 text-slate-600'
                }
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className={`w-8 h-8 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 leading-none">{loading ? '…' : stat.value}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION TABS ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-8 overflow-x-auto">
          {[
            { id: 'catalog', label: 'Course Catalog', icon: BookOpen },
            { id: 'careers', label: 'Career Tracks', icon: Briefcase },
            { id: 'roadmap', label: 'AI Roadmap', icon: Sparkles },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition flex-shrink-0 cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── COURSE CATALOG SECTION ─────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'catalog' && (
          <div>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="aiml">AI / ML</option>
              </select>

              {/* Difficulty */}
              <select
                value={selectedDifficulty}
                onChange={e => setSelectedDifficulty(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Tier */}
              <select
                value={selectedTier}
                onChange={e => setSelectedTier(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Advanced">Advanced</option>
              </select>

              {/* Sort */}
              <select
                value={selectedSort}
                onChange={e => setSelectedSort(e.target.value as any)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-red-400 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Enrolled</option>
                <option value="completed">Most Completed</option>
              </select>

              {/* Lock toggle */}
              <button
                onClick={() => setShowLockedCourses(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  showLockedCourses ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {showLockedCourses ? <><BookOpen className="w-3.5 h-3.5" /> Show All</> : <><Lock className="w-3.5 h-3.5" /> My Plan Only</>}
              </button>

              <div className="flex-1" />
              <span className="text-[11px] text-slate-400 font-bold">
                {loading ? '...' : `${filteredCourses.length} course${filteredCourses.length !== 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Course Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800 mb-2">No courses found</h3>
                <p className="text-xs text-slate-400">
                  {searchTerm ? `No results for "${searchTerm}"` : 'Try adjusting your filters.'}
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedDifficulty('all'); setSelectedTier('all') }}
                  className="mt-4 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => {
                  const locked = isCourseLocked(course.tier, subscriptionPlan, userRole)
                  const isEnrolled = (course.percent || 0) > 0
                  const isCompleted = course.percent === 100

                  return (
                    <div
                      key={course.id}
                      onMouseEnter={() => setHoveredCourseId(course.id)}
                      onMouseLeave={() => setHoveredCourseId(null)}
                      className="bg-white rounded-3xl border border-slate-200 overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 flex flex-col"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-44 bg-slate-50 overflow-hidden flex-shrink-0">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-slate-200" />
                          </div>
                        )}

                        {/* Lock overlay */}
                        {locked && (
                          <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 border border-slate-200 rounded-t-3xl">
                            <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200">
                              <Lock className="w-4 h-4 text-amber-500" />
                            </div>
                            <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest mt-2">
                              {getRequiredPlan(course.tier)} Plan Required
                            </span>
                          </div>
                        )}

                        {/* Hover overlay: skills */}
                        {hoveredCourseId === course.id && !locked && (
                          <div className="absolute inset-0 bg-white/95 p-4 border border-slate-200 rounded-t-3xl flex flex-col justify-center z-10 shadow-lg">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Skills you'll gain</p>
                            <div className="flex flex-wrap gap-1">
                              {(course.skills_gained || []).slice(0, 6).map((s, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">{s}</span>
                              ))}
                              {(course.skills_gained || []).length === 0 && (
                                <span className="text-[10px] text-slate-500">Skills listed in the course</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Top badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5 z-20">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${difficultyColor(course.difficulty)}`}>
                            {course.difficulty}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3 z-20">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${tierColor(course.tier)}`}>
                            {course.tier}
                          </span>
                        </div>

                        {/* Completion badge */}
                        {isCompleted && (
                          <div className="absolute bottom-3 right-3 z-20">
                            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                              <CheckCircle className="w-2.5 h-2.5" /> Done
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Instructor */}
                        <p className="text-[10px] text-red-600 font-black uppercase tracking-wider mb-1.5 truncate">
                          {course.instructor_name || 'FarFindARole Expert'}
                        </p>

                        {/* Title */}
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2">
                          {course.description}
                        </p>

                        {/* Rating */}
                        <div className="mb-3">
                          <StarRating rating={course.avg_rating} count={course.total_ratings} />
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mb-4">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_hours}h</span>
                          {course.enrollment_count > 0 && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {formatNumber(course.enrollment_count)}</span>
                          )}
                          {course.lessonsCount != null && course.lessonsCount > 0 && (
                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessonsCount} lessons</span>
                          )}
                        </div>

                        {/* Progress bar (if enrolled) */}
                        {isEnrolled && (
                          <div className="mb-3">
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                              <span>{course.completedLessonsCount}/{course.lessonsCount} lessons</span>
                              <span>{course.percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-red-600'}`}
                                style={{ width: `${course.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* CTA */}
                        {locked ? (
                          <button
                            onClick={() => { setRequiredPlan(getRequiredPlan(course.tier)); setShowUpgradeModal(true) }}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-300 text-amber-700 font-bold py-3 rounded-xl text-xs transition hover:bg-amber-100 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" /> Upgrade to {getRequiredPlan(course.tier)}
                          </button>
                        ) : isCompleted ? (
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold py-3 rounded-xl text-xs transition hover:bg-emerald-100"
                          >
                            <Award className="w-3.5 h-3.5" /> View Certificate
                          </Link>
                        ) : isEnrolled ? (
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
                          >
                            <Play className="w-3.5 h-3.5" /> Continue Learning
                          </Link>
                        ) : (
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition"
                          >
                            <ArrowRight className="w-3.5 h-3.5" /> Start Course
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── CAREER TRACKS SECTION ──────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'careers' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Career Tracks</h2>
              <p className="text-xs text-slate-500">Choose your destination role and we'll map the courses you need.</p>
            </div>

            {careerPaths.length === 0 && !loading ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-800 mb-2">Career Paths Coming Soon</h3>
                <p className="text-xs text-slate-400">Career track data will be available after running the updated SQL schema.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {(loading ? Array(7).fill(null) : careerPaths).map((path: CareerPath | null, idx) => {
                  if (!path) return <SkeletonCard key={idx} />
                  const IconComp = ICON_MAP[path.icon ?? ''] || Briefcase
                  const relatedCourses = courses.filter(c =>
                    (path.course_categories || []).includes(c.category)
                  )
                  return (
                    <div
                      key={path.id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col"
                    >
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0"
                        style={{ backgroundColor: `${path.color}15` }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: path.color }} />
                      </div>

                      {/* Role name & difficulty */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{path.role_name}</h3>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex-shrink-0 ${difficultyColor(path.difficulty ?? '')}`}>
                          {path.difficulty}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{path.description}</p>

                      {/* Salary */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-extrabold text-emerald-700">
                          ${formatNumber(path.salary_min ?? 0)} – ${formatNumber(path.salary_max ?? 0)}/yr
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(path.required_skills || []).slice(0, 4).map((s, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Related course count */}
                      {relatedCourses.length > 0 && (
                        <div className="mt-auto pt-3 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold">
                            {relatedCourses.length} course{relatedCourses.length !== 1 ? 's' : ''} available for this track
                          </p>
                        </div>
                      )}

                      {/* CTA */}
                      <button
                        onClick={() => {
                          setRoadmapTargetRole(path.role_name)
                          setActiveSection('roadmap')
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate Roadmap
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── AI ROADMAP SECTION ─────────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'roadmap' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Gemini-Powered</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">AI Career Roadmap Generator</h2>
              <p className="text-xs text-slate-500">Get a personalized learning roadmap with skill gap analysis, projects, and interview prep — generated by AI.</p>
            </div>

            {/* Form */}
            <form onSubmit={generateRoadmap} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Current Skill</label>
                  <input
                    type="text"
                    value={roadmapCurrentSkill}
                    onChange={e => setRoadmapCurrentSkill(e.target.value)}
                    placeholder="e.g. JavaScript, Python, SQL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-400 transition placeholder-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Target Role</label>
                  <input
                    type="text"
                    value={roadmapTargetRole}
                    onChange={e => setRoadmapTargetRole(e.target.value)}
                    placeholder="e.g. Senior React Developer"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-400 transition placeholder-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Experience Level</label>
                  <select
                    value={roadmapExperience}
                    onChange={e => setRoadmapExperience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-red-400 transition cursor-pointer"
                  >
                    <option value="beginner">Beginner (0–1 yr)</option>
                    <option value="intermediate">Intermediate (1–3 yrs)</option>
                    <option value="senior">Senior (3+ yrs)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={roadmapLoading || !roadmapCurrentSkill.trim() || !roadmapTargetRole.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition cursor-pointer"
              >
                {roadmapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {roadmapLoading ? 'Generating with Gemini...' : 'Generate My Roadmap'}
              </button>
            </form>

            {/* Roadmap Result */}
            {roadmapResult && !roadmapResult.error && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Your Personalized Path</p>
                    <h3 className="text-base font-extrabold text-slate-900">{roadmapResult.title}</h3>
                    {roadmapResult.timeline && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Estimated timeline: <strong>{roadmapResult.timeline}</strong>
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-red-500" />
                  </div>
                </div>

                {/* Skill gaps */}
                {roadmapResult.skillGaps && roadmapResult.skillGaps.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-amber-500" /> Skill Gaps to Address
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {roadmapResult.skillGaps.map((g: string, i: number) => (
                        <span key={i} className="text-xs px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phases */}
                {roadmapResult.phases && roadmapResult.phases.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-blue-500" /> Learning Phases
                    </h4>
                    <div className="space-y-3">
                      {roadmapResult.phases.map((phase: any, i: number) => (
                        <div key={i} className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="w-8 h-8 rounded-full bg-red-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
                            {phase.phase}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="text-sm font-extrabold text-slate-800">{phase.name}</h5>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{phase.duration}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(phase.topics || []).map((t: string, ti: number) => (
                                <span key={ti} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{t}</span>
                              ))}
                            </div>
                            {phase.milestone && (
                              <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {phase.milestone}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects + Interview prep */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {roadmapResult.projects && roadmapResult.projects.length > 0 && (
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-purple-500" /> Portfolio Projects
                      </h4>
                      <div className="space-y-2">
                        {roadmapResult.projects.map((p: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span>
                            {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {roadmapResult.interviewTopics && roadmapResult.interviewTopics.length > 0 && (
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-emerald-500" /> Interview Prep Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {roadmapResult.interviewTopics.map((t: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Raw text fallback */}
                  {roadmapResult.rawText && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{roadmapResult.rawText}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error state */}
            {roadmapResult?.error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                {roadmapResult.error}
              </div>
            )}

            {/* Saved roadmaps */}
            {savedRoadmaps.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-extrabold text-slate-700 mb-4">Previously Generated Roadmaps</h3>
                <div className="space-y-3">
                  {savedRoadmaps.slice(0, 3).map((r: any, i: number) => (
                    <div key={r.id || i} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.current_skill} → {r.target_role}</p>
                        <p className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => setRoadmapResult(r.roadmap_json)}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── LEADERBOARD SECTION ────────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeSection === 'leaderboard' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Leaderboard</h2>
              <p className="text-xs text-slate-500">Top learners ranked by total XP earned through lesson completions.</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20">
                  <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-slate-700 mb-1">No Rankings Yet</h3>
                  <p className="text-xs text-slate-400">Complete lessons to appear on the leaderboard.</p>
                  <button
                    onClick={() => setActiveSection('catalog')}
                    className="mt-4 text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Browse courses →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leaderboard.map((entry, idx) => {
                    const isMe = entry.user_id === userEmail
                    const medals = ['🥇', '🥈', '🥉']
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 px-6 py-4 transition ${isMe ? 'bg-red-50 border-l-2 border-red-600' : 'hover:bg-slate-50'}`}
                      >
                        {/* Rank */}
                        <div className="w-8 text-center flex-shrink-0">
                          {idx < 3 ? (
                            <span className="text-lg">{medals[idx]}</span>
                          ) : (
                            <span className="text-sm font-black text-slate-400">#{idx + 1}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isMe ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {(entry.user_id.split('@')[0] || 'U').slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name & details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-slate-800 truncate">
                            {entry.user_id.split('@')[0]}
                            {isMe && <span className="text-red-600 ml-1.5 text-[10px]">• You</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{entry.courses_completed} courses completed</p>
                        </div>

                        {/* XP */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-amber-600">{formatNumber(entry.xp_total)} XP</p>
                          {entry.current_streak_days > 0 && (
                            <p className="text-[9px] text-red-500 flex items-center justify-end gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> {entry.current_streak_days}d
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* User's rank if not in top 10 */}
            {userEmail && leaderboard.length > 0 && !leaderboard.find(e => e.user_id === userEmail) && userStats && (
              <div className="mt-3 bg-white border border-red-200 rounded-2xl px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                  {(userEmail.split('@')[0] || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Your Position</p>
                  <p className="text-[10px] text-slate-400">Keep learning to climb the ranks!</p>
                </div>
                <p className="text-sm font-black text-amber-600">{formatNumber(userStats.xp_total || 0)} XP</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── UPGRADE MODAL ─────────────────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowUpgradeModal(false)}
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <Crown className="w-7 h-7 text-amber-500" />
            </div>

            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Upgrade Required</h3>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              This course requires the <strong className="text-slate-800">{requiredPlan}</strong> plan.
              Upgrade now to unlock all {requiredPlan} and lower tier courses.
            </p>

            <div className="space-y-2.5 mb-6">
              {['Basic', 'Pro', 'Advanced'].map((plan, i) => {
                const colors = ['border-emerald-200 bg-emerald-50', 'border-blue-200 bg-blue-50', 'border-purple-200 bg-purple-50']
                const textColors = ['text-emerald-700', 'text-blue-700', 'text-purple-700']
                const prices = ['₹499/mo', '₹799/mo', '₹1299/mo']
                return (
                  <div key={plan} className={`flex items-center justify-between p-3 rounded-xl border ${colors[i]}`}>
                    <span className={`text-xs font-black ${textColors[i]}`}>{plan}</span>
                    <span className={`text-xs font-bold ${textColors[i]}`}>{prices[i]}</span>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition cursor-pointer"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* ── AI MENTOR FLOATING WIDGET ─────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {mentorOpen && (
          <div className="w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden" style={{ height: '480px' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 flex-shrink-0">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-white">AI Career Mentor</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[9px] text-red-200">Gemini-powered · Online</p>
                </div>
              </div>
              <button onClick={() => setMentorOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={mentorScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {mentorMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black ${
                    msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-gradient-to-br from-red-500 to-amber-500 text-white'
                  }`}>
                    {msg.sender === 'user' ? 'U' : <Sparkles className="w-3 h-3" />}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                    msg.sender === 'user' ? 'bg-red-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {mentorLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-shrink-0">
              {['Recommend courses for me', 'Interview prep tips', 'Career roadmap help'].map(q => (
                <button
                  key={q}
                  onClick={() => { setMentorInput(q); sendMentorMessage({ preventDefault: () => {} } as any) }}
                  className="flex-shrink-0 text-[9px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 border border-slate-200 hover:border-red-200 transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMentorMessage} className="p-3 border-t border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 focus-within:border-red-400 transition">
                <input
                  type="text"
                  value={mentorInput}
                  onChange={e => setMentorInput(e.target.value)}
                  placeholder="Ask your AI Mentor..."
                  className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={!mentorInput.trim() || mentorLoading}
                  className="w-7 h-7 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setMentorOpen(v => !v)}
          className="w-13 h-13 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition cursor-pointer"
          style={{ width: 52, height: 52 }}
          aria-label="Open AI Mentor"
        >
          {mentorOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>
      </div>

    </div>
  )
}
