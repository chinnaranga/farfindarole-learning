export const runtime = 'edge';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { saveCertificate } from '@/lib/server-store';

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json({ success: false, error: 'Missing userId or courseId' }, { status: 400 });
    }

    const email = userId.toLowerCase();

    // 1. Verify all lessons are completed
    const { data: lessons, error: lessonsErr } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    if (lessonsErr) {
      console.error('[CERT] Failed to fetch lessons:', lessonsErr.message);
      return NextResponse.json({ success: false, error: 'Failed to fetch course lessons' }, { status: 500 });
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ success: false, error: 'No lessons found for this course' }, { status: 400 });
    }

    const { data: completions, error: completionsErr } = await supabase
      .from('progress')
      .select('lesson_id')
      .eq('user_id', email)
      .eq('completed', true);

    if (completionsErr) {
      console.error('[CERT] Failed to fetch progress:', completionsErr.message);
      return NextResponse.json({ success: false, error: 'Failed to fetch lesson progress' }, { status: 500 });
    }

    const completedLessonIds = new Set((completions || []).map((c: any) => c.lesson_id));
    const allLessonsCompleted = lessons.every((l: any) => completedLessonIds.has(l.id));

    if (!allLessonsCompleted) {
      const completed = completedLessonIds.size;
      const total = lessons.length;
      return NextResponse.json({
        success: false,
        error: `Requirements not met: You must complete all lessons (${completed}/${total} done).`
      }, { status: 400 });
    }

    // 2. Verify all graded quizzes are passed (if any exist)
    const lessonIds = lessons.map((l: any) => l.id);
    const { data: quizzes, error: quizzesErr } = await supabase
      .from('quizzes')
      .select('id, title, passing_score_percent, is_final, is_graded')
      .in('lesson_id', lessonIds);

    if (quizzesErr) {
      // quizzes table might not have all rows — log and continue
      console.warn('[CERT] Could not fetch quizzes:', quizzesErr.message);
    }

    const allQuizzes = quizzes || [];
    const gradedQuizzes = allQuizzes.filter((q: any) => q.is_graded);

    for (const quiz of gradedQuizzes) {
      const { data: attempts, error: attErr } = await supabase
        .from('quiz_attempts')
        .select('score_percent, passed')
        .eq('user_id', email)
        .eq('quiz_id', quiz.id);

      if (attErr) {
        console.warn('[CERT] Could not fetch quiz attempts for:', quiz.title, attErr.message);
        continue; // don't block certificate for missing attempt data
      }

      const threshold = quiz.is_final ? (quiz.passing_score_percent || 80) : (quiz.passing_score_percent || 70);
      const hasPassed = (attempts || []).some((a: any) => a.passed || a.score_percent >= threshold);
      if (!hasPassed) {
        return NextResponse.json({
          success: false,
          error: `Requirements not met: You must pass "${quiz.title}" (${threshold}