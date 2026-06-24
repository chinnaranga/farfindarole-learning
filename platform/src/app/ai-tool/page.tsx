'use client'

import { useState, useEffect } from 'react'
import { supabase, getUserSubscription } from '@/lib/supabase'
import {
  Sparkles, FileText, HelpCircle, Save, Loader2, Copy, AlertCircle, Lock, Crown,
  BookOpen, Layers, Clipboard, Calendar, Download, History, Trash2, Check, X,
  Eye, Edit3, ChevronRight, Info, ExternalLink
} from 'lucide-react'

type GeneratorType = 'course' | 'quiz' | 'assignment' | 'lesson' | 'notes' | 'flashcards'
type ModelType = 'gemini' | 'openai' | 'claude' | 'openrouter'

interface SavedDocument {
  filename: string
  content: string
  updatedAt: string
  size: number
}

interface PromptHistoryItem {
  id: string
  title: string
  generatorType: GeneratorType
  promptText: string
  model: ModelType
  createdAt: string
}

// Preset prompt templates for each generator type to populate the form
const PROMPT_TEMPLATES: Record<GeneratorType, Array<{ label: string; topic: string; audience: string }>> = {
  course: [
    { label: "React & Next.js App Router", topic: "React 19, Next.js 15 App Router, Server Components", audience: "Web developers transitioning from page routers" },
    { label: "TypeScript Advanced Types", topic: "Generics, Utility Types, Conditional Types, and Type Narrowing", audience: "Intermediate JavaScript programmers" },
    { label: "SQL Database Design & Indexing", topic: "PostgreSQL schema modeling, normal forms, primary/foreign keys, B-tree indexes", audience: "Back-end engineers and database administrators" }
  ],
  quiz: [
    { label: "Docker Containers basics", topic: "Docker images, containers, volumes, networks, and Dockerfile optimization", audience: "DevOps beginners and system administrators" },
    { label: "Algorithms (Big O complexity)", topic: "Sorting, binary search, tree traversals, space/time complexity", audience: "Computer science students preparing for interviews" },
    { label: "CSS Layouts (Grid & Flexbox)", topic: "Grid-template-areas, flex-grow, alignment properties, responsive media queries", audience: "Junior front-end engineers" }
  ],
  assignment: [
    { label: "REST API with Express & Jest", topic: "Building Express routes, JSON validation, Jest unit tests, Supertest integration", audience: "Node.js developers learning automated testing" },
    { label: "Custom Hook & Context in React", topic: "Creating a custom useLocalStorage hook synced across context providers", audience: "Frontend developers learning state reuse" },
    { label: "OAuth 2.0 Authorization Flow", topic: "Registering app credentials, JWT signing, callback redirects, token verification", audience: "Security-focused application developers" }
  ],
  lesson: [
    { label: "CSS Flexbox Fundamentals", topic: "Flex containers, direction, wrap, alignment, justification, item properties", audience: "Introductory web design class" },
    { label: "Node.js Custom Middlewares", topic: "Understanding req, res, next, error handler middleware, body parsers", audience: "Beginner backend programming seminar" },
    { label: "Git Branches & Code Reviews", topic: "Feature branching, conflict resolution, rebase vs merge, pull request workflow", audience: "Engineering team onboarding cohort" }
  ],
  flashcards: [
    { label: "JS Asynchronous (Promises)", topic: "Promises lifecycle, async/await handlers, race conditions, promise.all", audience: "Frontend developers brushing up on ES6+" },
    { label: "Supabase Row-Level Security", topic: "Creating RLS policies, auth.uid() mappings, select/insert bindings", audience: "Full-stack builders using Supabase BaaS" },
    { label: "Next.js Middleware Edge", topic: "Edge runtime restrictions, redirect mappings, header modifications", audience: "Next.js architects optimizing page speeds" }
  ],
  notes: [
    { label: "React Virtual DOM Reconciliation", topic: "Virtual DOM diffing, fibers, keys prop importance, batching state updates", audience: "Frontend engineering specialists" },
    { label: "Web Security: XSS & CSRF", topic: "Cross-site scripting vectors, sanitization, CSRF tokens, SameSite cookies", audience: "Software engineers looking to secure client apps" },
    { label: "Database Indexing & Queries", topic: "Clustered vs non-clustered indexes, query planner execution analysis", audience: "Database design students" }
  ]
}

export default function AIToolPage() {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free')
  
  // Tab control: generator, saved, history
  const [activeTab, setActiveTab] = useState<'generator' | 'saved' | 'history'>('generator')
  
  // Selection/Input configuration
  const [generator, setGenerator] = useState<GeneratorType>('course')
  const [topic, setTopic] = useState('React Components & Architecture')
  const [audience, setAudience] = useState('Junior Developers and Computer Science graduates')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [model, setModel] = useState<ModelType>('gemini')
  
  // Output state
  const [generating, setGenerating] = useState(false)
  const [generatedText, setGeneratedText] = useState('')
  const [filename, setFilename] = useState('react-course-blueprint.md')
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' })
  
  // Lists
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([])
  const [historyList, setHistoryList] = useState<PromptHistoryItem[]>([])
  
  // Client-side LocalStorage Quota tracker state
  const [quotaUsed, setQuotaUsed] = useState(0)
  const [quotaLimit, setQuotaLimit] = useState(5)
  const [quotaPeriod, setQuotaPeriod] = useState<'day' | 'month'>('day')

  // Fetch user information and active subscriptions
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')
          setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Learner')
          setUserId(user.id)
          
          const sub = await getUserSubscription(user.id)
          const plan = sub.plan
          if (plan === 'advanced') {
            setSubscriptionTier('enterprise')
            setQuotaLimit(Infinity)
          } else if (plan === 'pro') {
            setSubscriptionTier('pro')
            setQuotaLimit(Infinity)
          } else if (plan === 'basic') {
            setSubscriptionTier('basic')
            setQuotaLimit(100)
            setQuotaPeriod('month')
          } else {
            setSubscriptionTier('free')
            setQuotaLimit(5)
            setQuotaPeriod('day')
          }
        }
      } catch (err) {
        console.error('Failed to load user in AI tool:', err)
      }
    }
    loadUser()
  }, [])

  // Auto-generate filename when topic or generator changes
  useEffect(() => {
    const cleanTopic = topic.toLowerCase().trim().replace(/[^\w]/g, '-') || 'untitled'
    setFilename(`${generator}-${cleanTopic}.md`)
  }, [generator, topic])

  // Load Prompt History and Saved Documents on mount or when tab changes
  useEffect(() => {
    if (!userEmail) return
    if (activeTab === 'saved') {
      loadSavedDocuments()
    } else if (activeTab === 'history') {
      loadPromptHistory()
    }
  }, [activeTab, userEmail])

  // Load local client-side quotas from localStorage on tier or user set
  useEffect(() => {
    if (!userEmail) return
    loadQuotas()
  }, [userEmail, subscriptionTier])

  const loadQuotas = () => {
    const quotaData = localStorage.getItem(`farfindarole_ai_quota_${userEmail}`)
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = today.substring(0, 7) // YYYY-MM

    if (quotaData) {
      const parsed = JSON.parse(quotaData)
      if (subscriptionTier === 'free') {
        if (parsed.date === today) {
          setQuotaUsed(parsed.dailyCount || 0)
        } else {
          setQuotaUsed(0)
        }
      } else if (subscriptionTier === 'basic') {
        if (parsed.month === currentMonth) {
          setQuotaUsed(parsed.monthlyCount || 0)
        } else {
          setQuotaUsed(0)
        }
      } else {
        setQuotaUsed(0)
      }
    } else {
      setQuotaUsed(0)
    }
  }

  const incrementQuota = () => {
    const today = new Date().toISOString().split('T')[0]
    const currentMonth = today.substring(0, 7)
    const quotaData = localStorage.getItem(`farfindarole_ai_quota_${userEmail}`)

    let dailyCount = 0
    let monthlyCount = 0
    let savedDate = today
    let savedMonth = currentMonth

    if (quotaData) {
      const parsed = JSON.parse(quotaData)
      dailyCount = parsed.date === today ? parsed.dailyCount : 0
      monthlyCount = parsed.month === currentMonth ? parsed.monthlyCount : 0
      savedDate = parsed.date
      savedMonth = parsed.month
    }

    dailyCount += 1
    monthlyCount += 1

    const updated = {
      date: today,
      month: currentMonth,
      dailyCount,
      monthlyCount
    }

    localStorage.setItem(`farfindarole_ai_quota_${userEmail}`, JSON.stringify(updated))
    setQuotaUsed(subscriptionTier === 'free' ? dailyCount : subscriptionTier === 'basic' ? monthlyCount : 0)
  }

  const loadSavedDocuments = async () => {
    try {
      const res = await fetch('/api/save-doc')
      const data = await res.json()
      if (data.success) {
        setSavedDocs(data.documents)
      }
    } catch (err) {
      console.error('Failed to load saved documents:', err)
    }
  }

  const loadPromptHistory = async () => {
    try {
      const res = await fetch(`/api/ai/history?userId=${encodeURIComponent(userEmail)}`, {
        headers: { 'x-user-id': userEmail }
      })
      const data = await res.json()
      if (data.success) {
        setHistoryList(data.history || [])
      }
    } catch (err) {
      console.error('Failed to load prompt history:', err)
    }
  }

  // Construct prompt based on choices
  const getPromptText = () => {
    const basePrompt = `You are a professional educational curriculum developer. Create clean, structured Markdown content in a clear academic tone.
Format the entire output as structured Markdown, utilizing bullet lists, bold highlights, and headers appropriately.`

    switch (generator) {
      case 'course':
        return `${basePrompt}
Generate a detailed Course Outline for:
- Title: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Include: Course Overview, 3 Key Learning Objectives (Bloom's Taxonomy), Course Prerequisites, 4 Modular Learning Units (with lessons, descriptions, and learning outcomes), and a Course Grading Outline.`

      case 'quiz':
        return `${basePrompt}
Generate a Quiz Assessment based on:
- Topic: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Include: 4 multiple-choice questions (each with 4 choices A, B, C, D), an Answer Key section at the bottom, and a short explanation text for why each correct option is correct.`

      case 'assignment':
        return `${basePrompt}
Create an Assignment Task brief for:
- Title: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Include: Assignment Summary, 4 clear functional requirements, submission guidelines, recommended technologies, and a grading rubric (scoring table mapping Exceeds, Meets, and Needs Improvement).`

      case 'lesson':
        return `${basePrompt}
Create a detailed Lesson Plan detailing:
- Lesson Topic: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Include: Lesson Objectives, 45-minute timing schedule breakdown (e.g. Introduction, Core content, Lab work, Wrap-up), key concepts terminology list, and two short follow-up questions.`

      case 'notes':
        return `${basePrompt}
Generate comprehensive Study Notes on:
- Subject: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Include: Core summary description, detailed bullet points of important structural mechanisms, a cheat sheet section with code syntax or practical analogies, and revision summaries.`

      case 'flashcards':
        return `${basePrompt}
Create a Flashcards stack (5 concept-definition pairs) on:
- Topic: ${topic}
- Target Audience: ${audience}
- Difficulty Level: ${difficulty}

Format: List out cards matching 'Card 1 Front: [Concept] / Card 1 Back: [Definition]' and include descriptive explanations.`
    }
  }

  // Check quota, compile prompt, invoke api
  const handleGenerate = async () => {
    // 1. Quota check
    if (subscriptionTier === 'free' && quotaUsed >= 5) {
      alert("Daily generation limit reached. Please upgrade to Pro or Enterprise for unlimited generations.")
      return
    }
    if (subscriptionTier === 'basic' && quotaUsed >= 100) {
      alert("Monthly generation limit reached. Please upgrade to Pro or Enterprise for unlimited generations.")
      return
    }

    setGenerating(true)
    setGeneratedText('')
    setSaveStatus({ type: 'idle', message: '' })

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail
        },
        body: JSON.stringify({
          type: generator,
          prompt: getPromptText(),
          model: model
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        // Stream text output by simulated chunking for visual polish
        const fullText = data.text || ''
        const textChunks = fullText.split('\n')
        let chunkIndex = 0
        
        const streamInterval = setInterval(() => {
          if (chunkIndex >= textChunks.length) {
            clearInterval(streamInterval)
            setGenerating(false)
            incrementQuota()
            // Proactively save this prompt details to prompt history database
            savePromptToHistory()
            return
          }
          setGeneratedText(prev => prev + textChunks[chunkIndex] + '\n')
          chunkIndex++
        }, 15)
      } else {
        setGenerating(false)
        const errMsg = data.error || 'Failed to complete generation. Please check API keys.'
        alert(`Generation Error: ${errMsg}`)
      }
    } catch (err: any) {
      setGenerating(false)
      console.error(err)
      alert(`API Request Error: ${err.message || 'Server connection failed.'}`)
    }
  }

  const savePromptToHistory = async () => {
    const historyItem = {
      id: `pr-${Math.random().toString(36).substring(2, 8)}`,
      title: `${generator.toUpperCase()} - ${topic}`,
      generatorType: generator,
      promptText: getPromptText(),
      model: model
    }

    try {
      await fetch('/api/ai/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail
        },
        body: JSON.stringify({ userId: userEmail, prompt: historyItem })
      })
    } catch (err) {
      console.error('Failed to log prompt history:', err)
    }
  }

  const handleSaveToWorkspace = async () => {
    if (!generatedText) return
    setSaveStatus({ type: 'idle', message: '' })

    try {
      const response = await fetch('/api/save-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: filename,
          content: generatedText
        })
      })

      const data = await response.json()
      if (response.ok) {
        setSaveStatus({
          type: 'success',
          message: `Saved! Generated file successfully written to docs/${filename}`
        })
      } else {
        setSaveStatus({
          type: 'error',
          message: data.error || 'Failed to save workspace file.'
        })
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Error occurred while saving file.'
      })
    }
  }

  const handleDownload = () => {
    if (!generatedText) return
    const blob = new Blob([generatedText], { type: 'text/markdown' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopy = () => {
    if (!generatedText) return
    navigator.clipboard.writeText(generatedText)
    alert("Copied to clipboard!")
  }

  // Load document back from Saved Documents tab into AI Generator tab
  const handleLoadSavedDoc = (doc: SavedDocument) => {
    setGeneratedText(doc.content)
    // Extract generator type from filename prefix if possible
    const prefix = doc.filename.split('-')[0] as GeneratorType
    if (['course', 'quiz', 'assignment', 'lesson', 'notes', 'flashcards'].includes(prefix)) {
      setGenerator(prefix)
    }
    // Set filename
    setFilename(doc.filename)
    setActiveTab('generator')
  }

  // Delete saved document file from file system via API
  const handleDeleteSavedDoc = async (filenameToDelete: string) => {
    if (!confirm(`Are you sure you want to delete ${filenameToDelete}?`)) return
    try {
      const res = await fetch(`/api/save-doc?filename=${encodeURIComponent(filenameToDelete)}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        loadSavedDocuments()
      } else {
        alert(data.error || 'Failed to delete file.')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Delete prompt history item
  const handleDeleteHistoryItem = async (id: string) => {
    try {
      const res = await fetch('/api/ai/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userEmail
        },
        body: JSON.stringify({ userId: userEmail, id })
      })
      const data = await res.json()
      if (data.success) {
        loadPromptHistory()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Apply Prompt template choices to form state
  const handleApplyTemplate = (topicVal: string, audienceVal: string) => {
    setTopic(topicVal)
    setAudience(audienceVal)
  }

  // Lightweight custom markdown compiler to HTML with Tailwind classes
  const renderMarkdown = (md: string) => {
    if (!md) return <div className="text-slate-400 italic text-sm">Output preview will appear here...</div>

    // Escape tags to prevent simple HTML injection
    let htmlContent = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    const lines = htmlContent.split('\n')
    const result: string[] = []
    let inList = false
    let inTable = false
    let tableRows: string[] = []
    let inCode = false
    let codeBlockContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCode) {
          inCode = false;
          result.push(`<pre class="my-4 p-4 rounded-xl bg-slate-50 text-slate-800 overflow-x-auto text-xs font-mono border border-slate-200"><code class="block whitespace-pre">${codeBlockContent.join('\n')}</code></pre>`)
          codeBlockContent = []
        } else {
          inCode = true
        }
        continue
      }

      if (inCode) {
        codeBlockContent.push(line)
        continue
      }

      // Handle Bullet Lists
      const listMatch = line.match(/^[\*\-]\s+(.*)$/)
      if (listMatch) {
        if (!inList) {
          inList = true
          result.push('<ul class="list-disc pl-5 my-3 space-y-1 text-slate-700">')
        }
        const itemContent = listMatch[1]
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono text-rose-600">$1</code>')
        result.push(`<li class="text-xs sm:text-sm leading-relaxed">${itemContent}</li>`)
        continue
      } else {
        if (inList) {
          inList = false
          result.push('</ul>')
        }
      }

      // Handle Tables
      if (line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true
          tableRows = []
        }
        tableRows.push(line)
        continue
      } else {
        if (inTable) {
          inTable = false
          result.push(renderTableHelper(tableRows))
          tableRows = []
        }
      }

      // Handle Headings
      if (line.startsWith('# ')) {
        const title = line.substring(2).replace(/\*\*(.*?)\*\*/g, '$1')
        result.push(`<h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-6 mb-3 tracking-tight">${title}</h1>`)
        continue
      }
      if (line.startsWith('## ')) {
        const title = line.substring(3).replace(/\*\*(.*?)\*\*/g, '$1')
        result.push(`<h2 class="text-lg font-bold text-slate-900 mt-5 mb-2.5 pb-1 border-b border-slate-150">${title}</h2>`)
        continue
      }
      if (line.startsWith('### ')) {
        const title = line.substring(4).replace(/\*\*(.*?)\*\*/g, '$1')
        result.push(`<h3 class="text-base font-semibold text-slate-900 mt-4 mb-2">${title}</h3>`)
        continue
      }

      // Handle standard text lines
      let parsedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono text-rose-600">$1</code>')

      if (parsedLine.trim() === '') continue

      result.push(`<p class="my-2 text-xs sm:text-sm leading-relaxed text-slate-650">${parsedLine}</p>`)
    }

    if (inList) result.push('</ul>')
    if (inTable) result.push(renderTableHelper(tableRows))

    return (
      <div 
        className="font-sans text-slate-800 space-y-2 prose max-w-none"
        dangerouslySetInnerHTML={{ __html: result.join('\n') }}
      />
    )
  }

  // Render Table utility for Markdown
  const renderTableHelper = (rows: string[]) => {
    if (rows.length === 0) return ""
    
    let html = '<div class="my-4 overflow-x-auto border border-slate-200 rounded-xl shadow-sm"><table class="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">'
    let headerParsed = false

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      if (cols.every(c => c.match(/^:\s*-+\s*:?$/) || c.match(/^-+$/))) continue

      if (!headerParsed) {
        headerParsed = true
        html += '<thead class="bg-slate-50"><tr>'
        cols.forEach(col => {
          html += `<th class="px-4 py-2.5 text-xs font-bold text-slate-700 tracking-wider border-b border-slate-200">${col}</th>`
        })
        html += '</tr></thead><tbody class="divide-y divide-slate-150 bg-white">'
      } else {
        html += '<tr class="hover:bg-slate-50/50">'
        cols.forEach(col => {
          const content = col.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
          html += `<td class="px-4 py-2.5 text-xs text-slate-600 font-sans">${content}</td>`
        })
        html += '</tr>'
      }
    }

    if (headerParsed) html += '</tbody>'
    html += '</table></div>'
    return html
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 flex flex-col relative select-none">
      
      {/* Page Header banner */}
      <section className="bg-white border-b border-slate-200 py-6 relative shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-rose-55 text-rose-600 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded uppercase leading-none">
                AI Content Studio
              </span>
              <span className="text-xs font-bold text-slate-400">
                Create Professional Learning Content
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              AI Content Creator
            </h1>
          </div>
          
          {/* Subscription Badge */}
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
            <Crown className={`w-3.5 h-3.5 ${subscriptionTier === 'enterprise' ? 'text-amber-500 fill-amber-500' : subscriptionTier === 'pro' ? 'text-violet-500' : 'text-slate-400'}`} />
            <span className="capitalize text-slate-600 font-medium">
              {subscriptionTier} Workspace
            </span>
          </div>
        </div>
      </section>

      {/* Tabs Sub-navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition select-none cursor-pointer flex items-center gap-2 ${
              activeTab === 'generator'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            AI Generator
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition select-none cursor-pointer flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Saved Documents
            {savedDocs.length > 0 && (
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {savedDocs.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold transition select-none cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-rose-500 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Prompt History
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: AI Content Generator Workspace */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            
            {/* Grid of generator cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { type: 'course', label: 'Course Outline', desc: 'Create curriculum outline structures', icon: BookOpen },
                { type: 'quiz', label: 'Quiz Creator', desc: 'Generate multi-choice test assessments', icon: HelpCircle },
                { type: 'assignment', label: 'Assignment Brief', desc: 'Formulate project briefs & rubrics', icon: Clipboard },
                { type: 'lesson', label: 'Lesson Planner', desc: 'Draft detailed teaching schedules', icon: Calendar },
                { type: 'flashcards', label: 'Flashcards', desc: 'Flashcard concept definition blocks', icon: Sparkles },
                { type: 'notes', label: 'Study Notes', desc: 'Create review summaries & cheatsheets', icon: FileText }
              ].map((item) => {
                const IconComponent = item.icon
                const isActive = generator === item.type
                return (
                  <button
                    key={item.type}
                    onClick={() => {
                      setGenerator(item.type as GeneratorType)
                      setTopic('') // Clear topic to let user select from fresh templates
                      setAudience('')
                    }}
                    className={`p-4 rounded-xl text-left border transition relative flex flex-col gap-2 select-none cursor-pointer group ${
                      isActive
                        ? 'border-rose-500 bg-rose-50/45 shadow-sm ring-1 ring-rose-500'
                        : 'border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs'
                    }`}
                  >
                    <div className={`p-2 rounded-lg w-fit ${
                      isActive 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">
                        {item.label}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                    {isActive && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Prompt Template Helpers */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                Quick Prompt Templates
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_TEMPLATES[generator].map((tpl, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplyTemplate(tpl.topic, tpl.audience)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-350 bg-slate-50 text-xs text-slate-700 font-medium hover:bg-slate-100/50 transition cursor-pointer select-none"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Config & Workspace Splitted Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Configuration Form */}
              <div className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    1. Configure settings
                  </span>
                  <span className="text-xs font-semibold capitalize text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    {generator} builder
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Topic / Subject Area
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Next.js App Router"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Intermediate Web Developers"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      AI Model
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800"
                    >
                      <option value="gemini">Gemini Pro</option>
                      <option value="openai">OpenAI GPT-4o</option>
                      <option value="claude">Claude 3.5 Sonnet</option>
                      <option value="openrouter">OpenRouter Hub</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !topic.trim()}
                  className="w-full mt-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xs transition active:scale-[0.98] cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Drafting Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Content
                    </>
                  )}
                </button>

                {/* Quota Indicators */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-550">
                    <span>Usage Quota Tracker</span>
                    <span>
                      {quotaLimit === Infinity 
                        ? 'Unlimited' 
                        : `${quotaUsed} / ${quotaLimit} runs (${quotaPeriod === 'day' ? 'daily' : 'monthly'})`}
                    </span>
                  </div>
                  {quotaLimit !== Infinity && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${quotaUsed >= quotaLimit ? 'bg-red-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, (quotaUsed / quotaLimit) * 100)}%` }}
                      />
                    </div>
                  )}
                  {subscriptionTier === 'free' && (
                    <div className="mt-3 bg-rose-50/55 border border-rose-100 p-3 rounded-xl flex items-start gap-2">
                      <Crown className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-550 leading-normal">
                        Upgrade to **Pro Builder** to unlock unlimited curriculum outlines, notes compilations, and PDF exports.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Workspace Preview */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[480px]">
                
                {/* Output Toolbar */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Mode Toggles */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'preview'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    
                    <button
                      onClick={() => setViewMode('source')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'source'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Source
                    </button>
                  </div>

                  {/* Document Name input */}
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span className="hidden sm:inline">File name:</span>
                    <input
                      type="text"
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-[11px] text-slate-800 focus:outline-none w-[180px] sm:w-[240px]"
                    />
                  </div>

                  {/* Copy / Download / Save Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      disabled={!generatedText}
                      title="Copy to clipboard"
                      className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-655 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={handleDownload}
                      disabled={!generatedText}
                      title="Download Markdown"
                      className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-655 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={handleSaveToWorkspace}
                      disabled={!generatedText}
                      className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>

                {/* Save status notification overlay banner */}
                {saveStatus.type !== 'idle' && (
                  <div className={`px-4 py-2 text-xs flex items-center gap-2 ${
                    saveStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100' : 'bg-red-50 text-red-700 border-b border-red-100'
                  }`}>
                    {saveStatus.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{saveStatus.message}</span>
                    <button onClick={() => setSaveStatus({ type: 'idle', message: '' })} className="ml-auto text-current opacity-70 hover:opacity-100">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Workspace Output Content */}
                <div className="flex-1 p-5 relative overflow-y-auto max-h-[500px]">
                  {viewMode === 'preview' ? (
                    renderMarkdown(generatedText)
                  ) : (
                    <textarea
                      value={generatedText}
                      onChange={(e) => setGeneratedText(e.target.value)}
                      placeholder="Markdown content will output here. You can edit directly in this workspace..."
                      className="w-full h-full min-h-[380px] bg-slate-50/50 border border-slate-150 rounded-xl p-4 font-mono text-xs focus:outline-none focus:ring-0 text-slate-800 resize-none"
                    />
                  )}

                  {generating && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-7 h-7 text-rose-500 animate-spin" />
                      <span className="text-xs font-bold text-slate-600 animate-pulse">
                        Drafting workspace modules...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Documents */}
        {activeTab === 'saved' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Workspace Documents
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real compiled learning materials saved in your local workspace folder. You can load them back into the generator or download directly.
              </p>
            </div>

            {savedDocs.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-12 text-center rounded-2xl flex flex-col items-center gap-3">
                <FileText className="w-8 h-8 text-slate-350" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">No documents saved yet</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Generate learning assets above and click Save to store them in your workspace.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDocs.map((doc, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-350 bg-slate-50/50 flex flex-col justify-between gap-3 group transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-rose-50 text-rose-500 mt-0.5">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 font-mono break-all leading-normal">
                            {doc.filename}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Updated: {new Date(doc.updatedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Delete doc button */}
                      <button
                        onClick={() => handleDeleteSavedDoc(doc.filename)}
                        title="Delete Document"
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-slate-400 transition cursor-pointer select-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/50 pt-3">
                      <span className="text-[10px] font-semibold text-slate-500 font-mono">
                        {(doc.size / 1024).toFixed(2)} KB
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const blob = new Blob([doc.content], { type: 'text/markdown' })
                            const link = document.createElement('a')
                            link.href = URL.createObjectURL(blob)
                            link.download = doc.filename
                            link.click()
                          }}
                          className="px-2.5 py-1.5 rounded bg-white border border-slate-250 text-[11px] font-bold text-slate-655 hover:bg-slate-50 select-none cursor-pointer"
                        >
                          Download
                        </button>
                        
                        <button
                          onClick={() => handleLoadSavedDoc(doc)}
                          className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer select-none shadow-xs"
                        >
                          Load Document
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Prompt History */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                AI Generation History
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                A personal database log of your past inputs, parameters, and generated outlines.
              </p>
            </div>

            {historyList.length === 0 ? (
              <div className="border border-dashed border-slate-200 p-12 text-center rounded-2xl flex flex-col items-center gap-3">
                <History className="w-8 h-8 text-slate-350" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">History is empty</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your AI generation runs will be listed here after you create new assets.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historyList.map((item, idx) => (
                  <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {item.generatorType}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-[10px] font-bold text-rose-600 uppercase font-mono">
                          {item.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-450 font-mono line-clamp-1 max-w-[500px]">
                        {item.promptText}
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        Logged: {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        onClick={() => {
                          setGenerator(item.generatorType)
                          setModel(item.model)
                          // Parse simple topic back out if possible from the history title
                          const splitTitle = item.title.split(' - ')
                          if (splitTitle.length > 1) {
                            setTopic(splitTitle.slice(1).join(' - '))
                          }
                          setActiveTab('generator')
                        }}
                        className="px-2.5 py-1.5 rounded border border-slate-200 hover:border-slate-350 bg-white text-xs font-bold text-slate-655 hover:bg-slate-50 flex items-center gap-1 select-none cursor-pointer"
                      >
                        Restore Settings
                      </button>

                      <button
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-slate-400 transition cursor-pointer select-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
