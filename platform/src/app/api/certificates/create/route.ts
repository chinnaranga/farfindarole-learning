export const runtime = 'edge';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server'
import { saveCertificate } from '@/lib/server-store'
import { supabase } from '@/lib/supabase'
import { triggerCertificateEmails } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, courseId, certificateUrl } = body

    if (!userId || !courseId || !certificateUrl) {
      return NextResponse.json({ success: false, error: 'userId, courseId, and certificateUrl are required' }, { status: 400 })
    }

    // Security check: user must only access/update their own progress
    const authUserId = request.headers.get('x-user-id')
    if (!authUserId || authUserId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    saveCertificate(userId, courseId, certificateUrl)

    // Trigger certificate ready & download emails
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle()

    if (course) {
      // Prevent duplicate certificate emails
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('recipient', userId.toLowerCase())
        .eq('email_type', 'certificate')
        .ilike('subject', `ertificate for ${course.title}