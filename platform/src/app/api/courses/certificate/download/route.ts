export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateCertificatePDF } from '@/lib/pdf-generator';
import { sendEmail } from '@/lib/email';
import { getCertificateEmail } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId'); // email
    const nameParam = searchParams.get('name'); // student name fallback/override
    const sendEmailParam = searchParams.get('sendEmail'); // whether to trigger background email

    let verificationCode = '';
    let certCourseId = '';
    let certUserId = '';
    let issuedAtStr = '';
    let certificateUrl = '';

    // 1. Resolve certificate details from database
    if (code) {
      // Fetch by verification code
      const { data: cert, error: certErr } = await supabase
        .from('certificates')
        .select('*')
        .eq('verification_code', code)
        .maybeSingle();

      if (certErr || !cert) {
        return NextResponse.json({ success: false, error: 'Certificate not found for this verification code' }, { status: 404 });
      }

      verificationCode = cert.verification_code;
      certCourseId = cert.course_id;
      certUserId = cert.user_id;
      issuedAtStr = cert.issued_at;
      certificateUrl = cert.certificate_url;
    } else if (courseId && userId) {
      // Fetch by course and user email
      const email = userId.toLowerCase();
      const { data: cert, error: certErr } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', email)
        .eq('course_id', courseId)
        .maybeSingle();

      if (certErr) {
        return NextResponse.json({ success: false, error: 'Database error fetching certificate' }, { status: 500 });
      }

      if (cert) {
        verificationCode = cert.verification_code;
        certCourseId = cert.course_id;
        certUserId = cert.user_id;
        issuedAtStr = cert.issued_at;
        certificateUrl = cert.certificate_url;
      } else {
        // Certificate does not exist yet: Check if user is eligible and issue it
        // A. Verify all lessons are completed
        const { data: lessons, error: lessonsErr } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);

        if (lessonsErr || !lessons || lessons.length === 0) {
          return NextResponse.json({ success: false, error: 'Lessons not found for this course' }, { status: 400 });
        }

        const { data: completions, error: completionsErr } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', email)
          .eq('completed', true);

        if (completionsErr) {
          return NextResponse.json({ success: false, error: 'Failed to verify course progress' }, { status: 500 });
        }

        const completedLessonIds = new Set((completions || []).map((c: any) => c.lesson_id));
        const allLessonsCompleted = lessons.every((l: any) => completedLessonIds.has(l.id));

        if (!allLessonsCompleted) {
          return NextResponse.json({ success: false, error: 'Course is not completed yet' }, { status: 400 });
        }

        // B. Verify graded quizzes are passed
        const lessonIds = lessons.map((l: any) => l.id);
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('id, title, passing_score_percent, is_graded, is_final')
          .in('lesson_id', lessonIds);

        const gradedQuizzes = (quizzes || []).filter((q: any) => q.is_graded);

        for (const quiz of gradedQuizzes) {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('score_percent, passed')
            .eq('user_id', email)
            .eq('quiz_id', quiz.id);

          const threshold = quiz.is_final ? (quiz.passing_score_percent || 80) : (quiz.passing_score_percent || 70);
          const hasPassed = (attempts || []).some((a: any) => a.passed || a.score_percent >= threshold);
          if (!hasPassed) {
            return NextResponse.json({ success: false, error: `Graded assessment "${quiz.title}" not passed` }, { status: 400 });
          }
        }

        // C. Generate new certificate
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        verificationCode = `FAR-${email.slice(0, 3).toUpperCase()}-${courseId.slice(-4).toUpperCase()}-${randomPart}`;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        certificateUrl = `${baseUrl}/verify/certificate/${verificationCode}`;

        const { error: insertErr } = await supabase
          .from('certificates')
          .insert({
            user_id: email,
            course_id: courseId,
            verification_code: verificationCode,
            certificate_url: certificateUrl
          });

        if (insertErr) {
          return NextResponse.json({ success: false, error: 'Failed to create certificate record' }, { status: 500 });
        }

        // Also try to insert into course_completions
        try {
          await supabase.from('course_completions').upsert({
            user_id: email,
            course_id: courseId,
            completed_at: new Date().toISOString(),
            certificate_url: certificateUrl
          });
        } catch (e) {
          console.warn('[DOWNLOAD-ROUTE] course_completions upsert skipped:', e);
        }

        certCourseId = courseId;
        certUserId = email;
        issuedAtStr = new Date().toISOString();
      }
    } else {
      return NextResponse.json({ success: false, error: 'Missing required parameters (code, or courseId and userId)' }, { status: 400 });
    }

    // 2. Fetch course title
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('title')
      .eq('id', certCourseId)
      .maybeSingle();

    if (courseErr || !course) {
      return NextResponse.json({ success: false, error: 'Course details not found' }, { status: 404 });
    }

    const courseTitle = course.title;

    // 3. Resolve student's name
    let studentName = nameParam || '';
    
    if (!studentName) {
      const authHeader = request.headers.get('Authorization');
      let token = '';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
      
      if (token) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user && user.email?.toLowerCase() === certUserId.toLowerCase()) {
            studentName = user.user_metadata?.full_name || '';
            if (!studentName) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .maybeSingle();
              if (profile?.full_name) {
                studentName = profile.full_name;
              }
            }
          }
        } catch (authErr) {
          console.warn('[DOWNLOAD-ROUTE] Auth check skipped:', authErr);
        }
      }
    }

    // Final fallback: capitalize email prefix
    if (!studentName) {
      const emailPrefix = certUserId.split('@')[0];
      studentName = emailPrefix
        .split(/[-_.]/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // 4. Format issue date (e.g., "June 24, 2026")
    const issuedDate = issuedAtStr ? new Date(issuedAtStr) : new Date();
    const formattedDate = issuedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 5. Compile the PDF in-memory
    const fileBuffer = await generateCertificatePDF({
      verificationCode,
      studentName,
      courseTitle,
      issuedAt: formattedDate
    });

    // 6. Asynchronously send the certificate email in the background if requested
    if (sendEmailParam === 'true') {
      const safeTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const attachments = [
        {
          content: fileBuffer.toString('base64'),
          filename: `FarFindARole_Certificate_${safeTitle}.pdf`,
          type: 'application/pdf'
        }
      ];

      const certHtml = getCertificateEmail({
        userName: studentName,
        courseTitle,
        certUrl: certificateUrl
      });

      // Fire and forget email sending in the background
      sendEmail({
        to: certUserId,
        subject: `Your Certificate is Ready to Download`,
        html: certHtml,
        emailType: 'certificate',
        attachments
      }).catch(err => {
        console.error('[DOWNLOAD-ROUTE] Background email dispatch failed:', err);
      });
    }

    // Clean course title for filename
    const safeTitle = courseTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const downloadFileName = `FarFindARole_Certificate_${safeTitle}.pdf`;

    // 7. Return binary response for instant file download
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('[DOWNLOAD-ROUTE] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
