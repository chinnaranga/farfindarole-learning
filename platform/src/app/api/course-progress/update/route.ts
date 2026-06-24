export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { updateCourseProgress } from '@/lib/server-store'
import { supabase } from '@/lib/supabase'
import { triggerCompletionEmail, triggerMilestoneEmail } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, completed, completionPercentage } = body

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: 'userId and courseId are required' }, { status: 400 })
    }

    // Security check: user must only access/update their own progress
    const authUserId = request.headers.get('x-user-id')
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const data = updateCourseProgress(userId, courseId, !!completed, completionPercentage || 0)

    // Triggers for automated emails on course completion
    if (completed) {
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .maybeSingle()

      if (course) {
        // Prevent duplicate completion email checks
        const { data: existingLog } = await supabase
          .from('email_logs')
          .select('id')
          .eq('recipient', userId.toLowerCase())
          .eq('email_type', 'completion')
          .ilike('subject', `ompleted ${course.title}