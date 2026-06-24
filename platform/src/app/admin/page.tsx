'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  getCourses, 
  addCourse, 
  updateCourse, 
  deleteCourse, 
  addLesson, 
  deleteLesson, 
  getLessons,
  supabase,
  updateUserSubscription,
  getSafeUuid
} from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Sparkles, 
  LineChart, 
  Settings, 
  Shield, 
  Activity, 
  FileText, 
  X, 
  Plus, 
  Search, 
  Award, 
  CreditCard, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  Clock, 
  ChevronRight, 
  Loader2, 
  Trash, 
  AlertCircle, 
  CheckCircle, 
  Archive,
  Terminal,
  ArrowRight,
  ExternalLink,
  Download
} from 'lucide-react'

type AdminTab = 'overview' | 'users' | 'courses' | 'ai-studio' | 'analytics' | 'subscriptions'
type GeneratorType = 'course' | 'lesson' | 'quiz' | 'flashcards' | 'exam' | 'rubric'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [adminEmail, setAdminEmail] = useState<string>('')
  const [userFilter, setUserFilter] = useState<'all' | 'active-students' | 'active-admins' | 'suspended'>('all')

  // Core Data States
  const [courses, setCourses] = useState<any[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [usersList, setUsersList] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true)
  const [subSearchQuery, setSubSearchQuery] = useState('')

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  const [userHistory, setUserHistory] = useState<any>({ courseProgress: [], lessonProgress: [], stats: null, certificates: [] })

  // Course Management States
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [category, setCategory] = useState('web-dev')
  const [difficulty, setDifficulty] = useState('beginner')
  const [courseTier, setCourseTier] = useState('Free')

  // Edit Course Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editCategory, setEditCategory] = useState('web-dev')
  const [editDifficulty, setEditDifficulty] = useState('beginner')
  const [editTier, setEditTier] = useState('Free')

  // Lesson Management Modal States
  const [isLessonsModalOpen, setIsLessonsModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [courseLessons, setCourseLessons] = useState<any[]>([])
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonDuration, setNewLessonDuration] = useState(15)
  const [newLessonPreview, setNewLessonPreview] = useState(false)
  const [newLessonContent, setNewLessonContent] = useState('')
  const [lessonActionLoading, setLessonActionLoading] = useState(false)

  // AI Content Studio States
  const [generatorType, setGeneratorType] = useState<GeneratorType>('course')
  const [generatorTopic, setGeneratorTopic] = useState('')
  const [generatorAudience, setGeneratorAudience] = useState('')
  const [generatorDifficulty, setGeneratorDifficulty] = useState('beginner')
  const [generatorTone, setGeneratorTone] = useState('professional')
  const [aiResult, setAiResult] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)

  // Live System clock
  const [tick, setTick] = useState(0)
  const now = new Date()

  useEffect(() => {
    // Fetch logged in admin email and verify authorization
    const fetchAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login?redirect=/admin')
          return
        }

        const email = session.user.email
        if (!email || email.toLowerCase() !== 'admin@farfindarole.com') {
          router.push('/dashboard')
          return
        }

        setAdminEmail(email)

        // Only load dashboard data after authorization is verified
        loadCourses()
        loadUsers()
        loadSubscriptions()
      } catch (err) {
        console.error('Error fetching admin session:', err)
        router.push('/dashboard')
      }
    }
    fetchAdminSession()

    const clockInterval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(clockInterval)
  }, [])

  const loadCourses = async () => {
    try {
      setCoursesLoading(true)
      const data = await getCourses()
      const withCount = await Promise.all(
        (data || []).map(async (c: any) => {
          try {
            const l = await getLessons(c.id)
            return { ...c, lessonsCount: l.length }
          } catch {
            return { ...c, lessonsCount: 0 }
          }
        })
      )
      setCourses(withCount)
    } catch (err) {
      console.error('Error loading courses:', err)
    } finally {
      setCoursesLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setUsersLoading(true)
      
      // Fetch all user profiles from database
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
      
      if (pError) throw pError

      // Fetch subscriptions from database
      const { data: subs, error: sError } = await supabase
        .from('subscriptions')
        .select('*')
      
      if (sError) throw sError

      // Fetch local/active users from /api/users
      let localUsers: any[] = []
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          const json = await res.json()
          localUsers = json.users || []
        }
      } catch (err) {
        console.error('Error loading users from API:', err)
      }

      const subsMap: Record<string, any> = {}
      ;(subs || []).forEach((s: any) => {
        subsMap[s.user_id] = s
      })

      // Map profiles by name or id
      const profilesByName: Record<string, any> = {}
      const profilesById: Record<string, any> = {}
      ;(profiles || []).forEach((p: any) => {
        if (p.full_name) {
          profilesByName[p.full_name.toLowerCase()] = p
        }
        profilesById[p.id] = p
      })

      // Construct combined users list
      const combined = localUsers.map((lu: any) => {
        let profile = profilesByName[lu.name.toLowerCase()]
        if (!profile) {
          profile = profilesById[lu.id]
        }

        const id = profile?.id || lu.id || lu.email
        const status = profile?.status || 'active'
        const role = profile?.role || lu.role || 'student'
        
        const sub = subsMap[id] || subsMap[lu.email] || { plan: 'free', billing_period: 'monthly', status: 'inactive' }
        let plan = sub.plan
        if (!plan && sub.subscription_plan) {
          const lower = sub.subscription_plan.toLowerCase()
          if (lower.includes('pro') || lower.includes('student pro')) plan = 'pro'
          else if (lower.includes('basic')) plan = 'basic'
          else if (lower.includes('advanced')) plan = 'advanced'
          else plan = 'free'
        }

        return {
          id,
          full_name: lu.name || profile?.full_name || 'Guest Student',
          email: lu.email,
          role,
          status,
          updated_at: profile?.updated_at || new Date().toISOString(),
          subscription: {
            ...sub,
            plan: plan || 'free'
          }
        }
      })

      // Also append any profiles that are NOT in localUsers list
      ;(profiles || []).forEach((p: any) => {
        const isAlreadyMapped = combined.some(u => u.id === p.id)
        if (!isAlreadyMapped) {
          const sub = subsMap[p.id] || { plan: 'free', billing_period: 'monthly', status: 'inactive' }
          let plan = sub.plan
          if (!plan && sub.subscription_plan) {
            const lower = sub.subscription_plan.toLowerCase()
            if (lower.includes('pro') || lower.includes('student pro')) plan = 'pro'
            else if (lower.includes('basic')) plan = 'basic'
            else if (lower.includes('advanced')) plan = 'advanced'
            else plan = 'free'
          }
          
          let fallbackEmail = p.email || (p.role === 'admin' ? 'admin@farfindarole.com' : `student-${p.id.slice(0, 4)}@farfindarole.com`)

          combined.push({
            id: p.id,
            full_name: p.full_name || 'Database Profile',
            email: fallbackEmail,
            role: p.role || 'student',
            status: p.status || 'active',
            updated_at: p.updated_at,
            subscription: {
              ...sub,
              plan: plan || 'free'
            }
          })
        }
      })

      // Ensure unique IDs in combined list as a final safety check
      const uniqueCombined = []
      const seenIds = new Set()
      for (const u of combined) {
        if (!seenIds.has(u.id)) {
          seenIds.add(u.id)
          uniqueCombined.push(u)
        }
      }

      setUsersList(uniqueCombined)
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/admin/subscriptions', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (res.ok) {
        const json = await res.json()
        setSubscriptionsList(json.transactions || [])
      } else {
        console.error('Failed to load admin subscriptions list')
      }
    } catch (err) {
      console.error('Error loading admin subscriptions:', err)
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  const handleExportUsersToCsv = () => {
    if (usersList.length === 0) return
    
    const headers = ['Full Name', 'Email', 'Plan Tier', 'System Role', 'Workspace Status', 'Stripe Customer ID', 'Stripe Subscription ID']
    const rows = usersList.map(u => [
      u.full_name || 'Guest Student',
      u.email || '',
      u.subscription?.plan || 'free',
      u.role || 'student',
      u.status || 'active',
      u.subscription?.stripe_customer_id || '',
      u.subscription?.stripe_subscription_id || ''
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `platform_users_export_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportSubscriptionsToCsv = () => {
    if (subscriptionsList.length === 0) return
    
    const headers = ['Purchaser Name', 'Email', 'Plan', 'Billing Period', 'Transaction ID', 'Customer ID', 'Subscription ID', 'Amount', 'Currency', 'Status', 'Purchased At']
    const rows = subscriptionsList.map(tx => [
      tx.name || '',
      tx.email || '',
      tx.plan || '',
      tx.billingPeriod || '',
      tx.transactionId || '',
      tx.customerId || '',
      tx.subscriptionId || '',
      tx.amount || 0,
      tx.currency || '',
      tx.status || '',
      tx.createdAt || ''
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `stripe_transactions_export_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const fetchUserLearningHistory = async (userId: string, email: string) => {
    try {
      setUserDetailLoading(true)
      
      const { data: courseProgress } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', email)

      const { data: lessonProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', email)

      const { data: stats } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', email)
        .single()

      // Dynamically map completed courses as issued certificates
      const completedCourses = (courseProgress || []).filter((cp: any) => cp.completed)
      const certificates = completedCourses.map((cc: any) => {
        const matchingCourse = courses.find(c => c.id === cc.course_id)
        return {
          id: `cert-${cc.course_id.slice(0, 4)}-${userId.slice(0, 4)}`,
          courseTitle: matchingCourse?.title || 'Unknown Course',
          completedAt: cc.completed_at || cc.last_accessed
        }
      })

      setUserHistory({
        courseProgress: courseProgress || [],
        lessonProgress: lessonProgress || [],
        stats: stats || { xp_total: 0, current_streak_days: 0, learning_hours: 0, lessons_completed: 0 },
        certificates
      })
    } catch (err) {
      console.error('Error fetching learning history:', err)
    } finally {
      setUserDetailLoading(false)
    }
  }

  const handleToggleSuspendUser = async (profileId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    if (!confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) return
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', profileId)

      if (error) throw error
      await loadUsers()
      if (selectedUserDetail?.id === profileId) {
        setSelectedUserDetail((prev: any) => ({ ...prev, status: newStatus }))
      }
      alert(`User status successfully updated to ${newStatus}.`)
    } catch (err: any) {
      alert('Failed to update status: ' + err.message)
    }
  }

  const handleUpdateUserSubscription = async (userId: string, newPlan: string) => {
    try {
      setLoading(true)
      setStatusMsg({ type: '', text: '' })
      
      await updateUserSubscription(userId, newPlan)
      
      const safeId = getSafeUuid(userId)
      // Update profiles database table role to sync with plan
      let newRole = 'student'
      if (newPlan === 'pro' || newPlan === 'advanced') newRole = 'pro'

      const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', safeId)
      if (roleError) console.error('Failed to sync profile role:', roleError)
      
      // Update local state list
      setUsersList(prev => prev.map(u => {
        if (u.id === userId || u.id === safeId) {
          return {
            ...u,
            role: newRole,
            subscription: {
              ...u.subscription,
              plan: newPlan
            }
          }
        }
        return u
      }))

      // Sync with local server-store API
      const userObj = usersList.find(u => u.id === userId)
      if (userObj && userObj.email) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userObj.email,
            role: newRole === 'pro' ? 'pro' : 'student',
            name: userObj.full_name
          })
        }).catch(err => console.error('Failed to sync user role in server store:', err))
      }
      
      setStatusMsg({ 
        type: 'success', 
        text: `Successfully updated user subscription to ${newPlan.toUpperCase()}.` 
      })
    } catch (err: any) {
      console.error(err)
      setStatusMsg({ 
        type: 'error', 
        text: err.message || 'Failed to update user subscription.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublishCourse = async (courseId: string, currentPublished: boolean) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('courses')
        .update({ published: !currentPublished, updated_at: new Date().toISOString() })
        .eq('id', courseId)
      
      if (error) throw error
      
      setStatusMsg({ 
        type: 'success', 
        text: `Course was successfully ${!currentPublished ? 'published' : 'archived'}.` 
      })
      await loadCourses()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update course state.' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseTitle.trim() || !courseDesc.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill out all required fields.' })
      return
    }
    setLoading(true)
    setStatusMsg({ type: '', text: '' })
    try {
      // Standard client-side helper wraps course insert + joins course_analytics trigger defaults
      await addCourse(courseTitle, courseDesc, category, difficulty)
      setStatusMsg({ type: 'success', text: `Course "${courseTitle}" successfully created!` })
      setCourseTitle('')
      setCourseDesc('')
      await loadCourses()
      setActiveTab('courses')
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error creating course.' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editDesc.trim() || !editingCourse) return
    setLoading(true)
    setStatusMsg({ type: '', text: '' })
    try {
      await updateCourse(editingCourse.id, editTitle, editDesc, editCategory, editDifficulty)
      setStatusMsg({ type: 'success', text: `Course metadata updated successfully.` })
      setIsEditModalOpen(false)
      await loadCourses()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error updating course.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourseClick = async (courseId: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its lesson modules? This action is permanent.`)) return
    setLoading(true)
    setStatusMsg({ type: '', text: '' })
    try {
      await deleteCourse(courseId)
      setStatusMsg({ type: 'success', text: `Course "${title}" and its lessons have been deleted.` })
      await loadCourses()
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error deleting course.' })
    } finally {
      setLoading(false)
    }
  }

  const openLessonsModal = async (course: any) => {
    setSelectedCourse(course)
    setIsLessonsModalOpen(true)
    setNewLessonTitle('')
    setNewLessonDuration(15)
    setNewLessonPreview(false)
    setNewLessonContent('')
    try {
      setCourseLessons((await getLessons(course.id)) || [])
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLessonTitle.trim() || !newLessonContent.trim() || !selectedCourse) return
    setLessonActionLoading(true)
    try {
      await addLesson(selectedCourse.id, newLessonTitle, newLessonContent, newLessonDuration, newLessonPreview)
      setCourseLessons((await getLessons(selectedCourse.id)) || [])
      setNewLessonTitle('')
      setNewLessonDuration(15)
      setNewLessonPreview(false)
      setNewLessonContent('')
      await loadCourses()
    } catch (err: any) {
      alert(err.message || 'Error adding lesson module')
    } finally {
      setLessonActionLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!selectedCourse || !confirm(`Delete lesson "${title}"?`)) return
    setLessonActionLoading(true)
    try {
      await deleteLesson(selectedCourse.id, lessonId)
      setCourseLessons((await getLessons(selectedCourse.id)) || [])
      await loadCourses()
    } catch (err: any) {
      alert(err.message || 'Error deleting lesson')
    } finally {
      setLessonActionLoading(false)
    }
  }

  // AI Content Studio Generator Prompt Router
  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generatorTopic.trim()) return

    setAiGenerating(true)
    setAiResult('')

    let resolvedPrompt = ''
    switch (generatorType) {
      case 'course':
        resolvedPrompt = `Build an enterprise syllabus roadmap in structured Markdown format. Topic: "${generatorTopic}". Audience: "${generatorAudience || 'professional software developers'}". Target Difficulty: "${generatorDifficulty}". Tone: "${generatorTone}". Include 4 primary modules, each having a module name and 2 lesson titles with descriptions.`
        break
      case 'lesson':
        resolvedPrompt = `Generate a full lesson guide in Markdown. Topic: "${generatorTopic}". Difficulty: "${generatorDifficulty}". Context/Scope: "${generatorAudience}". Style: "${generatorTone}". Provide clear code snippets, detailed explanations, and bulleted takeaways.`
        break
      case 'quiz':
        resolvedPrompt = `Construct a 5-question multiple choice assessment in Markdown. Topic: "${generatorTopic}". Difficulty: "${generatorDifficulty}". Include correct answers and detailed explanations for each question.`
        break
      case 'flashcards':
        resolvedPrompt = `Create a list of 8 term-and-definition flashcards in Markdown. Topic: "${generatorTopic}". Difficulty: "${generatorDifficulty}". Format clearly with headers Q: and A:.`
        break
      case 'exam':
        resolvedPrompt = `Generate a full enterprise mock certification exam in Markdown. Topic: "${generatorTopic}". Difficulty: "${generatorDifficulty}". Include 10 comprehensive questions ranging from conceptual to scenario-based engineering puzzles.`
        break
      default:
        resolvedPrompt = `Generate educational documentation in Markdown on topic: "${generatorTopic}".`
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const currentEmail = session?.user?.email || 'admin@farfindarole.com'

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentEmail
        },
        body: JSON.stringify({
          type: generatorType,
          prompt: resolvedPrompt
        })
      })

      if (res.ok) {
        const json = await res.json()
        setAiResult(json.text || json.message || 'Generation complete. Markdown content loaded below.')
      } else {
        const text = await res.text()
        setAiResult(`Failed to generate content: ${text}`)
      }
    } catch (err: any) {
      setAiResult(`AI Generation error: ${err.message}`)
    } finally {
      setAiGenerating(false)
    }
  }

  // Pre-fill creation form fields with AI generated contents
  const handlePopulateFormFromAi = () => {
    if (!aiResult) return
    const lines = aiResult.split('\n')
    const titleLine = lines.find(l => l.startsWith('# ') || l.startsWith('## ') || l.toLowerCase().includes('topic'))
    const cleanTitle = titleLine ? titleLine.replace(/[#*]/g, '').trim() : generatorTopic
    setCourseTitle(cleanTitle)
    setCourseDesc(aiResult)
    setCategory('uncategorized')
    setActiveTab('courses')
    setStatusMsg({ type: 'success', text: 'Course creator pre-filled with AI syllabus! Verify and publish.' })
  }

  // User Management filtering
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = (u.full_name || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (userFilter === 'active-students') {
      return u.role !== 'admin' && u.status !== 'suspended'
    }
    if (userFilter === 'active-admins') {
      return u.role === 'admin' && u.status !== 'suspended'
    }
    if (userFilter === 'suspended') {
      return u.status === 'suspended'
    }
    return true
  })

  // Course Management filtering
  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(courseSearchQuery.toLowerCase())
  )

  // SaaS KPIs calculations
  const totalUsersCount = usersList.length
  const activeLearnersCount = usersList.filter(u => u.role !== 'admin' && u.status !== 'suspended').length
  const totalPublishedCourses = courses.filter(c => c.published).length
  const totalLessonsCount = courses.reduce((a, c) => a + (c.lessonsCount || 0), 0)

  // Calculated SaaS Revenue Indicators (Pro and Basic billing counts from database)
  const proSubCount = usersList.filter(u => u.subscription?.plan === 'pro').length
  const basicSubCount = usersList.filter(u => u.subscription?.plan === 'basic').length
  const calculatedMrr = (proSubCount * 799 + basicSubCount * 499)

  return (
    <div className="flex-1 bg-slate-50 text-slate-800 flex select-none min-h-screen relative overflow-hidden font-sans">
      
      {/* ── Left Sidebar Navigation ── */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col hidden lg:flex relative z-10">
        
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-red-655 uppercase tracking-widest leading-none">Admin Panel</p>
              <p className="text-sm font-extrabold text-slate-800 mt-1">SaaS Console</p>
            </div>
          </div>

          {/* System Time clock */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">System Clock</span>
            <span className="text-[10px] font-mono font-black text-red-655">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 py-2">Workspace Navigation</p>
          
          {[
            { id: 'overview' as const, label: 'Overview Metrics', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'users' as const, label: 'User Directory', icon: <Users className="w-4 h-4" /> },
            { id: 'courses' as const, label: 'Course Catalog', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'ai-studio' as const, label: 'AI Content Studio', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'analytics' as const, label: 'Platform Analytics', icon: <LineChart className="w-4 h-4" /> },
            { id: 'subscriptions' as const, label: 'Stripe Subscriptions', icon: <CreditCard className="w-4 h-4" /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                setStatusMsg({ type: '', text: '' })
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 cursor-pointer border border-transparent outline-none ${
                activeTab === item.id
                  ? 'bg-slate-100 border-slate-200 text-slate-900 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className={activeTab === item.id ? 'text-red-500' : 'text-slate-400'}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-black text-[9px] text-white">AD</div>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none">Security context</p>
              <p className="text-xs font-extrabold text-slate-800 mt-1 truncate font-sans">Administrator Seat</p>
            </div>
          </div>
          <Link href="/" className="mt-3 flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors">
            &larr; Return to Student Portal
          </Link>
        </div>
      </aside>

      {/* ── Main Dashboard Area ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-y-auto">

        {/* Top Navbar */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest border border-rose-200 bg-rose-50 px-2.5 py-1 rounded-full">
              Enterprise Workspace
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex lg:hidden gap-1.5">
              {[
                { id: 'overview' as const, icon: <LayoutDashboard className="w-4 h-4" /> },
                { id: 'users' as const, icon: <Users className="w-4 h-4" /> },
                { id: 'courses' as const, icon: <BookOpen className="w-4 h-4" /> },
                { id: 'ai-studio' as const, icon: <Sparkles className="w-4 h-4" /> },
                { id: 'analytics' as const, icon: <LineChart className="w-4 h-4" /> },
                { id: 'subscriptions' as const, icon: <CreditCard className="w-4 h-4" /> }
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => {
                    setActiveTab(item.id)
                    setStatusMsg({ type: '', text: '' })
                  }}
                  className={`p-2 rounded-lg transition border-none cursor-pointer ${
                    activeTab === item.id ? 'bg-slate-100 text-slate-800' : 'text-slate-500 bg-transparent'
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Notifications */}
        {statusMsg.text && (
          <div className={`mx-6 mt-4 p-3.5 rounded-xl flex items-center gap-3 border text-xs font-bold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-250 text-emerald-700'
              : 'bg-red-55 border-red-250 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg({ type: '', text: '' })} className="ml-auto text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 p-6">

          {/* ── 1. DASHBOARD OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto space-y-8 text-left animate-fadeIn">
              
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Platform Overview
                </h1>
                <p className="text-slate-500 text-xs mt-1.5 font-sans">Consolidated analytical overview of student profiles, catalog metrics, and billing operations.</p>
              </div>

              {/* Aggregated KPI Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Total Users', value: String(totalUsersCount), icon: <Users className="w-4 h-4" />, color: 'text-red-600', bg: 'bg-red-50 border-red-200 text-red-700' },
                  { label: 'Active Learners', value: String(activeLearnersCount), icon: <Activity className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-55 border-sky-200 text-sky-700' },
                  { label: 'Courses Published', value: String(totalPublishedCourses), icon: <BookOpen className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 text-amber-700' },
                  { label: 'Lesson Modules', value: String(totalLessonsCount), icon: <FileText className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200 text-violet-750' },
                  { label: 'Monthly MRR', value: `₹${Number(calculatedMrr).toLocaleString('en-IN')}`, icon: <CreditCard className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  { label: 'Billing Seats', value: String(proSubCount + basicSubCount), icon: <Award className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 text-indigo-750' }
                ].map((kpi, i) => (
                  <div key={i} className={`bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between min-h-[108px] shadow-xs`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{kpi.label}</span>
                      <span className={kpi.color}>{kpi.icon}</span>
                    </div>
                    <p className="text-xl xl:text-2xl font-black text-slate-800 leading-none mt-4">{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Analytics Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SVG Revenue area chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Monthly Recurring Revenue</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Calculated from active premium database tiers</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <TrendingUp className="w-3.5 h-3.5" /> +14.2%
                    </div>
                  </div>
                  <div className="relative h-44 w-full">
                    <svg viewBox="0 0 500 160" className="w-full h-full">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="3" />
                      
                      {/* Chart Area */}
                      <path d="M 0 150 Q 100 110 200 90 T 400 50 Q 450 60 500 30 L 500 150 Z" fill="url(#areaGrad)" />
                      {/* Chart Line */}
                      <path d="M 0 150 Q 100 110 200 90 T 400 50 Q 450 60 500 30" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                      
                      {/* Labels */}
                      <text x="5" y="15" fill="#64748b" fontSize="8" fontFamily="monospace">Q1 2026</text>
                      <text x="465" y="15" fill="#64748b" fontSize="8" fontFamily="monospace">Q2 2026</text>
                    </svg>
                  </div>
                </div>

                {/* SVG User Acquisition chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">User Acquisition Growth</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Registration growth timeline for verified seats</p>
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 text-xs font-bold">
                      <Users className="w-3.5 h-3.5" /> Active directory
                    </div>
                  </div>
                  <div className="relative h-44 w-full">
                    <svg viewBox="0 0 500 160" className="w-full h-full">
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="3" />
                      
                      {/* Chart Line */}
                      <path d="M 0 130 C 80 140, 150 70, 250 80 T 500 20" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      
                      {/* Dots on line */}
                      <circle cx="250" cy="80" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx="500" cy="20" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

              </div>

              {/* Courses & Students Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Courses Card */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-red-500" /> Active Platform Courses
                    </h3>
                    <button onClick={() => setActiveTab('courses')} className="text-[10px] text-red-600 hover:text-red-550 font-bold transition-colors bg-transparent border-none cursor-pointer">
                      View Course Catalog &rarr;
                    </button>
                  </div>
                  {coursesLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 text-red-500 animate-spin" /></div>
                  ) : courses.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {courses.slice(0, 4).map((c) => (
                        <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{c.title}</span>
                              <span className="text-[9px] font-mono text-slate-400 block mt-1">{c.instructor_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-550 px-2 py-0.5 rounded uppercase">{c.category}</span>
                            <span className="text-[10px] font-mono font-bold text-red-600">{c.lessonsCount} lessons</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">No active courses published in catalog database.</div>
                  )}
                </div>

                {/* Active Students Card */}
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-sky-500" /> Active Students & Subscriptions
                    </h3>
                    <button onClick={() => { setActiveTab('users'); setUserFilter('active-students'); }} className="text-[10px] text-sky-600 hover:text-sky-550 font-bold transition-colors bg-transparent border-none cursor-pointer">
                      Manage Students &rarr;
                    </button>
                  </div>
                  {usersLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 text-sky-500 animate-spin" /></div>
                  ) : usersList.filter(u => u.role !== 'admin' && u.status !== 'suspended').length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {usersList
                        .filter(u => u.role !== 'admin' && u.status !== 'suspended')
                        .slice(0, 4)
                        .map((u) => {
                          const isPro = u.subscription?.plan === 'pro'
                          const isBasic = u.subscription?.plan === 'basic'
                          const isAdvanced = u.subscription?.plan === 'advanced'
                          
                          let tierLabel = 'Free'
                          let tierStyle = 'bg-slate-50 border-slate-200 text-slate-600'
                          if (isPro) {
                            tierLabel = 'Pro'
                            tierStyle = 'bg-amber-50 border-amber-200 text-amber-600'
                          } else if (isBasic) {
                            tierLabel = 'Basic'
                            tierStyle = 'bg-sky-50 border-sky-200 text-sky-655'
                          } else if (isAdvanced) {
                            tierLabel = 'Advanced'
                            tierStyle = 'bg-red-50 border-red-200 text-red-655'
                          }

                          return (
                            <div key={u.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-[10px] text-slate-600 flex-shrink-0">
                                  {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-slate-800 block truncate">{u.full_name || 'Guest Student'}</span>
                                  <span className="text-[9px] font-mono text-slate-400 block mt-0.5 truncate">{u.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${tierStyle}`}>
                                  {tierLabel}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs">No active students registered on the platform.</div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ── 2. USER DIRECTORY TAB ── */}
          {activeTab === 'users' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Directory</h2>
                  <p className="text-slate-500 text-xs mt-1">Audit platform accounts, verify learning stats, view certificates, and manage subscriptions.</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                  <button
                    onClick={handleExportUsersToCsv}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer border-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  {adminEmail && (
                    <div className="bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      <span>Admin Account: <strong className="font-mono">{adminEmail}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Tabs & Search Controls */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: 'All Users', count: usersList.length },
                    { id: 'active-students' as const, label: 'Active Students', count: usersList.filter(u => u.role !== 'admin' && u.status !== 'suspended').length },
                    { id: 'active-admins' as const, label: 'Active Admins', count: usersList.filter(u => u.role === 'admin' && u.status !== 'suspended').length },
                    { id: 'suspended' as const, label: 'Suspended Users', count: usersList.filter(u => u.status === 'suspended').length }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setUserFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                        userFilter === f.id
                          ? 'bg-slate-800 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        userFilter === f.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search user profile database by name or email..."
                    className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full"
                  />
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {usersLoading ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                          <th className="py-3.5 px-6">Seat Name</th>
                          <th className="py-3.5 px-6">Identified Email</th>
                          <th className="py-3.5 px-6">License Plan</th>
                          <th className="py-3.5 px-6">System Role</th>
                          <th className="py-3.5 px-6">Workspace Status</th>
                          <th className="py-3.5 px-6 text-right">Directory Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredUsers.map((user) => {
                          const isPro = user.subscription?.plan === 'pro'
                          const isBasic = user.subscription?.plan === 'basic'
                          const isAdvanced = user.subscription?.plan === 'advanced'
                          
                          let tierLabel = 'Free'
                          let tierStyle = 'bg-slate-50 border-slate-200 text-slate-600'
                          if (isPro) {
                            tierLabel = 'Pro Plan'
                            tierStyle = 'bg-amber-50 border-amber-200 text-amber-600'
                          } else if (isBasic) {
                            tierLabel = 'Basic'
                            tierStyle = 'bg-sky-50 border-sky-200 text-sky-655'
                          } else if (isAdvanced) {
                            tierLabel = 'Enterprise'
                            tierStyle = 'bg-red-50 border-red-200 text-red-655'
                          }

                          const isSuspended = user.status === 'suspended'

                          return (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 font-bold text-slate-800">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-[10px] text-slate-600">
                                    {user.full_name ? user.full_name.slice(0,2).toUpperCase() : 'ST'}
                                  </div>
                                  <span>{user.full_name || 'Guest Student'}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-mono text-[10px] text-slate-500">{user.email}</td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${tierStyle}`}>
                                  {tierLabel}
                                </span>
                              </td>
                              <td className="py-4 px-6 capitalize font-bold text-slate-600">{user.role}</td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  isSuspended 
                                    ? 'bg-red-50 text-red-600 border border-red-200' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                                <select
                                  value={user.subscription?.plan || 'free'}
                                  onChange={(e) => handleUpdateUserSubscription(user.id, e.target.value)}
                                  className="text-[10px] font-bold bg-white border border-slate-250 text-slate-700 px-2 py-1.5 rounded-lg cursor-pointer transition outline-none"
                                >
                                  <option value="free">Free (Revoked)</option>
                                  <option value="basic">Basic Plan</option>
                                  <option value="pro">Pro Plan</option>
                                  <option value="advanced">Advanced Plan</option>
                                </select>
                                <button
                                  onClick={() => {
                                    setSelectedUserDetail(user)
                                    fetchUserLearningHistory(user.id, user.email)
                                  }}
                                  className="text-[10px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                                >
                                  View Audit Profile
                                </button>
                                <button
                                  onClick={() => handleToggleSuspendUser(user.id, user.status)}
                                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition border ${
                                    isSuspended
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
                                      : 'bg-red-50 border-red-200 text-red-650 hover:bg-red-100/50'
                                  }`}
                                >
                                  {isSuspended ? 'Reactivate' : 'Suspend'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">No registered platform user accounts found.</div>
                )}
              </div>

            </div>
          )}

          {/* ── 3. COURSE CATALOG MANAGEMENT TAB ── */}
          {filteredCourses && activeTab === 'courses' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left animate-fadeIn">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Course Catalog</h2>
                  <p className="text-slate-500 text-xs mt-1">Publish tracks, author lesson modules, structure syllabus trees, and manage enrollments.</p>
                </div>
                <button 
                  onClick={() => {
                    setCourseTitle('')
                    setCourseDesc('')
                    setCategory('web-dev')
                    setDifficulty('beginner')
                    setStatusMsg({ type: '', text: '' })
                    setActiveTab('overview')
                    setTimeout(() => {
                      const element = document.getElementById('add-course-container')
                      if (element) element.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer border-none"
                >
                  <Plus className="w-3.5 h-3.5" /> Publish New Course
                </button>
              </div>

              {/* Search filter for courses */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input 
                  type="text" 
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  placeholder="Search course catalog database by title or category..."
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-450 outline-none w-full"
                />
              </div>

              {/* Catalog Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {coursesLoading ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : filteredCourses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                          <th className="py-3.5 px-6">Course Syllabus Title</th>
                          <th className="py-3.5 px-6">Category Scope</th>
                          <th className="py-3.5 px-6">Complexity Level</th>
                          <th className="py-3.5 px-6">Active Modules</th>
                          <th className="py-3.5 px-6">State</th>
                          <th className="py-3.5 px-6 text-right">Catalog Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredCourses.map((course) => (
                          <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-800">
                              <div className="max-w-[240px] truncate flex items-center gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {course.title}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-550 uppercase tracking-wider">
                                {course.category || 'uncategorized'}
                              </span>
                            </td>
                            <td className="py-4 px-6 capitalize font-bold text-slate-600">{course.difficulty}</td>
                            <td className="py-4 px-6">
                              <span className="text-red-600 font-mono font-bold text-[10px] bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                                {course.lessonsCount} lessons
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                course.published
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {course.published ? 'Published' : 'Archived'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                              <button 
                                onClick={() => {
                                  setEditingCourse(course)
                                  setEditTitle(course.title)
                                  setEditDesc(course.description)
                                  setEditCategory(course.category || 'web-dev')
                                  setEditDifficulty(course.difficulty || 'beginner')
                                  setEditTier(course.tier || 'Free')
                                  setIsEditModalOpen(true)
                                }}
                                className="bg-white border border-slate-250 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition"
                              >
                                Edit Metadata
                              </button>
                              <button 
                                onClick={() => openLessonsModal(course)}
                                className="bg-white border border-slate-250 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition"
                              >
                                Edit Modules
                              </button>
                              <button
                                onClick={() => handleTogglePublishCourse(course.id, course.published)}
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition border ${
                                  course.published
                                    ? 'bg-white border-slate-250 text-slate-500 hover:bg-slate-50'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
                                }`}
                              >
                                {course.published ? 'Archive' : 'Publish'}
                              </button>
                              <button 
                                onClick={() => handleDeleteCourseClick(course.id, course.title)}
                                className="bg-red-50 border border-red-200 text-red-650 hover:bg-red-100/50 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">No matching courses found in platform index.</div>
                )}
              </div>

              {/* Course Creator Form Section */}
              <div id="add-course-container" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-200">
                  <Plus className="w-4 h-4 text-red-600" /> Course Creator
                </h3>

                <form onSubmit={handleAddCourseSubmit} className="space-y-5 relative z-10">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Course Syllabus Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={courseTitle} 
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500 px-4 py-3 rounded-xl outline-none text-xs transition-all placeholder-slate-400"
                      placeholder="e.g., PostgreSQL Row Level Security Architecture" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category Scope</label>
                      <select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none text-xs cursor-pointer focus:border-red-500 transition-all"
                      >
                        <option value="web-dev">Web Development</option>
                        <option value="backend">Backend & Architecture</option>
                        <option value="python">Python & Machine Learning</option>
                        <option value="algorithms">Data Structures & Algos</option>
                        <option value="uncategorized">General Engineering</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Complexity Level</label>
                      <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded-xl outline-none text-xs cursor-pointer focus:border-red-500 transition-all"
                      >
                        <option value="beginner">Beginner (Introductory)</option>
                        <option value="intermediate">Intermediate (Standard)</option>
                        <option value="advanced">Advanced (Specialized)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                      Syllabus Outline & Description <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                      value={courseDesc} 
                      onChange={(e) => setCourseDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500 px-4 py-3 rounded-xl outline-none text-xs transition-all placeholder-slate-400 font-mono"
                      rows={5} 
                      placeholder="Describe target objectives, outcomes, and modular lesson breakdown..." 
                      required 
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-750 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-xs flex items-center gap-2 cursor-pointer border-none"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : <><Plus className="w-3.5 h-3.5" /> Publish to Catalog</>}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* ── 4. AI CONTENT STUDIO TAB ── */}
          {activeTab === 'ai-studio' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left animate-fadeIn">
              
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-red-500" /> AI Content Studio
                </h2>
                <p className="text-slate-500 text-xs mt-1">Accelerate content creation. Generate course roadmaps, modular lesson copy, and quizzes powered by Google Gemini.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Generation Config Panel */}
                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest pb-3 mb-4 border-b border-slate-200 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-450" /> Generation Settings
                  </h3>
                  
                  <form onSubmit={handleAiGenerate} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Syllabus Model Output</label>
                      <select 
                        value={generatorType} 
                        onChange={(e) => setGeneratorType(e.target.value as GeneratorType)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl outline-none text-xs cursor-pointer focus:border-red-500 transition-all"
                      >
                        <option value="course">Course Roadmap Syllabus</option>
                        <option value="lesson">Lesson Documentation Guide</option>
                        <option value="quiz">Assessment Quiz Sheet</option>
                        <option value="flashcards">Term Flashcards Deck</option>
                        <option value="exam">Certification Mock Exam</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1.5">Target Topic</label>
                      <input 
                        type="text" 
                        value={generatorTopic} 
                        onChange={(e) => setGeneratorTopic(e.target.value)}
                        placeholder="e.g. Docker Containerization"
                        className="w-full bg-slate-55 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all"
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1.5">Target Audience</label>
                      <input 
                        type="text" 
                        value={generatorAudience} 
                        onChange={(e) => setGeneratorAudience(e.target.value)}
                        placeholder="e.g. Senior Backend Engineers"
                        className="w-full bg-slate-55 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1.5">Difficulty</label>
                        <select 
                          value={generatorDifficulty} 
                          onChange={(e) => setGeneratorDifficulty(e.target.value)}
                          className="w-full bg-slate-55 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-xl outline-none text-[11px] cursor-pointer focus:border-red-500 transition-all"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-550 uppercase tracking-widest mb-1.5">Tone Profile</label>
                        <select 
                          value={generatorTone} 
                          onChange={(e) => setGeneratorTone(e.target.value)}
                          className="w-full bg-slate-55 border border-slate-200 text-slate-700 px-3 py-2.5 rounded-xl outline-none text-[11px] cursor-pointer focus:border-red-500 transition-all"
                        >
                          <option value="academic">Academic</option>
                          <option value="professional">Professional</option>
                          <option value="industry">Industry Style</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={aiGenerating}
                      className="w-full mt-4 bg-gradient-to-r from-red-650 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border-none"
                    >
                      {aiGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Content...</> : <><Sparkles className="w-3.5 h-3.5" /> Generate via AI</>}
                    </button>
                  </form>
                </div>

                {/* Generation Output Terminal */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col min-h-[420px] shadow-xs">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-red-500" /> Studio Console Output
                    </h3>
                    {aiResult && generatorType === 'course' && (
                      <button 
                        onClick={handlePopulateFormFromAi}
                        className="text-[10px] font-black bg-red-600 hover:bg-red-750 text-white px-3 py-1.5 rounded-lg cursor-pointer transition border-none shadow-sm flex items-center gap-1.5"
                      >
                        Import Outline to Catalog <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto max-h-[460px] font-mono text-[11px] text-slate-800 leading-relaxed text-left selection:bg-red-500/10 select-text">
                    {aiGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                        <span className="font-sans font-bold uppercase text-[9px] tracking-widest">Querying educational LLM context...</span>
                      </div>
                    ) : aiResult ? (
                      <pre className="whitespace-pre-wrap">{aiResult}</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center py-24 text-slate-400">
                        <Sparkles className="w-8 h-8 text-slate-300 mb-2.5" />
                        <p className="font-sans text-xs">Configure syllabus settings and launch generation.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── 5. PLATFORM ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left animate-fadeIn">
              
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Analytics</h2>
                <p className="text-slate-500 text-xs mt-1">Deep analysis of engagement trajectories, conversion trends, and modular completions.</p>
              </div>

              {/* Extended Metrics Graph grids */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SVG Engagement distribution */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">User Engagement distribution</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Average modular completions mapped weekly</p>
                    </div>
                  </div>
                  <div className="relative h-44 w-full">
                    <svg viewBox="0 0 500 160" className="w-full h-full">
                      {/* Grid lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="3" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="3" />
                      
                      {/* Bars */}
                      <rect x="30" y="70" width="30" height="80" rx="3" fill="#ef4444" />
                      <rect x="110" y="50" width="30" height="100" rx="3" fill="#ef4444" />
                      <rect x="190" y="30" width="30" height="120" rx="3" fill="#ef4444" />
                      <rect x="270" y="60" width="30" height="90" rx="3" fill="#ef4444" />
                      <rect x="350" y="40" width="30" height="110" rx="3" fill="#ef4444" />
                      <rect x="430" y="20" width="30" height="130" rx="3" fill="#ef4444" />
                    </svg>
                  </div>
                </div>

                {/* Subscriptions breakdown */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs col-span-1 text-left">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6">Plan Conversion</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Enterprise Seats', count: proSubCount + basicSubCount, percentage: '100%', style: 'w-full bg-red-600' },
                      { label: 'Premium Pro', count: proSubCount, percentage: `${((proSubCount / (proSubCount + basicSubCount || 1)) * 100).toFixed(0)}%`, style: 'bg-amber-500' },
                      { label: 'Basic Tiers', count: basicSubCount, percentage: `${((basicSubCount / (proSubCount + basicSubCount || 1)) * 100).toFixed(0)}%`, style: 'bg-sky-500' }
                    ].map((plan, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>{plan.label}</span>
                          <span className="text-slate-800">{plan.count} ({plan.percentage})</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${plan.style}`} style={{ width: plan.percentage }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── 6. STRIPE SUBSCRIPTIONS TAB ── */}
          {activeTab === 'subscriptions' && (
            <div className="max-w-6xl mx-auto space-y-6 text-left animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stripe Subscriptions & Transactions</h2>
                  <p className="text-slate-500 text-xs mt-1">Real-time audit of payment transactions, license purchasing IDs, and customer information from Stripe.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleExportSubscriptionsToCsv}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer border-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={loadSubscriptions}
                    disabled={subscriptionsLoading}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer border border-slate-200"
                  >
                    {subscriptionsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-slate-400" />}
                    Refresh List
                  </button>
                </div>
              </div>

              {/* Search filter for subscriptions */}
              <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input 
                  type="text" 
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  placeholder="Search transactions by user email, name, plan, or purchasing ID..."
                  className="bg-transparent text-xs text-slate-800 placeholder-slate-450 outline-none w-full"
                />
              </div>

              {/* Transactions Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {subscriptionsLoading ? (
                  <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : subscriptionsList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                          <th className="py-3.5 px-6">Purchaser</th>
                          <th className="py-3.5 px-6">Email Address</th>
                          <th className="py-3.5 px-6">SaaS Plan</th>
                          <th className="py-3.5 px-6">Transaction ID</th>
                          <th className="py-3.5 px-6">Purchasing ID (Customer & Sub)</th>
                          <th className="py-3.5 px-6 text-right">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {subscriptionsList
                          .filter(tx => {
                            const q = subSearchQuery.toLowerCase()
                            return (
                              tx.name.toLowerCase().includes(q) ||
                              tx.email.toLowerCase().includes(q) ||
                              tx.plan.toLowerCase().includes(q) ||
                              tx.id.toLowerCase().includes(q) ||
                              tx.customerId.toLowerCase().includes(q) ||
                              tx.subscriptionId.toLowerCase().includes(q) ||
                              tx.transactionId.toLowerCase().includes(q)
                            )
                          })
                          .map((tx) => {
                            const isPro = tx.plan === 'pro'
                            const isBasic = tx.plan === 'basic'
                            const isAdvanced = tx.plan === 'advanced'
                            
                            let tierLabel = 'Free'
                            let tierStyle = 'bg-slate-50 border-slate-200 text-slate-600'
                            if (isPro) {
                              tierLabel = 'Pro Plan'
                              tierStyle = 'bg-amber-50 border-amber-200 text-amber-600'
                            } else if (isBasic) {
                              tierLabel = 'Basic'
                              tierStyle = 'bg-sky-50 border-sky-200 text-sky-655'
                            } else if (isAdvanced) {
                              tierLabel = 'Enterprise'
                              tierStyle = 'bg-red-50 border-red-200 text-red-655'
                            }

                            const isPaid = tx.status === 'paid'

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-800">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-[10px] text-slate-600">
                                      {tx.name ? tx.name.slice(0,2).toUpperCase() : 'US'}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block truncate">{tx.name}</span>
                                      <span className="block text-[8px] text-slate-400 font-mono font-semibold mt-0.5">Redirection ID: {tx.id.slice(0, 15)}...</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-mono text-[10px] text-slate-500">{tx.email}</td>
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black border uppercase tracking-wider ${tierStyle}`}>
                                      {tierLabel}
                                    </span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase">{tx.billingPeriod}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-1 items-start">
                                    {tx.transactionId && tx.transactionId !== 'N/A' ? (
                                      <a
                                        href={tx.transactionId.startsWith('in_') 
                                          ? `https://dashboard.stripe.com/test/invoices/${tx.transactionId}`
                                          : `https://dashboard.stripe.com/test/payments/${tx.transactionId}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[9px] bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1 group"
                                      >
                                        <span>{tx.transactionId}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </a>
                                    ) : (
                                      <span className="font-mono text-[9px] text-slate-400">N/A</span>
                                    )}
                                    <span className="text-[8px] text-slate-400 font-mono font-bold uppercase">Invoice Ref</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider w-8">Cust:</span>
                                    {tx.customerId ? (
                                      <a
                                        href={`https://dashboard.stripe.com/test/customers/${tx.customerId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[9px] text-slate-600 hover:text-slate-900 hover:underline transition flex items-center gap-1 group font-semibold"
                                      >
                                        <span>{tx.customerId}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </a>
                                    ) : (
                                      <span className="font-mono text-[9px] text-slate-400">N/A</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider w-8">Sub:</span>
                                    {tx.subscriptionId ? (
                                      <a
                                        href={`https://dashboard.stripe.com/test/subscriptions/${tx.subscriptionId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[9px] text-slate-600 hover:text-slate-900 hover:underline transition flex items-center gap-1 group font-semibold"
                                      >
                                        <span>{tx.subscriptionId}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </a>
                                    ) : (
                                      <span className="font-mono text-[9px] text-slate-400">N/A</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs font-black text-slate-900">
                                      ₹{tx.amount.toLocaleString('en-IN')} <span className="text-[9px] font-bold text-slate-400">{tx.currency}</span>
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      isPaid
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-250'
                                    }`}>
                                      {tx.status.toUpperCase()}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">No Stripe transactions or checkout histories found.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── User Audit Detail Modal ── */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 sm:p-8 max-w-xl w-full relative overflow-hidden text-left">
            
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-5 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" /> Audit Profile
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Identified User ID: <span className="font-mono">{selectedUserDetail.id}</span></p>
              </div>
              <button 
                onClick={() => setSelectedUserDetail(null)} 
                className="text-slate-400 hover:text-slate-800 transition p-1 cursor-pointer bg-transparent border-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userDetailLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                <span className="text-[9px] font-black uppercase tracking-widest">Querying learning telemetry...</span>
              </div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Seat Owner</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">{selectedUserDetail.full_name || 'Guest'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Auth Email</span>
                    <span className="text-xs font-mono text-slate-500 block mt-1 truncate">{selectedUserDetail.email}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan Tier</span>
                    <select
                      value={selectedUserDetail.subscription?.plan || 'free'}
                      onChange={(e) => {
                        handleUpdateUserSubscription(selectedUserDetail.id, e.target.value)
                        setSelectedUserDetail((prev: any) => ({
                          ...prev,
                          subscription: {
                            ...prev.subscription,
                            plan: e.target.value
                          }
                        }))
                      }}
                      className="text-xs font-bold bg-white border border-slate-200 text-slate-800 px-2 py-1 rounded-lg cursor-pointer transition outline-none"
                    >
                      <option value="free">Free (Revoked)</option>
                      <option value="basic">Basic Plan</option>
                      <option value="pro">Pro Plan</option>
                      <option value="advanced">Advanced Plan</option>
                    </select>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Access Status</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 capitalize">{selectedUserDetail.status || 'active'}</span>
                  </div>
                </div>

                {/* Progress Stats */}
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Learning Telemetry</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs font-mono text-red-650 font-extrabold block">{userHistory.stats?.xp_total || 0}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-1">Total XP</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs font-mono text-sky-650 font-extrabold block">{userHistory.stats?.lessons_completed || 0}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-1">Lessons</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs font-mono text-amber-605 font-extrabold block">{userHistory.stats?.current_streak_days || 0}d</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mt-1">Streak</span>
                    </div>
                  </div>
                </div>

                {/* Certificates */}
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Issued Certificates ({userHistory.certificates.length})</h4>
                  {userHistory.certificates.length > 0 ? (
                    <div className="space-y-2">
                      {userHistory.certificates.map((cert: any, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-slate-800">{cert.courseTitle}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500">
                            {new Date(cert.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No certificates issued to this seat owner yet.</p>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Course Modal ── */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 sm:p-8 max-w-lg w-full relative overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-500" /> Edit Course Metadata
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition p-1 cursor-pointer bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCourseSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Course Title</label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 text-slate-800 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all font-bold" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Category Scope</label>
                  <select 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl outline-none text-xs cursor-pointer focus:border-red-500 transition-all"
                  >
                    <option value="web-dev">Web Development</option>
                    <option value="backend">Backend & Architecture</option>
                    <option value="python">Python & Machine Learning</option>
                    <option value="algorithms">Data Structures & Algos</option>
                    <option value="uncategorized">General Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Complexity Level</label>
                  <select 
                    value={editDifficulty} 
                    onChange={(e) => setEditDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl outline-none text-xs cursor-pointer focus:border-red-500 transition-all"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Syllabus Description</label>
                <textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all" 
                  rows={4} 
                  required 
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs font-bold text-slate-550 hover:text-slate-800 px-4 py-2 transition-colors cursor-pointer bg-transparent border-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-750 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer border-none shadow-sm"
                >
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Lessons Modal ── */}
      {isLessonsModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-[28px] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden text-left">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 flex-shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-650" /> Lesson Studio
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Course: <span className="font-bold text-slate-700">{selectedCourse.title}</span></p>
              </div>
              <button onClick={() => setIsLessonsModalOpen(false)} className="text-slate-400 hover:text-slate-800 transition p-1 cursor-pointer bg-transparent border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Active Modules ({courseLessons.length})</h4>
                {courseLessons.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-200 bg-slate-50">
                    {courseLessons.map((lesson, index) => (
                      <div key={lesson.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{index + 1}. {lesson.title}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{lesson.duration_minutes} mins</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            {lesson.free_preview ? (
                              <span className="text-emerald-700 font-bold text-[8px] uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Free</span>
                            ) : (
                              <span className="text-slate-500 font-bold text-[8px] uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Locked</span>
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteLesson(lesson.id, lesson.title)} 
                          disabled={lessonActionLoading}
                          className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition cursor-pointer bg-transparent border-none"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-xs text-slate-550">No lessons published yet.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-650" /> Add Lesson Module
                </h4>
                <form onSubmit={handleAddLessonSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Lesson Title</label>
                    <input 
                      type="text" 
                      value={newLessonTitle} 
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="e.g., Implementing RLS Policy Queries"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Duration (Minutes)</label>
                      <input 
                        type="number" 
                        value={newLessonDuration} 
                        onChange={(e) => setNewLessonDuration(parseInt(e.target.value) || 0)}
                        min={1} 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs transition-all" 
                        required 
                      />
                    </div>
                    <div className="flex items-center pt-6 pl-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={newLessonPreview} 
                          onChange={(e) => setNewLessonPreview(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-red-650 focus:ring-red-500 cursor-pointer accent-red-600" 
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Free Preview</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Content (Markdown)</label>
                    <textarea 
                      value={newLessonContent} 
                      onChange={(e) => setNewLessonContent(e.target.value)}
                      placeholder={'### Lesson Scope\n* Describe key metrics...\n\n### Material Details\nWrite markdown explanation...'}
                      rows={5}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-red-500 px-4 py-2.5 rounded-xl outline-none text-xs font-mono transition-all" 
                      required 
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button 
                      type="submit" 
                      disabled={lessonActionLoading}
                      className="bg-indigo-600 hover:bg-indigo-750 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer border-none"
                    >
                      {lessonActionLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...</> : <><Plus className="w-3.5 h-3.5" /> Publish Module</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setIsLessonsModalOpen(false)}
                className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
              Close Studio
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)
}
