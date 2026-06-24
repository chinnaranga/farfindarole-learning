export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGemini } from '@/ai/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { courseId, githubUrl, demoUrl, notes } = await req.json();

    if (!courseId || !githubUrl) {
      return NextResponse.json({ error: 'Missing courseId or githubUrl' }, { status: 400 });
    }

    // 1. Fetch course & capstone guidelines
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single();

    const { data: capstone } = await supabase
      .from('capstone_projects')
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle();

    const courseTitle = course?.title || 'Unknown Course';
    const capstoneTitle = capstone?.title || 'Capstone Project';
    const capstoneDesc = capstone?.description || '';
    const capstoneGuidelines = capstone?.guidelines || '';

    // 2. Build the detailed AI Reviewer prompt
    const systemPrompt = `You are "AI Senior Code Reviewer", an expert systems architect and engineering lead at FarFindARole.
Your goal is to inspect a student's Capstone Project submission and provide a high-quality, constructive code review, architectural critique, and design audit.

Submission Details:
- Course: ${courseTitle}
- Project Title: ${capstoneTitle}
- Project Requirements: ${capstoneDesc}
- Evaluation Guidelines: ${capstoneGuidelines}
- Submitted Github URL: ${githubUrl}
- Live Demo Link: ${demoUrl || 'Not provided'}
- Student Notes / Implementation Details:
${notes || 'No notes provided.'}

Your Review Output:
Please structure your review as follows:
1. **Executive Summary**: 1-2 sentence overview of the submission and whether it seems to cover the guidelines.
2. **Architecture & Design Review**: Evaluate their technical approach based on their notes (e.g. state management, separation of concerns).
3. **Github & Code Layout Review**: Suggestions for repository structure and code cleanliness.
4. **Actionable Suggestions for Improvement**: 2-3 specific features or optimizations they should add (e.g. performance indexing, error boundaries, debouncing inputs).
5. **AI Recommendation**: Mock status recommendation (Approved or Needs Revision) based on requirements.

Remember to keep your tone professional, constructive, and highly technical.`;

    // 3. Generate response using Gemini
    const responseText = await generateGemini(systemPrompt, 'gemini-2.5-flash');

    if (!responseText) {
      return NextResponse.json({
        feedback: "AI Reviewer is temporarily offline. Your submission has been saved, and an instructor will review it shortly!"
      });
    }

    return NextResponse.json({ feedback: responseText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}