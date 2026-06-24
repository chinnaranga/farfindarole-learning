export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { generate } from '@/ai/router'

export async function POST(req: NextRequest) {
  try {
    const authUser = req.headers.get('x-user-id')
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized: missing x-user-id header' }, { status: 401 })
    }

    const { type, prompt, model } = await req.json()
    if (!type || !prompt) {
      return NextResponse.json({ error: 'type and prompt are required' }, { status: 400 })
    }

    const result = await generate(type, prompt, model)
    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active API keys found. Please set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or OPENROUTER_API_KEY in your env configuration.' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, text: result })
  } catch (error: any) {
    console.error('AI Generation API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}