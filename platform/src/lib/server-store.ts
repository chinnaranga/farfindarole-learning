import storeDataJson from './store-data.json'

interface StoreData {
  sessions: Array<{
    id?: string
    name: string
    email: string
    lastActive: string
    role: string
    device?: string
  }>
  userRoles: Record<string, { role: 'student' | 'pro', name: string }>
  progress: Record<string, { completed: boolean, completedAt: string | null, updatedAt: string }>
  courseProgress: Record<string, { completed: boolean, completionPercentage: number, completedAt: string | null, updatedAt: string }>
  certificates: Array<{
    id: string
    userId: string
    courseId: string
    certificateUrl: string
    issuedAt: string
  }>
  courses?: any[]
  modules?: any[]
  lessons?: any[]
  quizzes?: any[]
  assignments?: any[]
  flashcards?: any[]
  exam_papers?: any[]
  rubrics?: any[]
  templates?: any[]
  prompt_history?: any[]
  exports?: any[]
  analytics?: any
  workspaces?: any[]
  comments?: any[]
  users?: any[]
}

// Global mutable store in memory, deep-copied from the JSON file
let globalStore: StoreData = JSON.parse(JSON.stringify(storeDataJson))

function getStore(): StoreData {
  return globalStore
}

function writeStore(data: StoreData) {
  globalStore = data
}

export function registerSession(name: string, email: string, role: string, device?: string, id?: string) {
  const data = getStore()
  const now = new Date().toISOString()
  
  // Use registered server-side role if it exists, otherwise fall back to local client role
  const activeRole = data.userRoles[email.toLowerCase()]?.role || role
  const activeName = data.userRoles[email.toLowerCase()]?.name || name
  
  const newSession = {
    id,
    name: activeName,
    email: email.toLowerCase(),
    lastActive: now,
    role: activeRole,
    device: device || 'Web Browser'
  }
  
  // Filter out expired sessions (older than 20 seconds) and the current user's old session
  const threshold = Date.now() - 20000
  const filtered = data.sessions.filter(s => {
    const isSelf = s.email === email.toLowerCase()
    const isFresh = new Date(s.lastActive).getTime() > threshold
    return !isSelf && isFresh
  })
  
  filtered.unshift(newSession)
  data.sessions = filtered
  writeStore(data)
  return activeRole
}

export function getActiveSessions() {
  const data = getStore()
  const threshold = Date.now() - 20000 // 20s timeout
  return data.sessions.filter(s => new Date(s.lastActive).getTime() > threshold)
}

export function updateUserRole(email: string, role: 'student' | 'pro', name: string) {
  const data = getStore()
  const key = email.toLowerCase()
  data.userRoles[key] = { role, name }
  
  // Also update active session if it exists in active list
  data.sessions = data.sessions.map(s => {
    if (s.email === key) {
      return { ...s, role, name }
    }
    return s
  })
  
  writeStore(data)
}

export function getUserRole(email: string) {
  const data = getStore()
  return data.userRoles[email.toLowerCase()] || null
}

export function getAllUsers() {
  const data = getStore()
  
  // Build dynamic directory of user details from role configurations and active session pings
  const userMap: Record<string, { id?: string, email: string, name: string, role: 'student' | 'pro' }> = {
    'student@farfindarole.com': { email: 'student@farfindarole.com', name: 'RA Student', role: 'student' },
    'pro@farfindarole.com': { email: 'pro@farfindarole.com', name: 'RA Pro Student', role: 'pro' }
  }
  
  // Add server-saved roles
  Object.keys(data.userRoles).forEach(email => {
    userMap[email] = {
      email,
      name: data.userRoles[email].name,
      role: data.userRoles[email].role
    }
  })
  
  // Discover dynamic logins from live session pings
  data.sessions.forEach(s => {
    if (!userMap[s.email]) {
      userMap[s.email] = {
        id: s.id,
        email: s.email,
        name: s.name,
        role: s.role as 'student' | 'pro'
      }
    } else if (s.id) {
      userMap[s.email].id = s.id
    }
  })
  
  return Object.values(userMap)
}

export interface ProgressDetail {
  completed: boolean
  completedAt: string | null
  updatedAt: string
}

export interface CourseProgressDetail {
  completed: boolean
  completionPercentage: number
  completedAt: string | null
  updatedAt: string
}

export interface MigrationProgress {
  lessonProgress?: Record<string, { completed: boolean; completedAt?: string | null }>
  courseProgress?: Record<string, { completed: boolean; completionPercentage?: number; completedAt?: string | null }>
}

export function getUserProgress(userId: string) {
  const data = getStore()
  const emailKey = userId.toLowerCase()
  
  // Filter progress matching keys starting with emailKey:
  const userProgress: Record<string, ProgressDetail> = {}
  Object.keys(data.progress || {}).forEach(key => {
    if (key.startsWith(`${emailKey}:`)) {
      userProgress[key] = data.progress[key]
    }
  })

  const userCourseProgress: Record<string, CourseProgressDetail> = {}
  Object.keys(data.courseProgress || {}).forEach(key => {
    if (key.startsWith(`${emailKey}:`)) {
      userCourseProgress[key] = data.courseProgress[key]
    }
  })

  const userCertificates = (data.certificates || []).filter(c => c.userId.toLowerCase() === emailKey)

  return {
    progress: userProgress,
    courseProgress: userCourseProgress,
    certificates: userCertificates
  }
}

export function updateLessonProgress(userId: string, lessonId: string, completed: boolean) {
  const data = getStore()
  const key = `${userId.toLowerCase()}:${lessonId}`
  const now = new Date().toISOString()
  
  if (!data.progress) data.progress = {}
  
  data.progress[key] = {
    completed,
    completedAt: completed ? now : null,
    updatedAt: now
  }
  
  writeStore(data)
  return data.progress[key]
}

export function updateCourseProgress(userId: string, courseId: string, completed: boolean, completionPercentage: number) {
  const data = getStore()
  const key = `${userId.toLowerCase()}:course:${courseId}`
  const now = new Date().toISOString()
  
  if (!data.courseProgress) data.courseProgress = {}
  
  data.courseProgress[key] = {
    completed,
    completionPercentage,
    completedAt: completed ? now : null,
    updatedAt: now
  }
  
  writeStore(data)
  return data.courseProgress[key]
}

export function saveCertificate(userId: string, courseId: string, certificateUrl: string) {
  const data = getStore()
  const now = new Date().toISOString()
  
  if (!data.certificates) data.certificates = []
  
  // Avoid duplicates
  const exists = data.certificates.some(
    c => c.userId.toLowerCase() === userId.toLowerCase() && c.courseId === courseId
  )
  if (exists) return
  
  const id = `cert-${userId.slice(0, 4)}-${courseId.slice(-4)}-${Math.random().toString(36).substring(2, 6)}`
  
  data.certificates.push({
    id,
    userId: userId.toLowerCase(),
    courseId,
    certificateUrl,
    issuedAt: now
  })
  
  writeStore(data)
}

export function migrateUserProgress(userId: string, progress: MigrationProgress) {
  const data = getStore()
  const emailKey = userId.toLowerCase()
  const now = new Date().toISOString()

  if (!data.progress) data.progress = {}
  if (!data.courseProgress) data.courseProgress = {}

  if (progress.lessonProgress) {
    Object.keys(progress.lessonProgress).forEach(key => {
      if (key.startsWith(`${emailKey}:`)) {
        const detail = progress.lessonProgress![key]
        data.progress[key] = {
          completed: !!detail.completed,
          completedAt: detail.completedAt || null,
          updatedAt: now
        }
      }
    })
  }

  if (progress.courseProgress) {
    Object.keys(progress.courseProgress).forEach(key => {
      if (key.startsWith(`${emailKey}:`)) {
        const detail = progress.courseProgress![key]
        data.courseProgress[key] = {
          completed: !!detail.completed,
          completionPercentage: detail.completionPercentage || (detail.completed ? 100 : 0),
          completedAt: detail.completedAt || null,
          updatedAt: now
        }
      }
    })
  }

  writeStore(data)
}

export function getPromptHistory(userId: string) {
  const data = getStore()
  return (data.prompt_history || []).filter(p => p.userId.toLowerCase() === userId.toLowerCase())
}

export function savePromptHistory(userId: string, prompt: any) {
  const data = getStore()
  if (!data.prompt_history) data.prompt_history = []
  
  const existingIndex = data.prompt_history.findIndex(p => p.id === prompt.id)
  const now = new Date().toISOString()
  
  if (existingIndex > -1) {
    const prev = data.prompt_history[existingIndex]
    const versions = prev.versions || []
    versions.push({
      promptText: prev.promptText,
      timestamp: prev.updatedAt || prev.createdAt || now
    })
    data.prompt_history[existingIndex] = {
      ...prev,
      ...prompt,
      userId: userId.toLowerCase(),
      versions,
      updatedAt: now
    }
  } else {
    data.prompt_history.push({
      ...prompt,
      userId: userId.toLowerCase(),
      favorite: false,
      versions: [],
      createdAt: now,
      updatedAt: now
    })
  }
  writeStore(data)
  return data.prompt_history
}

export function deletePromptHistory(userId: string, id: string) {
  const data = getStore()
  if (!data.prompt_history) data.prompt_history = []
  data.prompt_history = data.prompt_history.filter(p => !(p.id === id && p.userId.toLowerCase() === userId.toLowerCase()))
  writeStore(data)
  return data.prompt_history
}

export function toggleFavoritePrompt(userId: string, id: string) {
  const data = getStore()
  if (!data.prompt_history) data.prompt_history = []
  data.prompt_history = data.prompt_history.map(p => {
    if (p.id === id && p.userId.toLowerCase() === userId.toLowerCase()) {
      return { ...p, favorite: !p.favorite }
    }
    return p
  })
  writeStore(data)
  return data.prompt_history
}

export function getTemplates() {
  const data = getStore()
  return data.templates || []
}

export function saveTemplate(template: any) {
  const data = getStore()
  if (!data.templates) data.templates = []
  
  const idx = data.templates.findIndex(t => t.id === template.id)
  if (idx > -1) {
    data.templates[idx] = { ...data.templates[idx], ...template }
  } else {
    data.templates.push({
      ...template,
      id: template.id || `tpl-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString()
    })
  }
  writeStore(data)
  return data.templates
}

export function getComments(itemId: string) {
  const data = getStore()
  return (data.comments || []).filter(c => c.itemId === itemId)
}

export function addComment(comment: any) {
  const data = getStore()
  if (!data.comments) data.comments = []
  const newComment = {
    ...comment,
    id: `c-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString()
  }
  data.comments.push(newComment)
  writeStore(data)
  return newComment
}

export function getAnalytics() {
  const data = getStore()
  return data.analytics || { totalGenerations: 0, dailyGenerations: 0, monthlyGenerations: 0, templateUsage: {}, topicUsage: {}, downloads: {} }
}

export function incrementAnalytics(metric: 'generations' | 'downloads', name?: string) {
  const data = getStore()
  if (!data.analytics) {
    data.analytics = { totalGenerations: 0, dailyGenerations: 0, monthlyGenerations: 0, templateUsage: {}, topicUsage: {}, downloads: {} }
  }
  
  if (metric === 'generations') {
    data.analytics.totalGenerations = (data.analytics.totalGenerations || 0) + 1
    data.analytics.dailyGenerations = (data.analytics.dailyGenerations || 0) + 1
    data.analytics.monthlyGenerations = (data.analytics.monthlyGenerations || 0) + 1
    if (name) {
      if (!data.analytics.templateUsage) data.analytics.templateUsage = {}
      data.analytics.templateUsage[name] = (data.analytics.templateUsage[name] || 0) + 1
    }
  } else if (metric === 'downloads') {
    if (!data.analytics.downloads) data.analytics.downloads = {}
    if (name) {
      data.analytics.downloads[name] = (data.analytics.downloads[name] || 0) + 1
    }
  }
  writeStore(data)
  return data.analytics
}

export function saveGeneratedContent(collection: string, item: any) {
  const data = getStore() as any
  if (!data[collection]) data[collection] = []
  data[collection].push({
    ...item,
    id: item.id || `${collection.slice(0, 3)}-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString()
  })
  writeStore(data)
}
