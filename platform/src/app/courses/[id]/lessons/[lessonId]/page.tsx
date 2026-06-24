'use client'

export const runtime = 'edge'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import PolicyModal from '@/components/PolicyModal'
import CodeEditor from '@/components/CodeEditor'
import {
  getCourse,
  getLessons,
  getProgress,
  getProgressDetails,
  saveProgress,
  saveCourseCompletion,
  getQuiz,
  supabase,
  getUserSubscription
} from '@/lib/supabase'
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  AlertCircle,
  HelpCircle,
  Sparkles,
  MessageSquare,
  FileText,
  Send,
  Loader2,
  X,
  ThumbsUp,
  Clock,
  BarChart3,
  Award,
  BookMarked,
  Copy,
  Check,
  Download,
  RefreshCw,
  GraduationCap,
  TrendingUp,
  Target,
  Play,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen,
  FileCheck2,
  Menu,
  Terminal,
  Info,
  Video,
  Code2
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lesson {
  id: string
  title: string
  content: string
  video_url?: string
  duration_minutes?: number
  order_num: number
  free_preview?: boolean
  coding_challenge_id?: string
}

interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  difficulty?: string
  category?: string
}

interface Comment {
  id: string
  itemId: string
  userName: string
  commentText: string
  createdAt: string
  likes?: number
}

interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Note {
  id: string
  text: string
  createdAt: Date
  lessonId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(mins: number): string {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function difficultyColor(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'intermediate': return 'text-amber-700 bg-amber-50 border-amber-200'
    case 'advanced': return 'text-red-700 bg-red-50 border-red-200'
    default: return 'text-slate-600 bg-slate-100 border-slate-200'
  }
}

// Lightweight markdown renderer — no external deps
function renderContent(text: string): React.ReactNode[] {
  if (!text) return []
  const sections = text.split(/```/g)
  const nodes: React.ReactNode[] = []

  sections.forEach((sec, secIdx) => {
    if (secIdx % 2 === 1) {
      // Code block
      const lines = sec.trim().split('\n')
      const lang = lines[0] || 'code'
      const code = lines.slice(1).join('\n')
      nodes.push(
        <div key={secIdx} className="my-6 rounded-2xl overflow-hidden border border-slate-250 bg-slate-100 font-mono text-xs leading-relaxed shadow-sm">
          <div className="bg-slate-200 px-4 py-2.5 text-[10px] text-slate-700 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-slate-500">{lang}</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-80" />
            </div>
          </div>
          <pre className="p-5 overflow-x-auto text-slate-800 bg-slate-50 text-[11px] leading-relaxed"><code className="text-indigo-900">{code}</code></pre>
        </div>
      )
      return
    }

    const lines = sec.split('\n')
    lines.forEach((line, lineIdx) => {
      const key = `${secIdx}-${lineIdx}`
      const clean = line.trim()
      if (clean.startsWith('### ')) {
        nodes.push(<h3 key={key} className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-2.5 tracking-tight">{clean.replace('### ', '')}</h3>)
      } else if (clean.startsWith('#### ')) {
        nodes.push(<h4 key={key} className="text-base font-extrabold text-slate-800 mt-7 mb-3">{clean.replace('#### ', '')}</h4>)
      } else if (clean.startsWith('## ')) {
        nodes.push(<h2 key={key} className="text-2xl font-black text-slate-900 mt-12 mb-5">{clean.replace('## ', '')}</h2>)
      } else if (clean.startsWith('* ') || clean.startsWith('- ')) {
        nodes.push(
          <div key={key} className="flex items-start gap-2.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
            <p className="text-slate-600 text-sm leading-relaxed">{clean.substring(2)}</p>
          </div>
        )
      } else if (/^\d+\. /.test(clean)) {
        const num = clean.match(/^(\d+)\. /)?.[1]
        nodes.push(
          <div key={key} className="flex items-start gap-2.5 mb-2.5">
            <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
            <p className="text-slate-600 text-sm leading-relaxed">{clean.replace(/^\d+\. /, '')}</p>
          </div>
        )
      } else if (clean === '---') {
        nodes.push(<hr key={key} className="border-slate-200 my-8" />)
      } else if (clean === '') {
        nodes.push(<div key={key} className="h-2" />)
      } else if (clean.startsWith('**') && clean.endsWith('**')) {
        nodes.push(<p key={key} className="font-bold text-slate-800 mb-3 text-sm">{clean.slice(2, -2)}</p>)
      } else {
        nodes.push(<p key={key} className="text-slate-600 mb-4 leading-relaxed text-sm">{line}</p>)
      }
    })
  })

  return nodes
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string
  const lessonId = params.lessonId as string

  // Core data
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [completed, setCompleted] = useState(false)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [activeUserId, setActiveUserId] = useState('')
  const [userName, setUserName] = useState('Student')
  const [subscriptionPlan, setSubscriptionPlan] = useState<'free' | 'basic' | 'pro' | 'advanced'>('free')

  // Coding Challenge Integration
  const [challenge, setChallenge] = useState<any>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consoleOutput, setConsoleOutput] = useState<any>(null)

  // Course-specific legal consent states
  const [showCourseConsentModal, setShowCourseConsentModal] = useState(false)
  const [hasCourseConsent, setHasCourseConsent] = useState(true)

  // Quiz
  const [quiz, setQuiz] = useState<any>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submittedQuiz, setSubmittedQuiz] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)

  // Graded Quiz & Practice Quiz Tabs Redesign
  const [activeTab, setActiveTab] = useState<'learn' | 'sandbox' | 'practice' | 'graded'>('learn')
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [quizAttempts, setQuizAttempts] = useState<any[]>([])
  const [gradedQuizSubmitted, setGradedQuizSubmitted] = useState(false)
  const [gradedQuizScore, setGradedQuizScore] = useState<number | null>(null)
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)
  const [aiQuestionExplanation, setAiQuestionExplanation] = useState<Record<number, string>>({})
  const [aiExplanationLoading, setAiExplanationLoading] = useState<Record<number, boolean>>({})
  const [allLessonQuizzes, setAllLessonQuizzes] = useState<any[]>([])

  // Sidebar panel
  const [activePanel, setActivePanel] = useState<'ai' | 'notes' | 'discussion' | 'resources' | null>('ai')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)

  // Lesson sidebar nav
  const [lessonNavOpen, setLessonNavOpen] = useState(false)

  // AI Assistant
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { role: 'assistant', content: "Hi! I'm your AI Learning Assistant. Ask me anything about this lesson — I can explain concepts, generate examples, or quiz you on the material.", timestamp: new Date() }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const aiScrollRef = useRef<HTMLDivElement>(null)
  const aiInputRef = useRef<HTMLTextAreaElement>(null)

  // Notes
  const [notes, setNotes] = useState<Note[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [noteCopied, setNoteCopied] = useState(false)

  // Discussion
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  // Completion celebration
  const [showCelebration, setShowCelebration] = useState(false)

  // ─── Load lesson data ────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadLessonData() {
      if (!courseId || !lessonId) return
      try {
        setLoading(true)

        // Get user identity from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        const userId = user.email || user.id
        setActiveUserId(userId)
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student')

        // Fetch user plan from subscriptions table
        const sub = await getUserSubscription(user.id)
        const currentPlan = sub.plan
        setSubscriptionPlan(currentPlan)

        // Load course & lessons from Supabase
        const [courseData, lessonsList] = await Promise.all([
          getCourse(courseId),
          getLessons(courseId)
        ])

        const lesson = lessonsList.find((l: Lesson) => l.id === lessonId)
        if (!lesson) {
          setErrorMsg('Lesson not found. It may have been removed or the link is incorrect.')
          return
        }

        setCourse(courseData)
        setLessons(lessonsList)
        setCurrentLesson(lesson)

        // Load progress for this lesson
        const progress = await getProgressDetails(userId, lessonId)
        setCompleted(progress.completed)
        setCompletedAt(progress.completedAt)

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

        // Count total completed lessons for progress bar
        let count = 0
        for (const les of lessonsList) {
          const done = await getProgress(userId, les.id)
          if (done) count++
        }
        setCompletedLessonsCount(count)

        // Fetch all quizzes for this lesson
        const { data: quizzesData, error: qErr } = await supabase
          .from('quizzes')
          .select('*, quiz_questions(*)')
          .eq('lesson_id', lessonId)

        if (!qErr && quizzesData && quizzesData.length > 0) {
          setAllLessonQuizzes(quizzesData)
          const practice = quizzesData.find((q: any) => !q.is_graded && !q.is_final)
          const graded = quizzesData.find((q: any) => q.is_graded)
          const activeQuiz = graded || practice || quizzesData[0] || null
          setQuiz(activeQuiz)

          if (graded && userId) {
            const { data: attempts, error: attErr } = await supabase
              .from('quiz_attempts')
              .select('*')
              .eq('user_id', userId)
              .eq('quiz_id', graded.id)
              .order('attempt_num', { ascending: true })
            if (!attErr && attempts) {
              setQuizAttempts(attempts)
            } else {
              setQuizAttempts([])
            }
          } else {
            setQuizAttempts([])
          }
        } else {
          setAllLessonQuizzes([])
          setQuiz(null)
          setQuizAttempts([])
        }

        // Fetch coding challenge if it exists
        if (lesson.coding_challenge_id) {
          const { data: challengeData } = await supabase
            .from('coding_challenges')
            .select('*')
            .eq('id', lesson.coding_challenge_id)
            .maybeSingle()

          if (challengeData) {
            setChallenge(challengeData)
            const defCodes = challengeData.default_code || {}
            setCodeMap(defCodes)
            const defaultLang = defCodes['javascript'] ? 'javascript' : (defCodes['python'] ? 'python' : 'javascript')
            setLanguage(defaultLang)
            setCode(defCodes[defaultLang] || '')
          } else {
            setChallenge(null)
          }
        } else {
          setChallenge(null)
        }

        // Reset quiz states for new lesson
        setShowQuiz(false)
        setSelectedAnswers({})
        setSubmittedQuiz(false)
        setQuizScore(null)
        setGradedQuizSubmitted(false)
        setGradedQuizScore(null)
        setAiQuestionExplanation({})

        // Load notes from localStorage (persisted per user+lesson)
        const noteKey = `notes_${userId}_${lessonId}`
        const savedNotes = localStorage.getItem(noteKey)
        if (savedNotes) {
          try {
            setNotes(JSON.parse(savedNotes))
          } catch {
            setNotes([])
          }
        } else {
          setNotes([])
        }

      } catch (err: any) {
        console.error('Error loading lesson:', err)
        setErrorMsg('Failed to load lesson content. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadLessonData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId])

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
          source_page: `lesson_details_${lessonId}`
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

  // Load discussion comments
  useEffect(() => {
    if (!lessonId) return
    async function loadComments() {
      setCommentsLoading(true)
      try {
        const res = await fetch(`/api/ai/comments?itemId=${lessonId}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
        }
      } catch (err) {
        console.error('Error loading comments:', err)
      } finally {
        setCommentsLoading(false)
      }
    }
    loadComments()

    // Restore liked comments from localStorage
    const likedKey = `liked_comments_${lessonId}`
    const saved = localStorage.getItem(likedKey)
    if (saved) {
      try { setLikedComments(new Set(JSON.parse(saved))) } catch {}
    }
  }, [lessonId])

  // Auto-scroll AI chat
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight
    }
  }, [aiMessages])

  // ─── Derived state ────────────────────────────────────────────────────────────

  const currentIndex = lessons.findIndex(l => l.id === lessonId)
  const nextLesson = currentIndex !== -1 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const overallProgress = lessons.length > 0 ? Math.round((completedLessonsCount / lessons.length) * 100) : 0
  const estimatedRemainingMins = lessons
    .slice(currentIndex)
    .filter(l => l.id !== lessonId)
    .reduce((acc, l) => acc + (l.duration_minutes || 15), 0)

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleToggleComplete = async () => {
    if (!activeUserId) return
    try {
      const nextState = !completed
      await saveProgress(activeUserId, lessonId, nextState)
      setCompleted(nextState)
      setCompletedAt(nextState ? new Date().toISOString() : null)

      // Recount completions
      const lessonsList = await getLessons(courseId)
      let count = 0
      for (const les of lessonsList) {
        const done = les.id === lessonId ? nextState : await getProgress(activeUserId, les.id)
        if (done) count++
      }
      setCompletedLessonsCount(count)

      const allDone = lessonsList.length > 0 && count === lessonsList.length
      await saveCourseCompletion(activeUserId, courseId, allDone)

      if (nextState) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    } catch {
      alert('Error updating progress. Please try again.')
    }
  }

  const handleLanguageChange = (newLang: string) => {
    setCodeMap(prev => ({ ...prev, [language]: code }))
    setLanguage(newLang)
    setCode(codeMap[newLang] || challenge?.default_code?.[newLang] || '')
  }

  const handleResetCode = () => {
    if (confirm('Are you sure you want to reset your editor code to the boilerplate template?')) {
      const originalStub = challenge?.default_code?.[language] || ''
      setCode(originalStub)
      setCodeMap(prev => ({ ...prev, [language]: originalStub }))
    }
  }

  const handleRunCode = async () => {
    if (!challenge) {
      if (language === 'javascript') {
        setIsRunning(true)
        setConsoleOutput(null)
        setTimeout(() => {
          const res = runClientJs(code)
          setConsoleOutput({
            status: res.success ? 'accepted' : 'compile_error',
            passedCases: res.success ? 1 : 0,
            totalCases: 1,
            runtimeMs: 5,
            compileError: res.compileError || null,
            logs: res.logs
          })
          setIsRunning(false)
        }, 200)
      } else {
        setConsoleOutput({
          status: 'runtime_error',
          passedCases: 0,
          totalCases: 0,
          runtimeMs: 0,
          compileError: 'Python sandbox execution requires a coding challenge lesson. Switch language to Javascript to run generic playground code locally in the browser!',
          logs: []
        })
      }
      return
    }

    setIsRunning(true)
    setConsoleOutput(null)

    try {
      const response = await fetch('/api/coding/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          language,
          code
        })
      })

      const data = await response.json()
      setConsoleOutput(data)
    } catch (err: any) {
      setConsoleOutput({
        success: false,
        compileError: err.message || 'Failed to execute run suite'
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    if (!challenge || !activeUserId) return
    setIsSubmitting(true)
    setConsoleOutput(null)

    try {
      const response = await fetch('/api/coding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          language,
          code,
          userId: activeUserId
        })
      })

      const data = await response.json()
      setConsoleOutput(data)
      if (data.status === 'accepted') {
        // Automatically mark the lesson as completed!
        if (!completed) {
          await handleToggleComplete()
        }
      }
    } catch (err: any) {
      setConsoleOutput({
        success: false,
        status: 'failed',
        compileError: err.message || 'Failed to submit code suite'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectAnswer = (qIdx: number, oIdx: number) => {
    if (submittedQuiz) return
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }))
  }

  const handleSubmitQuiz = () => {
    if (!quiz) return
    if (Object.keys(selectedAnswers).length < quiz.questions.length) {
      alert('Please answer all questions before submitting.')
      return
    }
    const correct = Object.keys(selectedAnswers).filter(
      k => selectedAnswers[Number(k)] === (quiz.questions[Number(k)].correct_answer_index ?? quiz.questions[Number(k)].correct_index)
    ).length
    setQuizScore(correct)
    setSubmittedQuiz(true)
  }

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const userMsg = aiInput.trim()
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }])
    setAiLoading(true)

    try {
      const lessonContext = currentLesson
        ? `Context: The student is learning "${currentLesson.title}" in the course "${course?.title || ''}". Lesson duration: ${currentLesson.duration_minutes || 15} minutes.`
        : ''

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || 'student'
        },
        body: JSON.stringify({
          type: 'notes',
          prompt: `${lessonContext}\n\nStudent question: ${userMsg}\n\nProvide a helpful, concise answer focused on the lesson content. Use markdown formatting where appropriate.`
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          setAiMessages(prev => [...prev, { role: 'assistant', content: data.text, timestamp: new Date() }])
          return
        }
      }

      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm here to help! Based on the lesson "${currentLesson?.title}", here's what I can tell you:\n\nThis is a concept covered in the lesson material. I recommend reviewing the lesson content carefully and applying the examples shown. If you have a specific question about the code or concepts, feel free to ask!`,
        timestamp: new Date()
      }])
    } catch {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I had trouble connecting. Please check your internet connection and try again.',
        timestamp: new Date()
      }])
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendAiMessage(e as any)
    }
  }

  const handleAddNote = () => {
    if (!noteInput.trim()) return
    const newNote: Note = {
      id: `n-${Date.now()}`,
      text: noteInput.trim(),
      createdAt: new Date(),
      lessonId
    }
    const updated = [newNote, ...notes]
    setNotes(updated)
    setNoteInput('')
    if (activeUserId) {
      const noteKey = `notes_${activeUserId}_${lessonId}`
      localStorage.setItem(noteKey, JSON.stringify(updated))
    }
  }

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    if (activeUserId) {
      const noteKey = `notes_${activeUserId}_${lessonId}`
      localStorage.setItem(noteKey, JSON.stringify(updated))
    }
  }

  const handleExportNotes = () => {
    if (!notes.length) return
    const text = notes.map(n => `[${new Date(n.createdAt).toLocaleString()}]\n${n.text}`).join('\n\n---\n\n')
    const header = `LESSON NOTES\nLesson: ${currentLesson?.title || ''}\nCourse: ${course?.title || ''}\nExported: ${new Date().toLocaleString()}\n\n${'='.repeat(50)}\n\n`
    const blob = new Blob([header + text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-${currentLesson?.title?.replace(/\s+/g, '-').toLowerCase() || 'lesson'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyNotes = () => {
    if (!notes.length) return
    const text = notes.map(n => n.text).join('\n\n')
    navigator.clipboard.writeText(text)
    setNoteCopied(true)
    setTimeout(() => setNoteCopied(false), 2000)
  }

  const handlePostComment = async () => {
    if (!commentInput.trim() || commentLoading) return
    setCommentLoading(true)
    try {
      const res = await fetch('/api/ai/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: lessonId, userName, commentText: commentInput.trim() })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setCommentInput('')
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleLikeComment = (commentId: string) => {
    const isLiked = likedComments.has(commentId)
    const updated = new Set(likedComments)
    if (isLiked) {
      updated.delete(commentId)
    } else {
      updated.add(commentId)
    }
    setLikedComments(updated)
    const likedKey = `liked_comments_${lessonId}`
    localStorage.setItem(likedKey, JSON.stringify([...updated]))
  }

  // ─── Additional Learning Redesign Methods ────────────────────────────────────

  const runClientJs = (jsCode: string) => {
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: any[]) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
    }
    try {
      const result = new Function(jsCode)()
      console.log = originalLog
      return {
        success: true,
        logs,
        result: result !== undefined ? String(result) : 'undefined'
      }
    } catch (err: any) {
      console.log = originalLog
      return {
        success: false,
        compileError: err.message,
        logs
      }
    }
  }

  const handleAskAiExplanation = async (qIdx: number, questionText: string, options: string[], correctIdx: number, selectedIdx: number) => {
    setAiExplanationLoading(prev => ({ ...prev, [qIdx]: true }))
    try {
      const prompt = `Explain why the option "${options[correctIdx]}" is the correct answer to the question: "${questionText}".
The options were:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

The student chose: "${options[selectedIdx]}".
Provide a helpful, concise explanation of 2-3 sentences explaining the concepts in a friendly tone.`

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || 'student'
        },
        body: JSON.stringify({
          type: 'notes',
          prompt
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.text) {
          setAiQuestionExplanation(prev => ({ ...prev, [qIdx]: data.text }))
          return
        }
      }
      setAiQuestionExplanation(prev => ({ ...prev, [qIdx]: 'Sorry, I was unable to generate an explanation at this time. Please try again later.' }))
    } catch (err) {
      setAiQuestionExplanation(prev => ({ ...prev, [qIdx]: 'Connection error. Please try again later.' }))
    } finally {
      setAiExplanationLoading(prev => ({ ...prev, [qIdx]: false }))
    }
  }

  const loadQuizAttempts = async (userId: string, quizId: string) => {
    try {
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_id', quizId)
        .order('attempt_num', { ascending: true })
      if (!error && attempts) {
        setQuizAttempts(attempts)
      }
    } catch (err) {
      console.error('Failed to load quiz attempts:', err)
    }
  }

  const handleSubmitGradedQuiz = async (gradedQuiz: any) => {
    if (!gradedQuiz || !activeUserId) return
    if (Object.keys(selectedAnswers).length < gradedQuiz.quiz_questions.length) {
      alert('Please answer all questions before submitting.')
      return
    }

    const correct = Object.keys(selectedAnswers).filter(
      k => selectedAnswers[Number(k)] === (gradedQuiz.quiz_questions[Number(k)].correct_answer_index ?? gradedQuiz.quiz_questions[Number(k)].correct_index)
    ).length
    const scorePercent = Math.round((correct / gradedQuiz.quiz_questions.length) * 100)
    const isPassed = scorePercent >= (gradedQuiz.passing_score_percent || 70)

    const attemptNum = quizAttempts.length + 1

    try {
      setIsSubmittingQuiz(true)
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: activeUserId,
          quiz_id: gradedQuiz.id,
          score_percent: scorePercent,
          passed: isPassed,
          attempt_num: attemptNum
        })

      if (error) throw error

      await loadQuizAttempts(activeUserId, gradedQuiz.id)
      setGradedQuizSubmitted(true)
      setGradedQuizScore(correct)

      if (isPassed && !completed) {
        await handleToggleComplete()
      }
    } catch (err: any) {
      alert('Failed to submit quiz attempt: ' + err.message)
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  // ─── Loading State ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 min-h-[400px] select-none">
        <div className="w-10 h-10 rounded-full border-2 border-red-500/20 border-t-red-600 animate-spin mb-4" />
        <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Loading Workspace...</span>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────────────────────

  if (errorMsg || !currentLesson) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 text-center select-none">
        <div className="bg-white max-w-md p-8 rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Lesson Unavailable</h3>
          <p className="text-slate-500 text-sm mb-6">{errorMsg || 'The requested lesson is not available.'}</p>
          <Link href={`/courses/${courseId}`} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition inline-block">
            ← Back to Course
          </Link>
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  // Derived quiz variables
  const practiceQuiz = allLessonQuizzes.find((q: any) => !q.is_graded && !q.is_final) || null
  const gradedQuiz = allLessonQuizzes.find((q: any) => q.is_graded) || null

  const isSidebarVisible = sidebarOpen && activePanel !== null

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden select-none">
      
      {/* ── Top Premium Header ────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0 z-20 shadow-sm">
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* Left Sidebar Toggle Button */}
            <button
              onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-red-650 hover:bg-slate-50 transition cursor-pointer"
              title="Toggle Syllabus Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back to course link */}
            <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-widest flex-shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{course?.title || 'Back to course'}</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <span className="text-slate-300 text-sm">/</span>
            <span className="text-xs font-bold text-slate-850 truncate max-w-[200px] sm:max-w-xs">{currentLesson.title}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak & XP status indicators */}
            <div className="hidden md:flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-1.5 text-xs text-slate-650 font-bold">
              <div className="flex items-center gap-1.5 text-amber-600">
                <span className="text-sm">🔥</span>
                <span>3 day streak</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-indigo-650">
                <Award className="w-3.5 h-3.5" />
                <span>{(completedLessonsCount * 100) + (quizAttempts.filter(a => a.passed).length * 150)} XP</span>
              </div>
            </div>

            {/* Right Sidebar toggle controllers */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-0.5">
              {[
                { id: 'ai', icon: Sparkles, tooltip: 'AI Coach' },
                { id: 'notes', icon: FileText, tooltip: 'Notes' },
                { id: 'discussion', icon: MessageSquare, tooltip: 'Discussion' },
                { id: 'resources', icon: BookMarked, tooltip: 'Resources' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActivePanel(tab.id as any)
                    setSidebarOpen(true)
                  }}
                  className={`p-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activePanel === tab.id && isSidebarVisible 
                      ? 'bg-white shadow-sm text-red-650' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                  }`}
                  title={tab.tooltip}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="p-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-800 transition cursor-pointer"
                title="Toggle Right Panel"
              >
                {isSidebarVisible ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>

        </div>

        {/* Course Pacing Progress Bar */}
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-indigo-500 transition-all duration-700"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </header>

      {/* ── Main Layout Workspace ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ── COLUMN 1: Collapsible Syllabus Left Navigation Sidebar ──────────── */}
        {leftSidebarOpen && (
          <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden transition-all duration-300">
            {/* Header progress tracker */}
            <div className="p-4 border-b border-slate-150 bg-slate-50/50">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-550 mb-2">Course syllabus</h3>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>{overallProgress}% complete</span>
                <span>{completedLessonsCount} / {lessons.length} Modules</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-indigo-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            {/* Modules / Lessons tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {lessons.map((les, idx) => {
                const isCurrent = les.id === lessonId
                const isCompleted = completedLessonsCount > idx || (isCurrent && completed)
                const isLocked = idx > 0 && !isCompleted && !isCurrent && subscriptionPlan === 'free' && !les.free_preview

                return (
                  <div key={les.id} className="space-y-1">
                    <Link
                      href={isLocked ? '#' : `/courses/${courseId}/lessons/${les.id}`}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition select-none ${
                        isCurrent
                          ? 'bg-red-50/60 border-red-200 text-red-800 shadow-sm'
                          : isCompleted
                            ? 'bg-emerald-50/20 border-emerald-100 text-slate-705 hover:bg-slate-50'
                            : isLocked
                              ? 'bg-slate-50 border-slate-150 text-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-white border-slate-205 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {/* Left status badge icon */}
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border text-[9px] font-black flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : isCurrent 
                            ? 'bg-red-600 border-red-700 text-white' 
                            : 'bg-slate-100 border-slate-250 text-slate-450'
                      }`}>
                        {isCompleted ? <Check className="w-3 h-3 stroke-[3px]" /> : isLocked ? <Lock className="w-2.5 h-2.5" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Module {idx + 1}</p>
                        <h4 className="text-xs font-extrabold truncate leading-snug mt-0.5">{les.title}</h4>
                      </div>
                    </Link>

                    {/* Expand active lesson sub-steps pacing */}
                    {isCurrent && (
                      <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-red-200 ml-5">
                        <button
                          onClick={() => setActiveTab('learn')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-left transition cursor-pointer bg-transparent border-none ${
                            activeTab === 'learn' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Learn & Play
                        </button>
                        <button
                          onClick={() => setActiveTab('sandbox')}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-left transition cursor-pointer bg-transparent border-none ${
                            activeTab === 'sandbox' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" /> Sandbox IDE
                        </button>
                        {practiceQuiz && (
                          <button
                            onClick={() => setActiveTab('practice')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-left transition cursor-pointer bg-transparent border-none ${
                              activeTab === 'practice' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Practice Quiz
                          </button>
                        )}
                        {gradedQuiz && (
                          <button
                            onClick={() => setActiveTab('graded')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-left transition cursor-pointer bg-transparent border-none ${
                              activeTab === 'graded' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-500 hover:bg-slate-550'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5" /> Graded Exam
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Left sidebar footer graduation banner */}
            <div className="p-4 border-t border-slate-200">
              {overallProgress === 100 ? (
                <div className="p-3 bg-emerald-50/50 border border-emerald-250 rounded-2xl text-center shadow-sm">
                  <GraduationCap className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                  <h4 className="text-xs font-black text-slate-800">You are ready to graduate!</h4>
                  <p className="text-[9px] text-slate-505 mt-1 mb-2.5">Complete your capstone project and exam to claim certification.</p>
                  <Link href={`/courses/${courseId}/final`} className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition text-center shadow-sm">
                    Graduation Portal →
                  </Link>
                </div>
              ) : (
                <Link href={`/courses/${courseId}/final`} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-650 font-bold transition text-xs select-none">
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-indigo-600" /> Graduation Portal</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}
            </div>
          </aside>
        )}

        {/* ── COLUMN 2: Center Interactive Workspace Tabs Content ──────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          
          {/* Workspace tab selectors */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-shrink-0 shadow-sm select-none">
            {[
              { id: 'learn', label: 'Learn & Play', icon: BookOpen },
              { id: 'sandbox', label: 'Interactive Sandbox', icon: Terminal },
              { id: 'practice', label: 'Practice Quiz', icon: HelpCircle, exists: !!practiceQuiz },
              { id: 'graded', label: 'Graded Exam', icon: Award, exists: !!gradedQuiz }
            ].map(tab => {
              if (tab.exists === false) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer bg-transparent border-none ${
                    activeTab === tab.id
                      ? 'bg-red-50 text-red-750 font-bold border border-red-200/50'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* ── LEARN TAB PANEL ── */}
              {activeTab === 'learn' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fadeIn">
                  
                  {/* Title & Metadata */}
                  <div>
                    <span className="text-[10px] font-black text-red-650 uppercase tracking-widest">
                      Module {currentIndex + 1} content
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight mt-1.5 mb-4">
                      {currentLesson.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-550">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {currentLesson.duration_minutes || 15} min read</span>
                      {completed && (
                        <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Video Player */}
                  {currentLesson.video_url && currentLesson.video_url !== '' && !currentLesson.video_url.startsWith('local-') && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video w-full bg-slate-900 shadow-sm">
                      {currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${currentLesson.video_url.split('v=')[1]?.split('&')[0] || currentLesson.video_url.split('/').pop()}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={currentLesson.title}
                        />
                      ) : currentLesson.video_url.includes('vimeo.com') ? (
                        <iframe
                          src={`https://player.vimeo.com/video/${currentLesson.video_url.split('/').pop()}`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          title={currentLesson.title}
                        />
                      ) : (
                        <video
                          src={currentLesson.video_url}
                          controls
                          className="w-full h-full object-cover"
                          poster={course?.thumbnail_url || ''}
                          title={currentLesson.title}
                        />
                      )}
                    </div>
                  )}

                  {/* Reading Markdown Content */}
                  <article className="border-t border-slate-100 pt-6 prose prose-slate max-w-none text-slate-750">
                    {renderContent(currentLesson.content)}
                  </article>

                  {/* Complete Button Footer bar */}
                  <div className="border-t border-slate-150 pt-6 flex flex-wrap items-center justify-between gap-4">
                    <button
                      onClick={handleToggleComplete}
                      className={`flex items-center gap-2 font-bold px-6 py-3.5 rounded-2xl transition text-xs cursor-pointer border ${
                        completed
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-707 hover:bg-emerald-100'
                          : 'bg-red-600 border-transparent text-white hover:bg-red-700 shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {completed ? '✓ Module Completed' : 'Mark as Complete'}
                    </button>

                    <div className="flex gap-2">
                      {prevLesson && (
                        <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-xs text-slate-700 transition">
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </Link>
                      )}
                      {/* Smart Next: cycle through tabs before going to next lesson */}
                      {(() => {
                        const tabOrder: Array<'learn' | 'sandbox' | 'practice' | 'graded'> = ['learn', 'sandbox', ...(practiceQuiz ? ['practice' as const] : []), ...(gradedQuiz ? ['graded' as const] : [])];
                        const currentTabIdx = tabOrder.indexOf('learn');
                        const nextTab = tabOrder[currentTabIdx + 1] || null;
                        if (nextTab) {
                          return (
                            <button
                              onClick={() => setActiveTab(nextTab)}
                              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer border-none"
                            >
                              Next: {nextTab === 'sandbox' ? 'Sandbox' : nextTab === 'practice' ? 'Practice Quiz' : 'Graded Exam'} <ChevronRight className="w-4 h-4" />
                            </button>
                          );
                        } else if (nextLesson) {
                          return (
                            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                              Next Module <ChevronRight className="w-4 h-4" />
                            </Link>
                          );
                        } else {
                          return (
                            <Link href={`/courses/${courseId}/final`} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                              Final Portal <GraduationCap className="w-4 h-4" />
                            </Link>
                          );
                        }
                      })()}
                    </div>
                  </div>

                </div>
              )}

              {/* ── SANDBOX TAB PANEL ── */}
              {activeTab === 'sandbox' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  {/* Info card description */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-start gap-3 shadow-xs">
                    <Info className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Interactive Editor Playground</h4>
                      <p className="text-[11px] text-slate-550 mt-0.5">
                        {challenge 
                          ? `Write code for "${challenge.title}". Test cases compile in local environment sandbox.` 
                          : 'Write sandbox code locally in Javascript. Output displays on standard console execution log.'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    {/* Monaco Editor Section */}
                    <div className="lg:col-span-8 flex flex-col h-[500px]">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border border-b-0 border-slate-200 rounded-t-xl text-[10px] uppercase font-bold tracking-wider text-slate-655">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          <span className="font-mono text-slate-700 ml-1">IDE Workspace</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-705 focus:outline-none cursor-pointer text-[10px]"
                          >
                            <option value="javascript">JavaScript</option>
                            {challenge && challenge.default_code?.python && <option value="python">Python</option>}
                          </select>
                          <button
                            onClick={handleResetCode}
                            title="Reset Code Template"
                            className="p-1 rounded bg-white hover:bg-slate-50 text-slate-500 border border-slate-300 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-h-0 relative border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
                        <CodeEditor
                          value={code}
                          language={language}
                          theme="light"
                          onChange={(val) => setCode(val || '')}
                        />
                      </div>
                    </div>

                    {/* Console & Submissions Output section */}
                    <div className="lg:col-span-4 flex flex-col h-[500px] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-650 flex-shrink-0 animate-fadeIn">
                        Execution Outputs
                      </div>

                      <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-800 bg-slate-50/50 min-h-0 select-text">
                        {isRunning && (
                          <div className="flex items-center gap-2 text-indigo-650 animate-pulse font-bold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Compiling execution payload...</span>
                          </div>
                        )}
                        {isSubmitting && (
                          <div className="flex items-center gap-2 text-red-650 animate-pulse font-bold">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Running submission tests...</span>
                          </div>
                        )}

                        {!isRunning && !isSubmitting && !consoleOutput && (
                          <div className="text-slate-450 flex flex-col items-center justify-center py-20 text-center select-none">
                            <Cpu className="w-7 h-7 text-slate-350 stroke-1 mb-2 animate-pulse" />
                            <p className="font-bold text-[10px]">Your runtime compilation results appear here.</p>
                          </div>
                        )}

                        {!isRunning && !isSubmitting && consoleOutput && (
                          <div className="space-y-3.5">
                            
                            {/* Summary banner status */}
                            {consoleOutput.status && (
                              <div className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                                consoleOutput.status === 'accepted' 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                  : 'bg-red-50 border-red-200 text-red-800'
                              }`}>
                                <span className="uppercase text-[9px] tracking-wide">
                                  Status: {consoleOutput.status.replace('_', ' ')}
                                </span>
                                <span className="text-[9px]">
                                  {consoleOutput.passedCases || 0}/{consoleOutput.totalCases || 1} passed
                                </span>
                              </div>
                            )}

                            {/* Compile/Run Errors block */}
                            {consoleOutput.compileError && (
                              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-750 text-[10px]">
                                <span className="font-black block uppercase mb-1">Execution Error:</span>
                                <pre className="whitespace-pre-wrap font-mono leading-relaxed">{consoleOutput.compileError}</pre>
                              </div>
                            )}

                            {/* Custom Console Log list */}
                            {consoleOutput.logs && consoleOutput.logs.length > 0 && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700">
                                <span className="font-black text-[9px] uppercase text-slate-400 block mb-1">Console logs:</span>
                                <pre className="whitespace-pre-wrap font-mono leading-normal text-[10px]">{consoleOutput.logs.join('\n')}</pre>
                              </div>
                            )}

                            {/* Case executions details */}
                            {consoleOutput.results && consoleOutput.results.length > 0 && (
                              <div className="space-y-1 animate-fadeIn">
                                {consoleOutput.results.map((res: any, rIdx: number) => (
                                  <div key={rIdx} className={`p-2 rounded-lg border text-[9px] flex items-center justify-between ${
                                    res.error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-100/60 border-slate-200 text-slate-750'
                                  }`}>
                                    <span className="font-bold">Case #{rIdx + 1}</span>
                                    <span>{res.error ? 'Error' : `Pass (${res.duration || 1}ms)`}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </div>

                      {/* Playground Execution buttons */}
                      <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2.5 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRunCode}
                            disabled={isRunning || isSubmitting}
                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 disabled:bg-slate-50 text-slate-700 disabled:text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Run Tests
                          </button>
                          {challenge && (
                            <button
                              onClick={handleSubmitCode}
                              disabled={isRunning || isSubmitting}
                              className="px-4 py-2 bg-red-650 hover:bg-red-700 disabled:bg-slate-205 text-white disabled:text-slate-450 rounded-xl font-bold text-[10px] uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                            >
                              Submit Code
                            </button>
                          )}
                        </div>
                        {/* Next tab / next lesson button */}
                        {(() => {
                          const tabOrder: Array<'learn' | 'sandbox' | 'practice' | 'graded'> = ['learn', 'sandbox', ...(practiceQuiz ? ['practice' as const] : []), ...(gradedQuiz ? ['graded' as const] : [])];
                          const nextTab = tabOrder[tabOrder.indexOf('sandbox') + 1] || null;
                          if (nextTab) return (
                            <button onClick={() => setActiveTab(nextTab)} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer border-none">
                              Next: {nextTab === 'practice' ? 'Practice Quiz' : 'Graded Exam'} <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          );
                          if (nextLesson) return (
                            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center gap-1.5">
                              Next Module <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          );
                          return (
                            <Link href={`/courses/${courseId}/final`} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center gap-1.5">
                              Final Portal <GraduationCap className="w-3.5 h-3.5" />
                            </Link>
                          );
                        })()}
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* ── PRACTICE QUIZ TAB PANEL ── */}
              {activeTab === 'practice' && practiceQuiz && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden animate-fadeIn space-y-6">
                  
                  {/* Practice quiz title & headers */}
                  <div className="border-b border-slate-150 pb-4">
                    <span className="text-[10px] font-black text-red-655 uppercase tracking-widest">
                      Practice Assessment
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
                      <HelpCircle className="w-5.5 h-5.5 text-indigo-500" /> {practiceQuiz.title}
                    </h2>
                    <p className="text-[11px] text-slate-505 mt-1">Practice assessment supports unlimited attempts, immediate answer checks, and explanations.</p>
                  </div>

                  <div className="space-y-6">
                    {practiceQuiz.quiz_questions?.map((q: any, qIdx: number) => {
                      const correctIdx = q.correct_answer_index ?? q.correct_index
                      const selectedIdx = selectedAnswers[qIdx]
                      const isSelected = selectedIdx !== undefined
                      const isCorrect = selectedIdx === correctIdx

                      return (
                        <div key={qIdx} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                          <h3 className="font-extrabold text-slate-800 mb-3 text-sm">
                            <span className="text-red-600 mr-1.5">{qIdx + 1}.</span>
                            {q.question}
                          </h3>
                          
                          <div className="space-y-2">
                            {q.options.map((opt: string, oIdx: number) => {
                              let optionStyle = 'border-slate-200 text-slate-650 hover:bg-slate-50/50 hover:border-slate-350 bg-white'
                              if (selectedIdx === oIdx) {
                                optionStyle = isCorrect
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                                  : 'border-red-400 bg-red-50 text-red-750 font-bold'
                              } else if (isSelected && oIdx === correctIdx) {
                                optionStyle = 'border-emerald-300 bg-emerald-50/30 text-emerald-700'
                              }

                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleSelectAnswer(qIdx, oIdx)}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${optionStyle}`}
                                >
                                  <span>{opt}</span>
                                  {selectedIdx === oIdx && isCorrect && <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">Correct</span>}
                                  {selectedIdx === oIdx && !isCorrect && <span className="text-[8px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">Incorrect</span>}
                                </button>
                              )
                            })}
                          </div>

                          {/* Explanations shown immediately on selection */}
                          {isSelected && (
                            <div className="mt-3.5 space-y-2">
                              {q.explanation && (
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-650 leading-relaxed select-text">
                                  <span className="font-black text-slate-850 uppercase text-[9px] block mb-1">Concept explanation:</span>
                                  {q.explanation}
                                </div>
                              )}

                              {/* AI Explanation tool */}
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleAskAiExplanation(qIdx, q.question, q.options, correctIdx, selectedIdx)}
                                  disabled={aiExplanationLoading[qIdx]}
                                  className="w-fit flex items-center gap-1.5 text-[9px] font-black text-indigo-650 hover:text-indigo-850 uppercase tracking-widest cursor-pointer bg-transparent border-none mt-1"
                                >
                                  {aiExplanationLoading[qIdx] ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching AI Coach Explanation...</>
                                  ) : (
                                    <><Sparkles className="w-3.5 h-3.5" /> Explain with AI Coach</>
                                  )}
                                </button>

                                {aiQuestionExplanation[qIdx] && (
                                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-150 text-[11px] text-indigo-900 leading-relaxed shadow-sm select-text">
                                    <span className="font-black text-[9px] uppercase tracking-wider text-indigo-700 flex items-center gap-1 mb-1">
                                      <Sparkles className="w-3 h-3" /> AI Mentor explanation
                                    </span>
                                    {aiQuestionExplanation[qIdx]}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-5 flex justify-between gap-3 select-none">
                    <button
                      onClick={() => { setSelectedAnswers({}); setAiQuestionExplanation({}) }}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retake Practice
                    </button>
                    {/* Next tab / next lesson */}
                    {(() => {
                      const tabOrder: Array<'learn' | 'sandbox' | 'practice' | 'graded'> = ['learn', 'sandbox', ...(practiceQuiz ? ['practice' as const] : []), ...(gradedQuiz ? ['graded' as const] : [])];
                      const nextTab = tabOrder[tabOrder.indexOf('practice') + 1] || null;
                      if (nextTab) return (
                        <button onClick={() => setActiveTab(nextTab)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition cursor-pointer border-none">
                          Next: Graded Exam <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                      if (nextLesson) return (
                        <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                          Next Module <ChevronRight className="w-4 h-4" />
                        </Link>
                      );
                      return (
                        <Link href={`/courses/${courseId}/final`} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                          Final Portal <GraduationCap className="w-4 h-4" />
                        </Link>
                      );
                    })()}
                  </div>

                </div>
              )}

              {/* ── GRADED EXAM TAB PANEL ── */}
              {activeTab === 'graded' && gradedQuiz && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden animate-fadeIn space-y-8">
                  
                  {/* Graded exam title headers */}
                  <div className="border-b border-slate-150 pb-4">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Graded Assessment
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1.5 flex items-center gap-2">
                      <Award className="w-5.5 h-5.5 text-red-500 animate-bounce" /> {gradedQuiz.title}
                    </h2>
                    <p className="text-[11px] text-slate-505 mt-1">
                      Requirements: Minimum {gradedQuiz.passing_score_percent || 80}% score to pass. 
                      Max attempts limit: {gradedQuiz.max_attempts || 'Unlimited'}.
                    </p>
                  </div>

                  {/* Attempts stats dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-slate-700 text-xs font-bold select-none">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Attempt limit</span>
                      <span className="text-sm font-black text-slate-900">{gradedQuiz.max_attempts || 'Unlimited'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Attempts submitted</span>
                      <span className="text-sm font-black text-slate-900">{quizAttempts.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider mb-0.5">Passing Status</span>
                      <span className={`text-sm font-black ${
                        quizAttempts.some(a => a.passed) ? 'text-emerald-650' : 'text-slate-600'
                      }`}>
                        {quizAttempts.some(a => a.passed) ? 'Passed ✓' : 'Awaiting passing grade'}
                      </span>
                    </div>
                  </div>

                  {/* Exam submission logic states */}
                  {!gradedQuizSubmitted ? (
                    <>
                      {gradedQuiz.max_attempts && quizAttempts.length >= gradedQuiz.max_attempts ? (
                        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-3xl space-y-3">
                          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                          <h4 className="font-extrabold text-red-900 text-sm">Attempt Limit Reached</h4>
                          <p className="text-xs text-red-750 leading-relaxed max-w-md mx-auto">
                            You have consumed all {gradedQuiz.max_attempts} attempts for this graded assessment. 
                            If you require additional attempts, please contact your learning instructor.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {gradedQuiz.quiz_questions?.map((q: any, qIdx: number) => (
                            <div key={qIdx} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                              <h3 className="font-extrabold text-slate-800 mb-3 text-sm">
                                <span className="text-indigo-600 mr-1.5">{qIdx + 1}.</span>
                                {q.question}
                              </h3>
                              <div className="space-y-2">
                                {q.options.map((opt: string, oIdx: number) => {
                                  const isSelected = selectedAnswers[qIdx] === oIdx
                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectAnswer(qIdx, oIdx)}
                                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                                        isSelected 
                                          ? 'border-indigo-400 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs' 
                                          : 'border-slate-205 text-slate-650 hover:bg-slate-50 bg-white'
                                      }`}
                                    >
                                      <span>{opt}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}

                          <div className="pt-5 border-t border-slate-100 flex justify-end">
                            <button
                              onClick={() => handleSubmitGradedQuiz(gradedQuiz)}
                              disabled={isSubmittingQuiz}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold px-7 py-3.5 rounded-xl text-xs transition shadow-sm cursor-pointer border-none flex items-center gap-1.5 animate-fadeIn"
                            >
                              {isSubmittingQuiz && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Submit Graded Assessment
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Graded quiz results feedback screen
                    <div className="space-y-6 animate-fadeIn">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2 select-none animate-fadeIn">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Submission Outcome</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">
                          {gradedQuizScore} / {gradedQuiz.quiz_questions.length} Correct
                        </p>
                        <p className="text-sm font-bold text-slate-600">
                          Score achieved: {Math.round(((gradedQuizScore || 0) / gradedQuiz.quiz_questions.length) * 100)}%
                        </p>
                        {Math.round(((gradedQuizScore || 0) / gradedQuiz.quiz_questions.length) * 100) >= (gradedQuiz.passing_score_percent || 80) ? (
                          <span className="inline-block mt-2 text-xs font-black text-emerald-850 bg-emerald-100 border border-emerald-250 px-3.5 py-1.5 rounded-full uppercase tracking-wide">
                            Passed successfully! 🎉
                          </span>
                        ) : (
                          <span className="inline-block mt-2 text-xs font-black text-red-850 bg-red-100 border border-red-250 px-3.5 py-1.5 rounded-full uppercase tracking-wide">
                            Requires retake
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end select-none">
                        <button
                          onClick={() => { setSelectedAnswers({}); setGradedQuizSubmitted(false) }}
                          className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition cursor-pointer shadow-xs border-none"
                        >
                          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retake Assessment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Historical attempts list log table */}
                  {quizAttempts.length > 0 && (
                    <div className="border-t border-slate-150 pt-6 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 select-none">Attempts Logs ({quizAttempts.length})</h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 uppercase text-[9px] tracking-wider select-none font-black">
                              <th className="p-3">Attempt #</th>
                              <th className="p-3">Score %</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Submitted on</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quizAttempts.map((attempt, index) => (
                              <tr key={attempt.id || index} className="border-b border-slate-100 last:border-none text-slate-700">
                                <td className="p-3 font-bold">Attempt {attempt.attempt_num}</td>
                                <td className="p-3 font-extrabold">{attempt.score_percent}%</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                    attempt.passed 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                                      : 'bg-red-55/10 text-red-700 border border-red-150'
                                  }`}>
                                    {attempt.passed ? 'Pass' : 'Fail'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-400 select-none">{new Date(attempt.completed_at || Date.now()).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

        </main>

        {/* ── COLUMN 3: Right Student Learning & AI Companion Collapsible Panel ── */}
        {isSidebarVisible && (
          <aside className="w-96 flex-shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden transition-all duration-300">
            
            {/* Sidebar header tabs */}
            <div className="flex border-b border-slate-150 bg-slate-50 flex-shrink-0 select-none">
              {[
                { id: 'ai', icon: Sparkles, label: 'AI Coach' },
                { id: 'notes', icon: FileText, label: 'Notes' },
                { id: 'discussion', icon: MessageSquare, label: 'Discussion' },
                { id: 'resources', icon: BookMarked, label: 'Resources' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider border-b-2 transition cursor-pointer bg-transparent border-none ${
                    activePanel === tab.id
                      ? 'border-red-650 text-red-600 bg-white'
                      : 'border-transparent text-slate-400 hover:text-slate-700 hover:bg-white/70'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* AI Assistant Coach Tab */}
            {activePanel === 'ai' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-red-50/20 to-white flex-shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wide">AI Learning Coach</p>
                      <p className="text-[9px] text-slate-450">Ask clarification questions & generate quiz examples</p>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts cards */}
                <div className="p-3 flex gap-1.5 flex-wrap border-b border-slate-100 flex-shrink-0 select-none bg-slate-50/20">
                  {[
                    { label: 'Explain Concept', prompt: `Explain the core concept of "${currentLesson.title}" using real-world analogies.` },
                    { label: 'Give Code Samples', prompt: `Show me 2 practical code examples related to "${currentLesson.title}" in ${language}.` },
                    { label: 'Quick Quiz Me', prompt: `Quiz me with 2 multiple choice questions on "${currentLesson.title}" to test my grasp.` }
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => { setAiInput(q.prompt); aiInputRef.current?.focus() }}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg bg-white hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 hover:border-red-200 transition cursor-pointer shadow-xs"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* Chat Message Lists */}
                <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black ${
                        msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-gradient-to-br from-red-500 to-indigo-500 text-white'
                      }`}>
                        {msg.role === 'user' ? 'U' : <Sparkles className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed select-text ${
                          msg.role === 'user' 
                            ? 'bg-slate-800 text-white rounded-tr-sm shadow-xs' 
                            : 'bg-slate-100 border border-slate-200 text-slate-700 rounded-tl-sm shadow-xs'
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] text-slate-400 px-1 select-none font-bold">
                          {msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2.5 animate-fadeIn">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                      </div>
                      <div className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Input Form */}
                <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-100 flex-shrink-0 bg-white">
                  <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 focus-within:border-red-400 transition">
                    <textarea
                      ref={aiInputRef}
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={handleAiKeyDown}
                      placeholder="Ask the AI coach a question..."
                      className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none resize-none max-h-24 min-h-[36px] leading-relaxed"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={!aiInput.trim() || aiLoading}
                      className="w-8.5 h-8.5 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition disabled:opacity-40 flex-shrink-0 cursor-pointer border-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-400 mt-1.5 px-1 select-none">Enter to send · Shift+Enter for newline</p>
                </form>
              </div>
            )}

            {/* Student Local Notes Tab */}
            {activePanel === 'notes' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/30 select-none">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Saved Notes</h4>
                    <p className="text-[9px] text-slate-450">{notes.length} notes stored locally</p>
                  </div>
                  {notes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={handleCopyNotes} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer bg-transparent border-none" title="Copy Notes">
                        {noteCopied ? <Check className="w-3.5 h-3.5 text-emerald-655" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={handleExportNotes} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer bg-transparent border-none" title="Download Notes as Text file">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 border-b border-slate-100 bg-white flex-shrink-0 select-none">
                  <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Take notes about key points here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-red-400 resize-none min-h-[80px] transition"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteInput.trim()}
                    className="mt-2 w-full bg-red-650 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-40 cursor-pointer border-none flex items-center justify-center gap-1"
                  >
                    <BookMarked className="w-3.5 h-3.5" /> Save Note
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {notes.length === 0 ? (
                    <div className="text-center py-16 select-none">
                      <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-400 font-bold">No notes yet</p>
                      <p className="text-[9px] text-slate-350 mt-0.5">Key snippets & lessons summaries saved here.</p>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} className="bg-amber-50/40 border border-amber-200 rounded-xl p-3 relative group shadow-xs">
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap select-text">{note.text}</p>
                        <div className="flex items-center justify-between mt-2 select-none">
                          <span className="text-[8px] text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition cursor-pointer bg-transparent border-none"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Discussion Comments Tab */}
            {activePanel === 'discussion' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-100 flex-shrink-0 bg-slate-50/30 select-none">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Lesson Discussion</h4>
                  <p className="text-[9px] text-slate-455">{comments.length} student comments active</p>
                </div>

                <div className="p-3 border-b border-slate-100 bg-white flex-shrink-0 select-none">
                  <textarea
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    placeholder="Ask questions or share feedback..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-red-400 resize-none min-h-[60px] transition"
                    rows={2}
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentInput.trim() || commentLoading}
                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer border-none"
                  >
                    {commentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post Comment
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {commentsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-16 select-none">
                      <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-400 font-bold">No discussions yet</p>
                      <p className="text-[9px] text-slate-350 mt-0.5">Post the first question or query!</p>
                    </div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 font-bold">
                            {(c.userName || 'S')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 select-none">
                              <span className="text-[10px] font-black text-slate-700 truncate">{c.userName}</span>
                              <span className="text-[8px] text-slate-400">{timeAgo(c.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-650 leading-relaxed select-text">{c.commentText}</p>
                            <div className="flex items-center gap-2 mt-2 select-none">
                              <button
                                onClick={() => handleLikeComment(c.id)}
                                className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-red-600 transition cursor-pointer bg-transparent border-none"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{c.likes || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Learning Resources Tab */}
            {activePanel === 'resources' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3.5 border-b border-slate-100 flex-shrink-0 bg-slate-50/30 select-none">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Learning Resources</h4>
                  <p className="text-[9px] text-slate-455">Curated materials for this lesson</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {[
                    { icon: BookOpen, label: 'Official Docs', desc: 'Read the full documentation', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                    { icon: Video, label: 'Video Supplement', desc: 'Watch supplementary video', color: 'text-red-600 bg-red-50 border-red-200' },
                    { icon: Code2, label: 'Code Examples', desc: 'Explore sample code repos', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                    { icon: FileText, label: 'Cheat Sheet', desc: 'Quick reference guide', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  ].map(res => (
                    <div key={res.label} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:shadow-sm transition ${res.color}`}>
                      <res.icon className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{res.label}</p>
                        <p className="text-[9px] opacity-70">{res.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </aside>
        )}

      </div>

      {/* ── Completion Celebration ──────────────────────────────────────────── */}

      {showCelebration && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl px-8 py-6 text-center animate-bounce">
            <GraduationCap className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">Lesson Complete! 🎉</h3>
            <p className="text-xs text-slate-500 mt-1">{overallProgress}% of the course done</p>
          </div>
        </div>
      )}

      {/* Course Terms & Conditions Modal Overlay */}
      <PolicyModal
        isOpen={showCourseConsentModal}
        policyType="course"
        isUndismissible={true}
        showAcceptDecline={true}
        onAccept={handleAcceptCourseTerms}
        onDecline={handleDeclineCourseTerms}
      />
    </div>
  )
}
