const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT;

if (!RESEND_API_KEY) {
  console.error("No RESEND_API_KEY configured.");
  process.exit(1);
}

const target = RESEND_TEST_RECIPIENT || "rchinnarangaswamyreddyr@gmail.com";
console.log(`Sending test email via Resend to ${target}...`);

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'FarFindARole Learn <onboarding@resend.dev>',
    to: target,
    subject: 'Test Email Sending from Platform',
    html: '<p>Hello! The email system is working perfectly. 🎉</p>'
  })
})
.then(async res => {
  const body = await res.text();
  console.log(`Response status: ${res.status}`);
  console.log(`Response body: ${body}`);
  if (res.ok) {
    console.log("✅ Email successfully sent!");
  } else {
    console.error("❌ Email sending failed.");
  }
})
.catch(err => {
  console.error("❌ Network error sending email:", err);
});
