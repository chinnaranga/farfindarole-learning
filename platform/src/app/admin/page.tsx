export const runtime = 'edge';

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
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('
')
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
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('
')
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
    const lines = aiResult.split('
')
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
                      <TrendingUp className="w-3.5 h-3.5" /> +14.2