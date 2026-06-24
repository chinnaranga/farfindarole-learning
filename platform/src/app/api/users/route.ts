export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers, updateUserRole } from '@/lib/server-store'

export async function GET() {
  try {
    const users = getAllUsers()
    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, role, name } = body
    
    if (!email || !role) {
      return NextResponse.json({ success: false, error: 'Email and role are required' }, { status: 400 })
    }
    
    if (role !== 'student' && role !== 'pro') {
      return NextResponse.json({ success: false, error: 'Invalid role value' }, { status: 400 })
    }
    
    // Authoritative update of user tier
    updateUserRole(email, role, name || 'Student')
    return NextResponse.json({ success: true, message: `Subscription updated successfully to ${role}` })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
