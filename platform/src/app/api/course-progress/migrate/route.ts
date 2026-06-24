export const runtime = 'edge';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { migrateUserProgress } from '@/lib/server-store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, progress } = body

    if (!userId || !progress) {
      return NextResponse.json({ success: false, error: 'userId and progress are required' }, { status: 400 })
    }

    // Security check: user must only access/update their own progress
    const authUserId = request.headers.get('x-user-id')
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    migrateUserProgress(userId, progress)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}