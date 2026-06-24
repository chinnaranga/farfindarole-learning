export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getUserProgress } from '@/lib/server-store'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    // Security check: user must only access their own progress
    const authUserId = request.headers.get('x-user-id')
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const progressData = getUserProgress(userId)
    return NextResponse.json({ success: true, ...progressData })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}