import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateGemini } from '@/ai/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { challengeId, language, code, errorMsg, userMessage } = await req.json();

    if (!challengeId || !language || !code) {
      return NextResponse.json({ error: 'Missing challengeId, language, or code' }, { status: 400 });
    }

    // 1. Fetch challenge info to give context to Gemini
    const { data: challenge } = await supabase
      .from('coding_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    const title = challenge?.title || 'Unknown Coding Challenge';
    const description = challenge?.description || '';

    // 2. Build the detailed mentor prompt
    const systemPrompt = `You are "AI Mentor", an experienced coding coach and technical instructor on the FarFindARole E-Learning platform.
Your goal is to guide students to solve coding challenges by helping them understand errors, identify logic flaws, and learn optimization strategies.

CRITICAL RULES:
1. NEVER output the full correct solution in any language.
2. DO NOT write copy-pasteable blocks of code that directly solve the challenge.
3. Instead, provide hints, pseudo-code blocks, structural pointers, complexity breakdowns, or explanations of specific bugs.
4. Highlight where the bug is in their code and explain why it happens.
5. Keep your tone encouraging, professional, and educational.

Context:
- Challenge Title: ${title}
- Challenge Description: ${description}
- Selected Coding Language: ${language}

Student's Current Code:
\`\`\`${language}
${code}
\`\`\`

${errorMsg ? `Run / Compile Error Output:\n\`\`\`\n${errorMsg}\n\`\`\`\n` : ''}
Student's Message/Question:
${userMessage || 'I am stuck. Can you explain the bug in my code or suggest how to optimize it?'}

Please provide your mentoring guidance.`;

    // 3. Generate response using Gemini
    const responseText = await generateGemini(systemPrompt, 'gemini-2.5-flash');

    if (!responseText) {
      return NextResponse.json({
        feedback: "AI Mentor is temporarily offline. Please double-check your code's loop conditions or variable initializations!"
      });
    }

    return NextResponse.json({ feedback: responseText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
