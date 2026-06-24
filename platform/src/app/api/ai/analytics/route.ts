export const runtime = 'edge';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { getAnalytics, incrementAnalytics } from '@/lib/server-store'

export async function GET(req: NextRequest) {
  try {
    const stats = getAnalytics()
    return NextResponse.json({ success: true, analytics: stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { metric, name } = body
    if (!metric || (metric !== 'generations' && metric !== 'downloads')) {
      return NextResponse.json({ error: 'Valid metric is required' }, { status: 400 })
    }
    const stats = incrementAnalytics(metric, name)
    return NextResponse.json({ success: true, analytics: stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}