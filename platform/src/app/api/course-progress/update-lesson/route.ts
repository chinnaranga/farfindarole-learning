export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { updateLessonProgress } from '@/lib/server-store'
import { supabase } from '@/lib/supabase'
import { triggerWelcomeAndDurationEmails, triggerMilestoneEmail } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, lessonId, completed } = body

    if (!userId || !lessonId) {
      return NextResponse.json({ success: false, error: 'userId and lessonId are required' }, { status: 400 })
    }

    // Security check: user must only access/update their own progress
    const authUserId = request.headers.get('x-user-id')
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const data = updateLessonProgress(userId, lessonId, !!completed)

    // Triggers for automated emails on lesson completion
    if (completed) {
      // Find the course associated with this lesson
      const { data: lesson } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .maybeSingle()

      if (lesson) {
        const courseId = lesson.course_id
        
        // Get all lessons for this course to calculate milestone progress
        const { data: courseLessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId)

        if (courseLessons && courseLessons.length > 0) {
          const lessonIds = courseLessons.map((l: any) => l.id)
          
          // Get completed progress in the database
          const { data: completedProgress } = await supabase
            .from('progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .in('lesson_id', lessonIds)

          const completedCount = completedProgress ? completedProgress.length : 0
          const totalLessons = courseLessons.length
          const currentIsCompleted = completedProgress ? completedProgress.some((p: any) => p.lesson_id === lessonId) : false

          let finalCompletedCount = completedCount
          let wasCompletedBefore = currentIsCompleted

          if (!wasCompletedBefore) {
            finalCompletedCount += 1
          }

          const previousPercentage = completedCount / totalLessons
          const newPercentage = finalCompletedCount / totalLessons

          // ── WELCOME & DURATION EMAILS ──
          // Send when the user completes their very first lesson (indicating course entry/enrollment)
          if (finalCompletedCount === 1 && !wasCompletedBefore) {
            triggerWelcomeAndDurationEmails(userId, courseId).catch(err => {
              console.error('[EMAIL-TRIGGER] Failed to trigger welcome/duration emails:', err)
            })
          }

          // ── PROGRESS MILESTONE EMAILS ──
          // Send progress milestones at 25%, 50%, and 75%
          const checkMilestone = (milestone: number, label: number) => {
            if (previousPercentage < milestone && newPercentage >= milestone && newPercentage < 1.0) {
              triggerMilestoneEmail(userId, courseId, label).catch(err => {
                console.error(`[EMAIL-TRIGGER] Failed to trigger ${label}% progress email:`, err)
              })
            }
          }

          checkMilestone(0.25, 25)
          checkMilestone(0.50, 50)
          checkMilestone(0.75, 75)
        }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
