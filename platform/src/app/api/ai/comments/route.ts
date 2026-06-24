export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getComments, addComment } from '@/lib/server-store'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    const list = getComments(itemId)
    return NextResponse.json({ success: true, comments: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const comment = await req.json()
    if (!comment.itemId || !comment.userName || !comment.commentText) {
      return NextResponse.json({ error: 'itemId, userName, and commentText are required' }, { status: 400 })
    }
    const newComment = addComment(comment)
    return NextResponse.json({ success: true, comment: newComment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
