import { NextRequest, NextResponse } from 'next/server'
import { registerSession, getActiveSessions } from '@/lib/server-store'

export async function GET() {
  try {
    const sessions = getActiveSessions()
    return NextResponse.json({ success: true, sessions })
  } catch {
    // File store may not exist yet in a fresh environment — return empty gracefully
    return NextResponse.json({ success: true, sessions: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, email, role, device } = body
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }
    
    // Register the session and return the server-authoritative role
    const activeRole = registerSession(
      name || 'Student',
      email,
      role || 'student',
      device || 'Web Browser',
      id
    )
    
    return NextResponse.json({ success: true, role: activeRole })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
