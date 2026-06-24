import { createClient } from '@supabase/supabase-js'

// Polyfill WebSocket on server-side Node.js environment to prevent Realtime constructor crashes
if (typeof window === 'undefined' && !(global as any).WebSocket) {
  (global as any).WebSocket = class {};
}

// Type definitions for Supabase tables
interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  thumbnail_url?: string;
  instructor_id?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface CourseAnalytics {
  course_id: string;
  enrollment_count: number;
  completion_count: number;
  avg_rating: number | null;
  total_ratings: number;
  last_updated: string;
}

export interface PlatformAnalytics {
  id: number;
  active_learners: number;
  courses_published: number;
  certificates_issued: number;
  hiring_success_rate: number;
  last_updated: string;
}

export interface CareerPath {
  id: string;
  role_name: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  course_categories?: string[];
  difficulty?: string;
  job_openings?: number;
  icon?: string;
  color?: string;
  display_order?: number;
  published: boolean;
  created_at: string;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  order_num?: number;
  free_preview?: boolean;
  coding_challenge_id?: string;
  created_at: string;
  updated_at: string;
}

interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completion_percent?: number;
  time_spent_minutes?: number;
  last_accessed: string;
  created_at: string;
}

interface Quiz {
  id: string;
  lesson_id: string;
  title?: string;
  time_limit_minutes?: number;
  passing_score_percent?: number;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: any[]; // Keeping as any for flexibility since structure varies
  correct_answer_index: number;
  explanation?: string;
  question_type?: string;
  created_at: string;
}

interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan?: 'free' | 'basic' | 'pro' | 'advanced';
  subscription_plan?: string;
  billing_period?: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

interface UserLearningStats {
  id: string;
  user_id: string;
  xp_total?: number;
  current_streak_days?: number;
  learning_hours?: number;
  lessons_completed?: number;
  courses_enrolled?: number;
  courses_completed?: number;
  certificates_earned?: number;
  last_active_date?: string;
  last_updated: string;
}

interface AiLearningPath {
  id: string;
  user_id: string;
  current_skill?: string;
  target_role?: string;
  experience_level?: string;
  roadmap_json: any; // Keeping as any for flexibility
  created_at: string;
}

interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed: boolean;
  completion_percentage?: number;
  completed_at?: string;
  last_accessed: string;
  created_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isMockMode = false

// Singleton pattern to prevent multiple client instances during HMR reloads
let supabaseClient: any

if (!isMockMode) {
  if (typeof window !== 'undefined') {
    // In client-side browser context, store instance on window if not already present
    if (!(window as any).__supabaseInstance) {
      (window as any).__supabaseInstance = createClient(supabaseUrl!, supabaseKey!)
    }
    supabaseClient = (window as any).__supabaseInstance
  } else {
    // In server-side context, store instance on global if not already present
    if (!(global as any).__supabaseInstance) {
      (global as any).__supabaseInstance = createClient(supabaseUrl!, supabaseKey!)
    }
    supabaseClient = (global as any).__supabaseInstance
  }
} else {
  supabaseClient = null as any
}

export const supabase = supabaseClient

// Helper function to fetch courses (with analytics data joined)
export async function getCourses() {
  try {
    const { data: coursesList, error } = await supabase
      .from('courses')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!coursesList || coursesList.length === 0) return []

    // Fetch analytics for all courses in one query
    const courseIds = coursesList.map((c: Course) => c.id)
    const { data: analyticsRows, error: analyticsError } = await supabase
      .from('course_analytics')
      .select('*')
      .in('course_id', courseIds)

    if (analyticsError) throw analyticsError

    const analyticsMap: Record<string, CourseAnalytics> = {}
    ;(analyticsRows || []).forEach((a: CourseAnalytics) => {
      analyticsMap[a.course_id] = a
    })

    return coursesList.map((c: Course) => ({
      ...c,
      enrollment_count: analyticsMap[c.id]?.enrollment_count ?? 0,
      completion_count: analyticsMap[c.id]?.completion_count ?? 0,
      avg_rating: analyticsMap[c.id]?.avg_rating ?? null,
      total_ratings: analyticsMap[c.id]?.total_ratings ?? 0,
    }))
  } catch (err) {
    console.error('Error in getCourses:', err)
    return []
  }
}

export async function getPlatformAnalytics(): Promise<PlatformAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('platform_analytics')
      .select('*')
      .eq('id', 1)
      .single()

    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin')
      .eq('status', 'active')

    const activeLearners = (!countError && count !== null) ? count : 0

    if (error || !data) {
      return {
        id: 1,
        active_learners: activeLearners,
        courses_published: 6,
        certificates_issued: 0,
        hiring_success_rate: 94,
        last_updated: new Date().toISOString()
      }
    }

    return {
      ...data,
      active_learners: activeLearners,
      hiring_success_rate: data.hiring_success_rate || 94
    }
  } catch {
    return null
  }
}

// Fetch all published career paths ordered by display_order
export async function getCareerPaths(): Promise<CareerPath[]> {
  try {
    const { data, error } = await supabase
      .from('career_paths')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('Error in getCareerPaths:', err)
    return []
  }
}

// Fetch per-user learning stats (XP, streak, hours, etc.)
export async function getUserLearningStats(userId: string): Promise<UserLearningStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_learning_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null // no row yet
      throw error
    }
    return data ?? null
  } catch (err) {
    console.error('Error in getUserLearningStats:', err)
    return null
  }
}

// Upsert user learning stats (called after progress updates)
export async function upsertUserLearningStats(userId: string, stats: Partial<Omit<UserLearningStats, 'id' | 'user_id' | 'last_updated'>>) {
  try {
    const { error } = await supabase
      .from('user_learning_stats')
      .upsert({
        ...stats,
        user_id: userId,
        last_active_date: new Date().toISOString().split('T')[0],
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' })
    if (error) throw error
  } catch (err) {
    console.error('Error in upsertUserLearningStats:', err)
  }
}

// Fetch course-specific analytics (enrollment count, avg rating, etc.)
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('course_analytics')
      .select('*')
      .eq('course_id', courseId)
      .single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data ?? null
  } catch (err) {
    console.error('Error in getCourseAnalytics:', err)
    return null
  }
}

// Fetch leaderboard — top users ranked by XP from user_learning_stats
export async function getLeaderboard(limit = 10): Promise<Array<{user_id: string; xp_total: number; courses_completed: number; current_streak_days: number}>> {
  try {
    const { data, error } = await supabase
      .from('user_learning_stats')
      .select('user_id, xp_total, courses_completed, current_streak_days')
      .gt('xp_total', 0)
      .order('xp_total', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data ?? []
  } catch (err) {
    console.error('Error in getLeaderboard:', err)
    return []
  }
}

// Save a search query to DB-backed search_history
export async function saveSearchHistory(userId: string, query: string): Promise<void> {
  if (!userId || !query.trim()) return
  try {
    await supabase
      .from('search_history')
      .insert({ user_id: userId, query: query.trim() })
  } catch (err) {
    console.error('Error in saveSearchHistory:', err)
  }
}

// Fetch the last 5 unique search queries for a user
export async function getSearchHistory(userId: string): Promise<string[]> {
  if (!userId) return []
  try {
    const { data, error } = await supabase
      .from('search_history')
      .select('query, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error

    // Deduplicate while preserving order
    const seen = new Set<string>()
    const unique: string[] = []
    for (const row of (data || [])) {
      if (!seen.has(row.query)) {
        seen.add(row.query)
        unique.push(row.query)
        if (unique.length === 5) break
      }
    }
    return unique
  } catch (err) {
    console.error('Error in getSearchHistory:', err)
    return []
  }
}

// Clear all search history for a user
export async function clearSearchHistory(userId: string) {
  if (!userId) return
  try {
    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId)
  } catch (err) {
    console.error('Error in clearSearchHistory:', err)
  }
}

// Save an AI-generated learning path to the database
export async function saveAiLearningPath(
  userId: string,
  currentSkill: string,
  targetRole: string,
  experienceLevel: string,
  roadmapJson: object
) {
  try {
    const { data, error } = await supabase
      .from('ai_learning_paths')
      .insert({
        user_id: userId,
        current_skill: currentSkill,
        target_role: targetRole,
        experience_level: experienceLevel,
        roadmap_json: roadmapJson
      })
      .select()
      .single()
    if (error) throw error
    return data
  } catch (err) {
    console.error('Error in saveAiLearningPath:', err)
    return null
  }
}

// Fetch all AI learning paths generated by a user
export async function getUserAiLearningPaths(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_learning_paths')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error in getUserAiLearningPaths:', err)
    return []
  }
}

// Increment enrollment count when a user first accesses a course
export async function incrementCourseEnrollment(courseId: string) {
  try {
    const { data: current } = await supabase
      .from('course_analytics')
      .select('enrollment_count')
      .eq('course_id', courseId)
      .single()

    await supabase
      .from('course_analytics')
      .upsert({
        course_id: courseId,
        enrollment_count: (current?.enrollment_count ?? 0) + 1,
        last_updated: new Date().toISOString()
      }, { onConflict: 'course_id' })
  } catch (err) {
    console.error('Error in incrementCourseEnrollment:', err)
  }
}



// Helper function to fetch single course
export async function getCourse(courseId: string) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (error) {
    console.error(`Error in getCourse (${courseId}):`, error)
    throw error
  }

  if (course) {
    const { data: analytics } = await supabase
      .from('course_analytics')
      .select('*')
      .eq('course_id', courseId)
      .single()

    return {
      ...course,
      enrollment_count: analytics?.enrollment_count ?? 0,
      completion_count: analytics?.completion_count ?? 0,
      avg_rating: analytics?.avg_rating ?? null,
      total_ratings: analytics?.total_ratings ?? 0,
    }
  }

  return course
}

// Helper function to fetch lessons for course
export async function getLessons(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_num', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error(`Error in getLessons (${courseId}):`, err)
    return []
  }
}

// Helper to save user progress
export async function saveProgress(userId: string, lessonId: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;

  // Sync to server backend
  if (typeof window !== 'undefined') {
    fetch('/api/course-progress/update-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ userId, lessonId, completed })
    }).catch(e => console.error('Failed to sync lesson progress to backend:', e))
  }

  const { error } = await supabase
    .from('progress')
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed,
        completed_at: completedAt,
        last_accessed: new Date().toISOString()
      },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) {
    console.error('Error in saveProgress:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw error
  }
}

// Helper to check if lesson is completed
export async function getProgress(userId: string, lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return false
      throw error
    }
    return data?.completed || false
  } catch (err) {
    console.error(`Error in getProgress (${userId}:${lessonId}):`, err)
    return false
  }
}

// Helper to retrieve detailed progress including completedAt timestamp
export async function getProgressDetails(userId: string, lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('completed, completed_at, last_accessed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { completed: false, completedAt: null }
      }
      throw error
    }
    return {
      completed: data?.completed || false,
      completedAt: data?.completed_at || data?.last_accessed || null
    };
  } catch (err) {
    console.error(`Error in getProgressDetails (${userId}:${lessonId}):`, err)
    return { completed: false, completedAt: null }
  }
}

export async function saveCourseCompletion(userId: string, courseId: string, completed: boolean) {
  const completedAt = completed ? new Date().toISOString() : null;

  // Sync to server backend
  if (typeof window !== 'undefined') {
    fetch('/api/course-progress/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        userId,
        courseId,
        completed,
        completionPercentage: completed ? 100 : 0
      })
    }).catch(e => console.error('Failed to sync course progress to backend:', e))
  }

  const { error } = await supabase
    .from('course_progress')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        completed,
        completed_at: completedAt,
        last_accessed: new Date().toISOString()
      },
      { onConflict: 'user_id,course_id' }
    )

  if (error) {
    console.error('Error in saveCourseCompletion:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw error
  }
}

export async function saveCertificateBackend(userId: string, courseId: string, certificateUrl: string) {
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/certificates/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ userId, courseId, certificateUrl })
      })
    } catch (e) {
      console.error('Failed to sync certificate to backend:', e)
    }
  }
}

// Helper to retrieve course completion details
export async function getCourseCompletionDetails(userId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('course_progress')
      .select('completed, completed_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { completed: false, completedAt: null }
      }
      throw error
    }
    return {
      completed: data?.completed || false,
      completedAt: data?.completed_at || null
    };
  } catch (err) {
    console.error(`Error in getCourseCompletionDetails (${userId}:${courseId}):`, err)
    return { completed: false, completedAt: null }
  }
}

// Helper to get quiz content
export async function getQuiz(lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*, quiz_questions(*)')
      .eq('lesson_id', lessonId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  } catch (err) {
    console.error(`Error in getQuiz (${lessonId}):`, err)
    return null
  }
}

// Helper to create a new course (for admin panel)
export async function addCourse(title: string, description: string, category: string = 'web-dev', difficulty: string = 'beginner') {
  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        title,
        description,
        category,
        difficulty,
        published: true,
        thumbnail_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80"
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error in addCourse:', error)
    throw error
  }
  return data
}

// Helper to update an existing course
export async function updateCourse(id: string, title: string, description: string, category: string, difficulty: string) {
  const { data, error } = await supabase
    .from('courses')
    .update({
      title,
      description,
      category,
      difficulty,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`Error in updateCourse (${id}):`, error)
    throw error
  }
  return data
}

// Helper to delete a course
export async function deleteCourse(id: string) {
  // Delete child lessons first
  const { error: lessonsError } = await supabase
    .from('lessons')
    .delete()
    .eq('course_id', id)
  
  if (lessonsError) {
    console.error(`Error deleting lessons for course (${id}):`, lessonsError)
  }

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Error in deleteCourse (${id}):`, error)
    throw error
  }
  return true
}

// Helper to publish a new lesson module
export async function addLesson(
  courseId: string,
  title: string,
  content: string,
  durationMinutes: number,
  freePreview: boolean
) {
  const lessonsList = await getLessons(courseId)
  const { data, error } = await supabase
    .from('lessons')
    .insert([
      {
        course_id: courseId,
        title,
        content,
        duration_minutes: durationMinutes,
        order_num: lessonsList.length + 1,
        free_preview: freePreview
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error in addLesson:', error)
    throw error
  }
  return data
}

// Helper to delete a lesson module
export async function deleteLesson(courseId: string, lessonId: string) {
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)
    .eq('course_id', courseId)

  if (error) {
    console.error(`Error in deleteLesson (${lessonId}):`, error)
    throw error
  }
  return true
}

// Helper to transform non-UUID user identifiers (like emails) to a deterministic UUID format
export function getSafeUuid(userId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return userId
  }
  let h1 = 0, h2 = 0
  for (let i = 0; i < userId.length; i++) {
    h1 = (h1 << 5) - h1 + userId.charCodeAt(i)
    h1 |= 0
  }
  for (let i = userId.length - 1; i >= 0; i--) {
    h2 = (h2 << 7) - h2 + userId.charCodeAt(i)
    h2 |= 0
  }
  const part1 = Math.abs(h1).toString(16).padStart(8, '0').slice(0, 8)
  const part2 = Math.abs(h2).toString(16).padStart(8, '0').slice(0, 8)
  const part3 = Math.abs(h1 ^ h2).toString(16).padStart(8, '0').slice(0, 8)
  const part4 = Math.abs(h1 + h2).toString(16).padStart(8, '0').slice(0, 8)
  const combined = (part1 + part2 + part3 + part4).padEnd(32, 'a')
  return `${combined.slice(0, 8)}-${combined.slice(8, 12)}-${combined.slice(12, 16)}-${combined.slice(16, 20)}-${combined.slice(20, 32)}`
}

// Unified helper to retrieve user subscription supporting both old and new schemas
export async function getUserSubscription(userId: string): Promise<{
  plan: 'free' | 'basic' | 'pro' | 'advanced'
  billing_period: string
  subscription_plan: string
}> {
  try {
    const safeId = getSafeUuid(userId)
    const displayNames: Record<string, string> = {
      free: 'Free',
      basic: 'Basic',
      pro: 'Student Pro',
      advanced: 'Advanced'
    }

    // 1. Try the new schema first (plan, billing_period, status, current_period_end)
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .select('plan, billing_period, status, current_period_end')
      .eq('user_id', safeId)
      .maybeSingle()

    if (!error && sub) {
      let isExpired = false
      if (sub.current_period_end) {
        const end = new Date(sub.current_period_end)
        const now = new Date()
        if (end < now) {
          isExpired = true
        }
      }

      const isActiveOrCancelled = !sub.status || sub.status === 'active' || sub.status === 'cancelled'

      let planVal: 'free' | 'basic' | 'pro' | 'advanced' = 'free'
      if (isActiveOrCancelled && !isExpired && sub.plan) {
        planVal = sub.plan.toLowerCase() as any
      }

      return {
        plan: planVal,
        billing_period: sub.billing_period || 'monthly',
        subscription_plan: displayNames[planVal] || 'Free'
      }
    }

    // 2. Fallback to old schema if new schema query failed (e.g. columns undefined)
    if (error && (error.code === 'PGRST204' || error.code === '42703')) {
      const { data: oldSub, error: oldError } = await supabase
        .from('subscriptions')
        .select('subscription_plan, status, current_period_end')
        .eq('user_id', safeId)
        .maybeSingle()

      if (!oldError && oldSub) {
        let isExpired = false
        if (oldSub.current_period_end) {
          const end = new Date(oldSub.current_period_end)
          const now = new Date()
          if (end < now) {
            isExpired = true
          }
        }
        const isActiveOrCancelled = !oldSub.status || oldSub.status === 'active' || oldSub.status === 'cancelled'

        const oldPlan = oldSub.subscription_plan
        let mappedPlan: 'free' | 'basic' | 'pro' | 'advanced' = 'free'
        
        if (isActiveOrCancelled && !isExpired) {
          if (oldPlan === 'Student Pro' || oldPlan === 'Pro') mappedPlan = 'pro'
          else if (oldPlan === 'Advanced') mappedPlan = 'advanced'
          else if (oldPlan === 'Basic') mappedPlan = 'basic'
        }

        return {
          plan: mappedPlan,
          billing_period: 'monthly',
          subscription_plan: oldPlan || 'Free'
        }
      }
    }

    // Default fallback if no row or all failed
    return { plan: 'free', billing_period: 'monthly', subscription_plan: 'Free' }
  } catch (err) {
    console.error('Error fetching subscription:', err)
    return {
      plan: 'free',
      billing_period: 'monthly',
      subscription_plan: 'Free'
    }
  }
}

// Unified helper to upsert user subscription supporting both old and new schemas
export async function updateUserSubscription(userId: string, plan: string, billingPeriod: string = 'monthly') {
  const safeId = getSafeUuid(userId)
  const normPlan = plan.toLowerCase()
  try {
    const displayNames: Record<string, string> = {
      free: 'Free',
      basic: 'Basic',
      pro: 'Student Pro',
      advanced: 'Advanced'
    }
    const oldPlanValue = displayNames[normPlan] || 'Free'

    // 1. Try updating new schema first (plan, billing_period, status)
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: safeId,
        plan: normPlan,
        billing_period: billingPeriod,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + (billingPeriod === 'annually' ? 365 : 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (error) {
      if (error.code === 'PGRST204' || error.code === '42703') {
        // Fallback: Try updating only old schema (user_id, subscription_plan, status)
        const { error: oldErr } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: safeId,
            subscription_plan: oldPlanValue,
            status: 'active',
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
        
        if (oldErr) throw oldErr
        return
      }
      throw error
    }
  } catch (err) {
    console.error('Error updating subscription:', err)
    throw err
  }
}
