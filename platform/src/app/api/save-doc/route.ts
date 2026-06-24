import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Since this is a local-only utility for writing to the local workspace disk,
// we mock it out on the Edge Runtime (production/Cloudflare) to prevent compilation
// and security issues in the serverless environment.

export async function GET() {
  return NextResponse.json({ success: true, documents: [] })
}

export async function POST() {
  return NextResponse.json({ 
    success: false, 
    error: 'Document editing is only supported in the local development environment.' 
  }, { status: 403 })
}

export async function DELETE() {
  return NextResponse.json({ 
    success: false, 
    error: 'Document editing is only supported in the local development environment.' 
  }, { status: 403 })
}
