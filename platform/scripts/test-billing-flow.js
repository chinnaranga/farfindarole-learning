import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

// Manually parse .env.local
const __filename = new URL(import.meta.url).pathname;
const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));
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
const RESEND_TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT || "rchinnarangaswamyreddyr@gmail.com";

// ── 1. GENERATE INVOICE PDF ──
function generateInvoice() {
  console.log("Generating test invoice PDF...");
  const storageDir = path.join(__dirname, '../public/storage/invoices');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const fileName = 'invoice_TEST-9999.pdf';
  const filePath = path.join(storageDir, fileName);
  
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Red/Indigo aesthetic
  doc.fillColor('#dc2626').rect(50, 45, 30, 20).fill();
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('FAR', 58, 51);
  
  doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('FindA', 90, 48, { continued: true })
     .fillColor('#dc2626').text('ROLE.');

  doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('E-LEARNING PLATFORM', 90, 63);
  doc.fillColor('#1e293b').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 45, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#64748b')
     .text('Invoice Number: TEST-9999', 400, 70, { align: 'right' })
     .text(`Date: ${new Date().toLocaleDateString()}`, 400, 82, { align: 'right' });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 105).lineTo(545, 105).stroke();

  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Billing From:', 50, 120)
     .font('Helvetica').text('FarFindARole Learn Ltd.', 50, 135).text('GSTIN: 27AAAAA1111A1Z1', 50, 147);

  doc.font('Helvetica-Bold').text('Billing To:', 300, 120)
     .font('Helvetica').text('Test Scholar', 300, 135).text(RESEND_TEST_RECIPIENT, 300, 147);

  // Table items
  const tableTop = 230;
  doc.fillColor('#f8fafc').rect(50, tableTop, 495, 25).fill();
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('Description', 60, tableTop + 8)
     .text('Amount', 470, tableTop + 8, { align: 'right', width: 65 });

  doc.font('Helvetica').text('Student Pro Membership - Monthly', 60, tableTop + 35)
     .text('Rs. 799.00', 470, tableTop + 35, { align: 'right', width: 65 });

  doc.strokeColor('#f1f5f9').moveTo(50, tableTop + 55).lineTo(545, tableTop + 55).stroke();

  // Totals
  doc.text('Subtotal:', 350, tableTop + 75, { align: 'right', width: 100 })
     .text('Rs. 799.00', 470, tableTop + 75, { align: 'right', width: 65 });
  doc.font('Helvetica-Bold').text('Total Paid:', 350, tableTop + 95, { align: 'right', width: 100 })
     .text('Rs. 799.00', 470, tableTop + 95, { align: 'right', width: 65 });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 420).lineTo(545, 420).stroke();
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
     .text('Transaction ID: tx_test_9999', 50, 435)
     .text('Thank you for your purchase and trust in FarFindARole Learn.', 50, 450);

  doc.end();

  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`✅ Test invoice generated at: ${filePath}`);
      resolve(filePath);
    });
  });
}

// ── 2. SEND TEST EMAIL ──
async function sendEmail(invoicePath) {
  if (!RESEND_API_KEY) {
    console.warn("⚠️ No RESEND_API_KEY configured. Skipping email dispatch step.");
    return;
  }

  console.log(`Dispatching test email to ${RESEND_TEST_RECIPIENT}...`);
  const pdfBase64 = fs.readFileSync(invoicePath).toString('base64');

  const html = `
    <h1>Your Purchase Confirmation</h1>
    <p>Thank you for buying! Your invoice copy TEST-9999 has been generated and is attached to this email.</p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FarFindARole Learn <onboarding@resend.dev>',
        to: RESEND_TEST_RECIPIENT,
        subject: 'Purchase Confirmed: Invoice TEST-9999',
        html: html,
        attachments: [{
          content: pdfBase64,
          filename: 'Invoice_TEST-9999.pdf',
          type: 'application/pdf'
        }]
      })
    });

    const body = await res.json();
    console.log("Resend API response:", body);
    if (res.ok) {
      console.log("✅ Email sent successfully with attachment!");
    } else {
      console.error("❌ Email dispatch failed:", body);
    }
  } catch (err) {
    console.error("❌ Network error sending email:", err);
  }
}

async function run() {
  const path = await generateInvoice();
  await sendEmail(path);
}

run();
