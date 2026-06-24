export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getPromptHistory, savePromptHistory, deletePromptHistory, toggleFavoritePrompt } from '@/lib/server-store'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const authUser = req.headers.get('x-user-id')

    if (!userId || !authUser) {
      return NextResponse.json({ error: 'User ID and x-user-id header are required' }, { status: 400 })
    }

    if (userId.toLowerCase() !== authUser.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = getPromptHistory(userId)
    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, prompt } = body
    const authUser = req.headers.get('x-user-id')

    if (!userId || !prompt || !authUser) {
      return NextResponse.json({ error: 'User ID, prompt, and x-user-id header are required' }, { status: 400 })
    }

    if (userId.toLowerCase() !== authUser.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = savePromptHistory(userId, prompt)
    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, id } = body
    const authUser = req.headers.get('x-user-id')

    if (!userId || !id || !authUser) {
      return NextResponse.json({ error: 'User ID, item ID, and x-user-id header are required' }, { status: 400 })
    }

    if (userId.toLowerCase() !== authUser.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = deletePromptHistory(userId, id)
    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, id } = body
    const authUser = req.headers.get('x-user-id')

    if (!userId || !id || !authUser) {
      return NextResponse.json({ error: 'User ID, item ID, and x-user-id header are required' }, { status: 400 })
    }

    if (userId.toLowerCase() !== authUser.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const history = toggleFavoritePrompt(userId, id)
    return NextResponse.json({ success: true, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}