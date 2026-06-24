/**
 * Reusable, responsive HTML email templates for FarFindARole Learn
 */

const primaryColor = '#dc2626' // Red
const secondaryColor = '#4f46e5' // Indigo
const darkBg = '#0f172a' // Slate 900
const textDark = '#1e293b' // Slate 800
const textLight = '#64748b' // Slate 500

function getBaseLayout(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: ${textDark};
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 20px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, ${darkBg} 0%, #1e1b4b 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .logo-badge {
      background-color: ${primaryColor};
      color: #ffffff;
      font-weight: 900;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-block;
    }
    .logo-text {
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: -0.5px;
      margin-left: 6px;
      display: inline-block;
      vertical-align: middle;
    }
    .logo-sub {
      color: #94a3b8;
      font-weight: normal;
      font-size: 14px;
      margin-left: 4px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 16px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #b91c1c;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      font-size: 11px;
      color: ${textLight};
      margin: 0 0 12px 0;
      font-weight: 500;
    }
    .footer-links {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-links a {
      color: ${textLight};
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-links a:hover {
      color: #1f2937;
    }
    .card {
      background-color: #f8fafc;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      padding: 24px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: #e0e7ff;
      color: ${secondaryColor};
      font-size: 11px;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <span class="logo-badge">far</span>
          <span class="logo-text">FindA<span style="color: ${primaryColor};">ROLE.</span><span class="logo-sub">Learn</span></span>
        </div>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p>© 2026 FarFindARole. All rights reserved.</p>
        <p style="color: #94a3b8; font-weight: normal; margin-bottom: 16px;">This email was sent dynamically based on student activity on the FarFindARole Learn platform.</p>
        <div class="footer-links">
          <a href="http://localhost:3000/terms">Terms</a>
          <a href="http://localhost:3000/privacy">Privacy</a>
          <a href="http://localhost:3000/dashboard">Dashboard</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

export function getWelcomeEmail({ userName, courseTitle, startDate, duration }: { userName: string, courseTitle: string, startDate: string, duration: string }): string {
  const content = `
    <span class="badge">Enrollment Confirmed</span>
    <h1>Welcome to Your New Course!</h1>
    <p>Hi ${userName},</p>
    <p>Congratulations on taking the next step in your career journey! You have successfully enrolled in <strong>${courseTitle}</strong>. We are thrilled to have you learn with us.</p>
    
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569;">Course Info</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: ${textLight}; font-weight: 600;">Course Title:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${courseTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: ${textLight}; font-weight: 600;">Start Date:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${startDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: ${textLight}; font-weight: 600;">Course Duration:</td>
          <td style="padding: 6px 0; font-weight: 700; text-align: right; color: #0f172a;">${duration}</td>
        </tr>
      </table>
    </div>

    <p>Click the button below to open your learning workstation and access your first module immediately.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button">Start Learning Now</a>
    </div>
  `
  return getBaseLayout(`Welcome to ${courseTitle}`, content)
}

export function getDurationEmail({ userName, courseTitle, duration, lessonCount, estCompletionTime }: { userName: string, courseTitle: string, duration: string, lessonCount: number, estCompletionTime: string }): string {
  const content = `
    <span class="badge" style="background-color: #ecfdf5; color: #059669;">Syllabus Outline</span>
    <h1>Your Course Breakdown</h1>
    <p>Hi ${userName},</p>
    <p>To help you plan your study sessions, here is a breakdown of the resources and duration for <strong>${courseTitle}</strong>:</p>
    
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569;">Course Metrics</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: ${textLight}; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Lessons:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${lessonCount} modules</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${textLight}; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Estimated Time:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${duration}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: ${textLight}; font-weight: 600;">Completion Commitment:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a;">~${estCompletionTime} hours total</td>
        </tr>
      </table>
    </div>

    <p>Staying organized is the key to success. Try setting a weekly schedule of 2-3 hours to keep your streak active and unlock certificates quickly.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button" style="background-color: ${secondaryColor}; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">View Syllabus</a>
    </div>
  `
  return getBaseLayout(`Syllabus breakdown for ${courseTitle}`, content)
}

export function getCompletionEmail({ userName, courseTitle }: { userName: string, courseTitle: string }): string {
  const content = `
    <span class="badge" style="background-color: #fef3c7; color: #d97706;">Course Completed</span>
    <h1>Congratulations on Graduating!</h1>
    <p>Hi ${userName},</p>
    <p>Woohoo! 🎉 You have officially completed all required modules and exams for <strong>${courseTitle}</strong>!</p>
    <p>This is a major milestone in your career preparation. By completing this syllabus, you have logged key competencies and verified your learning track in the database.</p>
    
    <div class="card" style="text-align: center; background-color: #fefcbf; border-color: #fef3c7;">
      <h2 style="color: #b7791f; margin-bottom: 8px;">🎓 Graduate Status</h2>
      <p style="margin-bottom: 0; font-size: 13px; font-weight: 700; color: #744210;">Verifiable completion is recorded on your profile.</p>
    </div>

    <p>Your graduation certificate is being compiled and is ready for access. Click below to view and download your verifiable credential.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button">Access Certificate</a>
    </div>
  `
  return getBaseLayout(`Congratulations on completing ${courseTitle}!`, content)
}

export function getCertificateEmail({ userName, courseTitle, certUrl }: { userName: string, courseTitle: string, certUrl: string }): string {
  const content = `
    <span class="badge" style="background-color: #ecfdf5; color: #059669;">Credential Issued</span>
    <h1>Your Verifiable Certificate is Here</h1>
    <p>Hi ${userName},</p>
    <p>Your official, cryptographically-secure completion certificate for <strong>${courseTitle}</strong> has been generated and is ready to share.</p>
    
    <div class="card" style="border: 2px dashed #cbd5e1; text-align: center; background-color: #f8fafc;">
      <p style="font-weight: 800; font-size: 16px; margin-bottom: 6px; color: #0f172a;">${courseTitle}</p>
      <p style="font-size: 12px; color: ${textLight}; margin-bottom: 0;">Verified Graduate: ${userName}</p>
    </div>

    <p>Use the link below to download your PDF credential or share your accomplishment directly on LinkedIn to show recruiters your verified skills.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="${certUrl}" class="button" style="background-color: #059669; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">Download Certificate</a>
    </div>
  `
  return getBaseLayout(`Certificate Issued: ${courseTitle}`, content)
}

export function getProgressEmail({ userName, courseTitle, percentage }: { userName: string, courseTitle: string, percentage: number }): string {
  const content = `
    <span class="badge">Milestone Unlocked</span>
    <h1>You're ${percentage}% Completed!</h1>
    <p>Hi ${userName},</p>
    <p>Keep up the amazing work! You have reached a new progress milestone of <strong>${percentage}%</strong> in <strong>${courseTitle}</strong>.</p>
    
    <div class="card">
      <div style="font-weight: 800; font-size: 13px; color: #475569; margin-bottom: 8px; text-transform: uppercase;">Your Progress</div>
      <div style="background-color: #e2e8f0; border-radius: 9999px; height: 16px; overflow: hidden; margin-bottom: 8px;">
        <div style="background-color: ${primaryColor}; width: ${percentage}%; height: 100%; border-radius: 9999px;"></div>
      </div>
      <div style="font-size: 12px; color: ${textLight}; font-weight: 700; text-align: right;">${percentage}% Complete</div>
    </div>

    <p>You are moving closer to unlocking your certificate. Log in today to tackle the remaining lessons and maintain your momentum.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button">Resume Learning</a>
    </div>
  `
  return getBaseLayout(`You reached ${percentage}% in ${courseTitle}!`, content)
}

export function getReminderEmail({ userName, courseTitle, daysInactive }: { userName: string, courseTitle: string, daysInactive: number }): string {
  const content = `
    <span class="badge" style="background-color: #fff1f2; color: #e11d48;">Streaks Warning</span>
    <h1>Ready to jump back in?</h1>
    <p>Hi ${userName},</p>
    <p>We noticed you haven't accessed your course <strong>${courseTitle}</strong> for ${daysInactive} days. Your study schedule is waiting for you!</p>
    
    <p>Consistent learning is the fastest way to build career skills. Logging just 10 minutes today keeps your knowledge fresh and makes lesson milestones much easier to achieve.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button">Resume Course</a>
    </div>
  `
  return getBaseLayout(`Don't lose your streak in ${courseTitle}!`, content)
}

export function getCertificateReadyEmail({ userName, courseTitle, certUrl }: { userName: string, courseTitle: string, certUrl: string }): string {
  const content = `
    <span class="badge" style="background-color: #ecfdf5; color: #059669;">System Notification</span>
    <h1>Your graduation document is ready</h1>
    <p>Hi ${userName},</p>
    <p>This is a quick confirmation that your completion record for <strong>${courseTitle}</strong> is now verified in our database.</p>
    <p>Your graduation credential has been signed off and is available for viewing and sharing.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="${certUrl}" class="button">View Verifiable Document</a>
    </div>
  `
  return getBaseLayout(`Verifiable Graduate Document Available`, content)
}

export function getPurchaseConfirmationEmail({ userName, itemName, amount, transactionId, date }: { userName: string, itemName: string, amount: string, transactionId: string, date: string }): string {
  const content = `
    <span class="badge" style="background-color: #d1fae5; color: #065f46;">Payment Confirmed</span>
    <h1>Your Course Purchase is Confirmed!</h1>
    <p>Hi ${userName},</p>
    <p>Thank you for your purchase! We are excited to have you learning with us. Your invoice has been generated and is attached to this email as a PDF.</p>
    
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569;">Purchase Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Purchased Item:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${itemName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Transaction ID:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Purchase Date:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Total Paid:</td>
          <td style="padding: 8px 0; font-weight: 800; font-size: 16px; text-align: right; color: #dc2626;">${amount}</td>
        </tr>
      </table>
    </div>

    <p>To access your purchase details and start learning, click the button below to go directly to your learning dashboard.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 20px;">
      Have questions? Reply to this email or contact support at <span style="font-weight: 700; color: #4f46e5;">billing@farfindarole.com</span>.
    </p>
  `
  return getBaseLayout(`Your Course Purchase is Confirmed`, content)
}

export function getSubscriptionRenewalEmail({ userName, planName, amount, renewalDate }: { userName: string, planName: string, amount: string, renewalDate: string }): string {
  const content = `
    <span class="badge" style="background-color: #e0f2fe; color: #0369a1;">Upcoming Renewal</span>
    <h1>Subscription Renewal Reminder</h1>
    <p>Hi ${userName},</p>
    <p>This is a friendly reminder that your subscription plan is scheduled to automatically renew soon. No action is required on your part.</p>
    
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569;">Renewal Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Active Plan:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${planName} Plan</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Billing Date:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${renewalDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; font-size: 14px;">Renewal Amount:</td>
          <td style="padding: 8px 0; font-weight: 800; font-size: 16px; text-align: right; color: #4f46e5;">${amount}</td>
        </tr>
      </table>
    </div>

    <p>You can manage, upgrade, or cancel your subscription at any time through your User Billing Settings page.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard/billing" class="button" style="background-color: #4f46e5; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">Manage Subscription</a>
    </div>
  `
  return getBaseLayout(`Subscription Renewal Reminder`, content)
}

export function getFailedPaymentEmail({ userName, planName, amount, attemptNumber }: { userName: string, planName: string, amount: string, attemptNumber: number }): string {
  const content = `
    <span class="badge" style="background-color: #fee2e2; color: #b91c1c;">Payment Failed</span>
    <h1>Action Required: Payment Attempt Failed</h1>
    <p>Hi ${userName},</p>
    <p>We were unable to process your payment for your <strong>${planName}</strong> subscription. This was payment attempt #${attemptNumber}.</p>
    
    <div class="card" style="border: 1px solid #fca5a5; background-color: #fef2f2;">
      <p style="margin-top: 0; font-weight: 700; color: #991b1b; font-size: 14px;">Billing Detail Warning</p>
      <p style="margin-bottom: 0; font-size: 13px; color: #7f1d1d;">
        To prevent interruption to your learning access, please update your billing details and retry the payment as soon as possible.
      </p>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px; margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Subscription Plan:</td>
        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${planName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Declined Amount:</td>
        <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${amount}</td>
      </tr>
    </table>

    <p>Please update your card on file by clicking below. We will automatically retry the card again in 24 hours.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard/billing" class="button" style="background-color: #dc2626; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">Update Billing Details</a>
    </div>
  `
  return getBaseLayout(`Action Required: Subscription Payment Failed`, content)
}

export function getRefundConfirmationEmail({ userName, invoiceNumber, amount, reason }: { userName: string, invoiceNumber: string, amount: string, reason: string }): string {
  const content = `
    <span class="badge" style="background-color: #fef3c7; color: #b45309;">Refund Processed</span>
    <h1>Your Refund Has Been Confirmed</h1>
    <p>Hi ${userName},</p>
    <p>This email confirms that a refund has been successfully processed for your transaction. Depending on your financial institution, it may take 5-10 business days for the funds to appear in your account.</p>
    
    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #475569;">Refund Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Invoice Referenced:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600; border-bottom: 1px solid #f1f5f9;">Refund Amount:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Refund Reason:</td>
          <td style="padding: 8px 0; font-weight: 700; text-align: right; color: #0f172a;">${reason || 'Customer requested refund'}</td>
        </tr>
      </table>
    </div>

    <p>A copy of the refund credit note invoice is attached to this email. If you have any further questions, please let us know.</p>
  `
  return getBaseLayout(`Your Refund Has Been Processed`, content)
}

export function getInvoiceResendEmail({ userName, invoiceNumber }: { userName: string, invoiceNumber: string }): string {
  const content = `
    <span class="badge" style="background-color: #f1f5f9; color: #475569;">Invoice Re-send</span>
    <h1>Your Requested Invoice Copy</h1>
    <p>Hi ${userName},</p>
    <p>As requested, here is a copy of your historical payment invoice <strong>${invoiceNumber}</strong>. The PDF copy is attached directly to this email.</p>
    
    <p>You can also log in to your dashboard to view your entire purchase log and billing settings at any time.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/dashboard/billing" class="button" style="background-color: #475569; box-shadow: 0 4px 6px -1px rgba(71, 85, 105, 0.2);">Go to Billing History</a>
    </div>
  `
  return getBaseLayout(`Invoice Copy: ${invoiceNumber}`, content)
}

export function getPromotionalUpsellEmail({ userName, courseTitle }: { userName: string, courseTitle: string }): string {
  const content = `
    <span class="badge" style="background-color: #fef3c7; color: #d97706;">PRO Promotion</span>
    <h1>Accelerate Your Learning with Student Pro</h1>
    <p>Hi ${userName},</p>
    <p>We noticed you are doing amazing work in <strong>${courseTitle}</strong>! To help you go even faster and verify your skills, upgrade to the <strong>Student Pro</strong> membership plan today.</p>
    
    <div class="card" style="border: 1px solid #fcd34d; background-color: #fffbeb;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #b45309;">Unlock Pro features:</h3>
      <ul style="font-size: 13px; color: #78350f; padding-left: 20px; line-height: 1.6;">
        <li>AI Assistant support and dynamic prompts code checker</li>
        <li>Graduation Certificates for your LinkedIn profile</li>
        <li>Access to Pro-only Advanced Course tracks</li>
        <li>Full AI Practice assessments & Assessment feedbacks</li>
      </ul>
    </div>

    <p>Upgrade now to accelerate your career transition. Click the link below to view our subscription plans.</p>
    
    <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
      <a href="http://localhost:3000/pricing" class="button" style="background-color: #d97706; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2);">Upgrade to Pro</a>
    </div>
  `
  return getBaseLayout(`Unlock certificates and AI features with Student Pro!`, content)
}
