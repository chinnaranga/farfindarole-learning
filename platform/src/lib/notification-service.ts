import { supabase } from './supabase'
import { getUserRole } from './server-store'
import { sendEmail } from './email'
import {
  getWelcomeEmail,
  getDurationEmail,
  getCompletionEmail,
  getCertificateEmail,
  getProgressEmail,
  getCertificateReadyEmail
} from './email-templates'

/**
 * Coordination service to orchestrate course/lesson completion events and dispatch
 * responsive emails with verified details.
 */

export async function triggerWelcomeAndDurationEmails(email: string, courseId: string) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle()

    if (error || !course) {
      console.error(`[NOTIFICATION-SERVICE] Course not found: ${courseId}`, error)
      return
    }

    // Get lesson count
    const { count: lessonCount, error: countError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)

    const userDetails = getUserRole(email)
    const userName = userDetails?.name || email.split('@')[0]

    const startDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const courseDuration = course.duration || '8 hours'
    const lessonCountVal = (lessonCount !== null && !countError) ? lessonCount : 4
    const estCompletionTime = String(lessonCountVal * 2) // assume ~2 hours per lesson

    // Welcome Email
    const welcomeHtml = getWelcomeEmail({
      userName,
      courseTitle: course.title,
      startDate,
      duration: courseDuration
    })
    await sendEmail({
      to: email,
      subject: `Welcome to ${course.title}!`,
      html: welcomeHtml,
      emailType: 'welcome'
    })

    // Duration Email
    const durationHtml = getDurationEmail({
      userName,
      courseTitle: course.title,
      duration: courseDuration,
      lessonCount: lessonCountVal,
      estCompletionTime
    })
    await sendEmail({
      to: email,
      subject: `Syllabus outline: ${course.title}`,
      html: durationHtml,
      emailType: 'duration'
    })

  } catch (err) {
    console.error('[NOTIFICATION-SERVICE] Error in triggerWelcomeAndDurationEmails:', err)
  }
}

export async function triggerMilestoneEmail(email: string, courseId: string, percentage: number) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle()

    if (error || !course) return

    const userDetails = getUserRole(email)
    const userName = userDetails?.name || email.split('@')[0]

    const html = getProgressEmail({
      userName,
      courseTitle: course.title,
      percentage
    })

    await sendEmail({
      to: email,
      subject: `You've reached ${percentage}% in ${course.title}!`,
      html,
      emailType: 'progress'
    })
  } catch (err) {
    console.error('[NOTIFICATION-SERVICE] Error in triggerMilestoneEmail:', err)
  }
}

export async function triggerCompletionEmail(email: string, courseId: string) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle()

    if (error || !course) return

    const userDetails = getUserRole(email)
    const userName = userDetails?.name || email.split('@')[0]

    const html = getCompletionEmail({
      userName,
      courseTitle: course.title
    })

    await sendEmail({
      to: email,
      subject: `🎓 Congratulations on completing ${course.title}!`,
      html,
      emailType: 'completion'
    })
  } catch (err) {
    console.error('[NOTIFICATION-SERVICE] Error in triggerCompletionEmail:', err)
  }
}

export async function triggerCertificateEmails(email: string, courseId: string, certUrl: string) {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .maybeSingle()

    if (error || !course) return

    const userDetails = getUserRole(email)
    const userName = userDetails?.name || email.split('@')[0]

    // Send Certificate Download Email
    const certHtml = getCertificateEmail({
      userName,
      courseTitle: course.title,
      certUrl
    })
    await sendEmail({
      to: email,
      subject: `🎓 Your certificate for ${course.title} is ready!`,
      html: certHtml,
      emailType: 'certificate'
    })

    // Send Certificate Ready Notification Email
    const readyHtml = getCertificateReadyEmail({
      userName,
      courseTitle: course.title,
      certUrl
    })
    await sendEmail({
      to: email,
      subject: `Verifiable Graduate Document Available: ${course.title}`,
      html: readyHtml,
      emailType: 'certificate_ready'
    })
  } catch (err) {
    console.error('[NOTIFICATION-SERVICE] Error in triggerCertificateEmails:', err)
  }
}
