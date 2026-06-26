'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, BookOpen, Search, ArrowRight, Award, Trophy, TrendingUp, Flame,
  GraduationCap, Target, Monitor, Server, Layers, Brain, Cloud, Shield, Code,
  Briefcase, Database, Calendar, Loader2, Play, Users, CheckCircle, ChevronRight, Map
} from 'lucide-react'
import {
  supabase,
  getUserLearningStats,
  getUserAiLearningPaths,
  saveAiLearningPath
} from '@/lib/supabase'

// Category definitions with metadata and icons
const ROADMAP_CATEGORIES = [
  {
    id: 'web-dev',
    name: 'Web Development',
    icon: Monitor,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    items: [
      { id: 'frontend', name: 'Frontend Developer', desc: 'HTML, CSS, JS, React, Tailwind, Next.js', difficulty: 'Beginner to Pro' },
      { id: 'frontend-beginner', name: 'Frontend Beginner', desc: 'Starter guide to HTML, CSS & basic JavaScript', difficulty: 'Beginner' },
      { id: 'backend', name: 'Backend Developer', desc: 'Node.js, APIs, SQL, PostgreSQL, Security, Scaling', difficulty: 'Intermediate' },
      { id: 'backend-beginner', name: 'Backend Beginner', desc: 'Starter guide to server logic, databases, and APIs', difficulty: 'Beginner' },
      { id: 'fullstack', name: 'Full Stack Developer', desc: 'Comprehensive path covering frontend and backend systems', difficulty: 'Advanced' },
      { id: 'react', name: 'React Specialist', desc: 'Deep dive into hooks, state, routing, and performance', difficulty: 'Intermediate' },
      { id: 'nextjs', name: 'Next.js Expert', desc: 'Server components, SSR, SSG, routing, and Vercel hosting', difficulty: 'Intermediate' },
      { id: 'nodejs', name: 'Node.js Developer', desc: 'Event loop, files, streams, Express, and microservices', difficulty: 'Intermediate' }
    ]
  },
  {
    id: 'languages',
    name: 'Programming Languages',
    icon: Code,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    items: [
      { id: 'python', name: 'Python Engineer', desc: 'Syntax, scripts, OOP, libraries, and data tools', difficulty: 'Beginner' },
      { id: 'java', name: 'Java Developer', desc: 'OOP, JVM, Spring Boot, multithreading, and systems', difficulty: 'Intermediate' },
      { id: 'cpp', name: 'C++ Systems Programmer', desc: 'Memory, pointers, STL, templates, and low-level code', difficulty: 'Advanced' },
      { id: 'go', name: 'Go Developer', desc: 'Goroutines, channels, interfaces, and backend APIs', difficulty: 'Intermediate' },
      { id: 'rust', name: 'Rust Systems Developer', desc: 'Ownership, borrow checker, concurrency, and safety', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'devops',
    name: 'DevOps & Cloud',
    icon: Cloud,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    items: [
      { id: 'devops', name: 'DevOps Engineer', desc: 'CI/CD, Linux, shell, networks, monitoring, and Git', difficulty: 'Advanced' },
      { id: 'aws', name: 'AWS Cloud Architect', desc: 'EC2, S3, RDS, Lambda, IAM, VPC, and solutions design', difficulty: 'Intermediate' },
      { id: 'docker', name: 'Docker Containerization', desc: 'Images, containers, networks, volumes, and compose', difficulty: 'Beginner' },
      { id: 'kubernetes', name: 'Kubernetes Administrator', desc: 'Pods, services, deployments, ingress, and clusters', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'ai-data',
    name: 'AI & Data Science',
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    items: [
      { id: 'ai-engineer', name: 'AI Engineer', desc: 'LLMs, vector DBs, prompt engineering, and API models', difficulty: 'Intermediate' },
      { id: 'ai-agents', name: 'AI Agents Developer', desc: 'LangChain, agentic workflows, memory, and tool usage', difficulty: 'Advanced' },
      { id: 'machine-learning', name: 'Machine Learning Specialist', desc: 'Regression, classification, PyTorch, and modeling', difficulty: 'Advanced' },
      { id: 'data-science', name: 'Data Scientist', desc: 'Data cleaning, stats, analysis, pandas, and plotting', difficulty: 'Intermediate' }
    ]
  },
  {
    id: 'databases-security',
    name: 'Databases & Security',
    icon: Database,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    items: [
      { id: 'sql', name: 'SQL & DB Designer', desc: 'Queries, joins, schemas, normalization, and indexes', difficulty: 'Beginner' },
      { id: 'postgresql', name: 'PostgreSQL Administrator', desc: 'Procedures, triggers, locks, replication, and tuning', difficulty: 'Advanced' },
      { id: 'cybersecurity', name: 'Cyber Security Engineer', desc: 'Penetration testing, networks, encryption, and exploits', difficulty: 'Advanced' }
    ]
  },
  {
    id: 'software-eng',
    name: 'Software Engineering Core',
    icon: Layers,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    items: [
      { id: 'architecture', name: 'Software Architect', desc: 'Microservices, event-driven systems, design patterns', difficulty: 'Advanced' },
      { id: 'system-design', name: 'System Designer', desc: 'Scaling, load balancers, caching, CDN, sharding', difficulty: 'Advanced' },
      { id: 'dsa', name: 'DSA & Coding Interviews', desc: 'Arrays, trees, graphs, dynamic programming, sorting', difficulty: 'Intermediate' }
    ]
  }
]

function RoadmapHubContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const targetQuery = searchParams.get('target')

  // Auth & Stats state
  const [userEmail, setUserEmail] = useState('')
  const [userStats, setUserStats] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // AI Generator state
  const [currentSkill, setCurrentSkill] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('beginner')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [savedPaths, setSavedPaths] = useState<any[]>([])

  // Custom Curated Roadmaps State
  const [customRoadmaps, setCustomRoadmaps] = useState<any[]>([])

  useEffect(() => {
    // Read custom roadmaps from localStorage
    const list: any[] = []
    const predefinedIds = [
      'frontend', 'frontend-beginner', 'backend', 'backend-beginner', 'fullstack', 'react', 'nextjs', 'nodejs',
      'python', 'java', 'cpp', 'go', 'rust',
      'devops', 'aws', 'docker', 'kubernetes',
      'ai-engineer', 'ai-agents', 'machine-learning', 'data-science',
      'sql', 'postgresql', 'cybersecurity',
      'architecture', 'system-design', 'dsa'
    ]

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('edited_roadmap_')) {
        const id = key.replace('edited_roadmap_', '')
        if (!predefinedIds.includes(id)) {
          try {
            const milestones = JSON.parse(localStorage.getItem(key) || '[]')
            const nodeCount = milestones.flatMap((m: any) => m.nodes || []).length
            const title = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            list.push({
              id,
              name: title,
              desc: `Custom curated track containing ${milestones.length} milestones and ${nodeCount} skill nodes.`,
              difficulty: 'Custom Track'
            })
          } catch (e) {
            console.error(e)
          }
        }
      }
    }
    setCustomRoadmaps(list)
  }, [])

  useEffect(() => {
    if (targetQuery) {
      setTargetRole(targetQuery)
      // Scroll to generator panel smoothly
      const element = document.getElementById('ai-generator-section')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // Fetch user and stats
    const loadSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
        const stats = await getUserLearningStats(user.id)
        setUserStats(stats)
        const paths = await getUserAiLearningPaths(user.email)
        setSavedPaths(paths)
      }
    }
    loadSession()
  }, [targetQuery])

  // AI Roadmap Generator Handler
  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentSkill.trim() || !targetRole.trim()) return
    setAiLoading(true)
    setAiError('')

    try {
      const response = await fetch('/api/ai-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkill: currentSkill.trim(),
          targetRole: targetRole.trim(),
          experienceLevel
        })
      })

      const data = await response.json()
      if (data.error) {
        setAiError(data.error)
        setAiLoading(false)
        return
      }

      // Save learning path to DB
      if (userEmail) {
        const newPath = await saveAiLearningPath(
          userEmail,
          currentSkill.trim(),
          targetRole.trim(),
          experienceLevel,
          data.roadmap
        )
        if (newPath) {
          setSavedPaths(prev => [newPath, ...prev])
        }
      }

      // Redirect to the newly generated AI roadmap
      router.push(`/roadmaps/ai-generated?id=${data.roadmap.id || 'new'}`)
    } catch (err) {
      console.error(err)
      setAiError('Failed to connect to the AI model. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  // Filter and search logic
  const filteredCategories = ROADMAP_CATEGORIES.map(category => {
    if (activeCategory !== 'all' && category.id !== activeCategory) {
      return null
    }
    const matchingItems = category.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (matchingItems.length === 0) return null
    return { ...category, items: matchingItems }
  }).filter(Boolean) as typeof ROADMAP_CATEGORIES

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 pb-20 relative select-none">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-radial from-brand-primary/5 via-slate-200/20 to-transparent pointer-events-none" />

      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                <GraduationCap className="w-3.5 h-3.5" /> Career Development Ecosystem
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Developer Roadmaps &amp; Learning Paths
              </h1>
              <p className="text-xs sm:text-sm text-slate-555 leading-relaxed">
                Follow structurally verified career roadmaps from beginner to production-ready. Complete coding labs, timed assessments, and portfolio projects to unlock cryptographic skills that recruiters search for.
              </p>
            </div>

            {/* User Stats Card */}
            {userStats && (
              <div className="w-full md:w-80 p-5 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-secondary/5 rounded-full blur-[20px]" />
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">Your Competency Stats</span>
                  <Flame className="w-5 h-5 text-red-550 fill-current animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total XP</p>
                    <p className="text-xl font-extrabold text-brand-primary">{userStats.xp_total || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Learning Hours</p>
                    <p className="text-xl font-extrabold text-brand-primary">{userStats.learning_hours || 0}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Completed Lessons</p>
                    <p className="text-xl font-extrabold text-brand-primary">{userStats.lessons_completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Active Streak</p>
                    <p className="text-xl font-extrabold text-brand-secondary">{userStats.current_streak_days || 0} days</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Roadmap Library */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            {/* Category Select */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                  activeCategory === 'all'
                    ? 'bg-brand-primary text-white'
                    : 'text-slate-550 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                All Tracks
              </button>
              {ROADMAP_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex-shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-brand-primary text-white'
                      : 'text-slate-550 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {cat.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search career tracks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
              />
            </div>
          </div>

          {/* Roadmap categories grid */}
          <div className="space-y-10">
            {/* Custom Curated Tracks */}
            {customRoadmaps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Map className="w-4.5 h-4.5" />
                  </div>
                  <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Admin Curated Paths</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {customRoadmaps.map(item => (
                    <Link
                      key={item.id}
                      href={`/roadmaps/${item.id}`}
                      className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary/30 hover:scale-[1.01] transition duration-200 flex flex-col gap-2 shadow-xs group relative text-left"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-black text-slate-900 group-hover:text-brand-secondary transition-colors uppercase tracking-wider">{item.name}</h3>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full">{item.difficulty}</span>
                      </div>
                      <p className="text-[11px] text-slate-450 leading-relaxed line-clamp-2">{item.desc}</p>
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-brand-primary group-hover:text-brand-secondary transition-colors">
                        <span>Start Learning Path</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredCategories.map(cat => {
              const CatIcon = cat.icon
              return (
                <div key={cat.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className={`w-8 h-8 rounded-lg ${cat.bgColor} ${cat.color} flex items-center justify-center flex-shrink-0`}>
                      <CatIcon className="w-4.5 h-4.5" />
                    </div>
                    <h2 className="text-base font-extrabold text-slate-805 tracking-tight">{cat.name}</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cat.items.map(item => (
                      <Link
                        key={item.id}
                        href={`/roadmaps/${item.id}`}
                        className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary/30 hover:scale-[1.01] transition duration-200 flex flex-col gap-2 shadow-xs group relative text-left"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-black text-slate-900 group-hover:text-brand-secondary transition-colors uppercase tracking-wider">{item.name}</h3>
                          <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{item.difficulty}</span>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-relaxed line-clamp-2">{item.desc}</p>
                        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-brand-primary group-hover:text-brand-secondary transition-colors">
                          <span>Start Learning Path</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: AI Generator & Saved Paths */}
        <div id="ai-generator-section" className="space-y-8">
          
          {/* Custom Gemini AI Roadmap Generator */}
          <div className="glass p-6 sm:p-7 bg-white border border-slate-205 rounded-3xl shadow-md space-y-5 sticky top-24">
            <div className="space-y-1.5 text-left">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-secondary/5 border border-brand-secondary/10 text-brand-secondary text-[9px] font-black uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5 fill-current" /> Gemini AI Architect
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Bespoke AI Learning Path</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Looking for a highly specialized tech stack or custom role? Tell Gemini your goal to build a custom visual learning path.
              </p>
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <form onSubmit={handleGenerateRoadmap} className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Current Knowledge</label>
                <input
                  type="text"
                  placeholder="e.g. basic HTML, Python, zero code"
                  value={currentSkill}
                  onChange={e => setCurrentSkill(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                  required
                  disabled={aiLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Target Career Role</label>
                <input
                  type="text"
                  placeholder="e.g. SRE Engineer, Solidity Developer"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition"
                  required
                  disabled={aiLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Difficulty Scale</label>
                <select
                  value={experienceLevel}
                  onChange={e => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs outline-none focus:border-brand-primary focus:bg-white transition cursor-pointer"
                  disabled={aiLoading}
                >
                  <option value="beginner">Beginner (0–1 yr)</option>
                  <option value="intermediate">Intermediate (1–3 yrs)</option>
                  <option value="senior">Senior (3+ yrs)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={aiLoading || !currentSkill.trim() || !targetRole.trim()}
                className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-3.5 rounded-xl transition shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer select-none"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Structuring Path...
                  </>
                ) : (
                  <>
                    Generate Custom Path <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Previously saved paths */}
            {savedPaths.length > 0 && (
              <div className="border-t border-slate-100 pt-4 space-y-3 text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your AI Learning Paths</h4>
                <div className="space-y-2">
                  {savedPaths.slice(0, 3).map(path => (
                    <Link
                      key={path.id}
                      href={`/roadmaps/${path.id}`}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition"
                    >
                      <span className="truncate">{path.current_skill} → {path.target_role}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

export default function RoadmapsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center py-40">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        <p className="text-xs text-slate-500 mt-2">Loading Career Roadmaps...</p>
      </div>
    }>
      <RoadmapHubContent />
    </Suspense>
  )
}
