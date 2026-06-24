import { supabase } from './supabase'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  emailType: 'welcome' | 'duration' | 'completion' | 'certificate' | 'progress' | 'reminder' | 'certificate_ready' | string
  attachments?: Array<{
    content: string // Base64 encoded string
    filename: string
    type?: string
  }>
}

/**
 * Transactional email sender that communicates with the Resend API.
 * Performs database-level logging to `email_logs` and supports local fallback files for development.
 */
export async function sendEmail({ to, subject, html, emailType, attachments }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const cleanRecipient = to.trim().toLowerCase()
  const targetRecipient = RESEND_TEST_RECIPIENT ? RESEND_TEST_RECIPIENT.trim().toLowerCase() : cleanRecipient

  if (RESEND_TEST_RECIPIENT) {
    console.log(`[EMAIL-SYSTEM] RESEND_TEST_RECIPIENT override active. Redirecting email from ${cleanRecipient} to verified test email: ${targetRecipient}`)
  }

  console.log(`[EMAIL-SYSTEM] Attempting to send ${emailType} email to ${targetRecipient} (Subject: "${subject}")`)

  let status: 'success' | 'failed' = 'success'
  let errorMessage: string | null = null

  try {
    if (!RESEND_API_KEY) {
      // ── LOCAL LOG FALLBACK MODE ──
      console.warn('[EMAIL-SYSTEM] RESEND_API_KEY is not defined. Logging email to console.')
      
      console.log(`
========================================
TIMESTAMP: ${new Date().toISOString()}
TO: ${targetRecipient} (Original: ${cleanRecipient})
TYPE: ${emailType}
SUBJECT: ${subject}
----------------------------------------
HTML BODY:
${html}
========================================
`)
    } else {
      // ── CLIENTLESS RESEND API FETCH ──
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'FarFindARole Learn <onboarding@resend.dev>', // Resend sandbox default from address
          to: targetRecipient,
          subject: subject,
          html: html,
          ...(attachments && attachments.length > 0 ? { attachments } : {})
        })
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Resend API returned status ${res.status}: ${errBody}`)
      }
    }
  } catch (err: any) {
    status = 'failed'
    errorMessage = err.message || String(err)
    console.error(`[EMAIL-SYSTEM] Error sending email to ${targetRecipient}:`, errorMessage)
  }

  // ── LOG TO DATABASE TABLE (email_logs) ──
  try {
    const logSubject = RESEND_TEST_RECIPIENT ? `${subject} (Redirected to ${targetRecipient})` : subject
    const { error: dbError } = await supabase
      .from('email_logs')
      .insert({
        recipient: cleanRecipient,
        email_type: emailType,
        subject: logSubject,
        status: status,
        error_message: errorMessage,
        sent_at: new Date().toISOString()
      })

    if (dbError) {
      console.warn('[EMAIL-SYSTEM] Failed to write database log to "email_logs" table. Note: If the SQL migration has not been run, this error is expected. Fallback logging was successful. DB Error:', dbError.message)
    } else {
      console.log(`[EMAIL-SYSTEM] Email execution logged to database for ${cleanRecipient}.`)
    }
  } catch (dbErr) {
    console.warn('[EMAIL-SYSTEM] Exception logging to database. Supabase table might not exist yet. Error:', dbErr)
  }

  return { success: status === 'success', error: errorMessage || undefined }
}
