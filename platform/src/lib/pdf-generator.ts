import PDFDocument from 'pdfkit'

export interface InvoicePDFData {
  invoiceNumber: string
  transactionId: string
  date: string
  customerName: string
  customerEmail: string
  billingAddress: string
  itemName: string
  amount: number
  tax: number
  total: number
  paymentMethod: string
}

export interface CertificatePDFData {
  verificationCode: string
  studentName: string
  courseTitle: string
  issuedAt: string
}

/**
 * PDF generation helper that compiles formatted invoices and certificates
 * and saves them directly to local public storage folders.
 */

export function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const chunks: any[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', (err) => {
        reject(err)
      })
      
      // Theme colors
      const primaryColor = '#dc2626' // Red
      const textColor = '#1e293b'
      const lightTextColor = '#64748b'
      
      // Header Logo / Branding
      doc.fillColor(primaryColor)
         .rect(50, 45, 30, 20)
         .fill()
         
      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('FAR', 58, 51)
         
      doc.fillColor(textColor)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('FindA', 90, 48, { continued: true })
         .fillColor(primaryColor)
         .text('ROLE.')
         
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(lightTextColor)
         .text('E-LEARNING PLATFORM', 90, 63)
         
      // Invoice Heading
      doc.fillColor(textColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 400, 45, { align: 'right' })
         
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(lightTextColor)
         .text(`Invoice Number: ${data.invoiceNumber}`, 400, 70, { align: 'right' })
         .text(`Date: ${data.date}`, 400, 82, { align: 'right' })
         
      // Divider
      doc.strokeColor('#e2e8f0')
         .lineWidth(1)
         .moveTo(50, 105)
         .lineTo(545, 105)
         .stroke()
         
      // Company Details vs Customer Details
      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Billing From:', 50, 120)
         .font('Helvetica')
         .text('FarFindARole Learn Ltd.', 50, 135)
         .text('GSTIN: 27AAAAA1111A1Z1', 50, 147)
         .text('billing@farfindarole.com', 50, 159)
         
      doc.font('Helvetica-Bold')
         .text('Billing To:', 300, 120)
         .font('Helvetica')
         .text(data.customerName, 300, 135)
         .text(data.customerEmail, 300, 147)
         .text(data.billingAddress || 'No billing address provided', 300, 159, { width: 245 })
         
      // Table Header
      const tableTop = 230
      doc.fillColor('#f8fafc')
         .rect(50, tableTop, 495, 25)
         .fill()
         
      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Description', 60, tableTop + 8)
         .text('Payment Method', 280, tableTop + 8)
         .text('Amount', 470, tableTop + 8, { align: 'right', width: 65 })
         
      // Table Row
      const rowTop = tableTop + 35
      doc.font('Helvetica')
         .text(data.itemName, 60, rowTop)
         .text(data.paymentMethod || 'Stripe Card', 280, rowTop)
         .text(`Rs. ${data.amount.toFixed(2)}`, 470, rowTop, { align: 'right', width: 65 })
         
      // Divider
      doc.strokeColor('#f1f5f9')
         .moveTo(50, rowTop + 20)
         .lineTo(545, rowTop + 20)
         .stroke()
         
      // Totals
      const totalsTop = rowTop + 40
      doc.fontSize(9)
         .text('Subtotal:', 350, totalsTop, { align: 'right', width: 100 })
         .text(`Rs. ${data.amount.toFixed(2)}`, 470, totalsTop, { align: 'right', width: 65 })
         
         .text('Tax (GST/VAT):', 350, totalsTop + 15, { align: 'right', width: 100 })
         .text(`Rs. ${data.tax.toFixed(2)}`, 470, totalsTop + 15, { align: 'right', width: 65 })
         
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .text('Total Paid:', 350, totalsTop + 35, { align: 'right', width: 100 })
         .text(`Rs. ${data.total.toFixed(2)}`, 470, totalsTop + 35, { align: 'right', width: 65 })
         
      // Transaction Info Footer
      doc.strokeColor('#e2e8f0')
         .lineWidth(1)
         .moveTo(50, 420)
         .lineTo(545, 420)
         .stroke()
         
      doc.fillColor(lightTextColor)
         .fontSize(8)
         .font('Helvetica')
         .text(`Transaction ID: ${data.transactionId || 'N/A'}`, 50, 435)
         .text('Thank you for your purchase and trust in FarFindARole Learn.', 50, 450)
         .text('For support, questions, or refunds, please reach out to billing@farfindarole.com', 50, 462)
         
      doc.end()
      
    } catch (e) {
      reject(e)
    }
  })
}

export function generateCertificatePDF(data: CertificatePDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Horizontal A4 layout (842 x 595 points)
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 })
      const chunks: any[] = []
      
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
      doc.on('error', (err) => {
        reject(err)
      })
      
      // Theme colors
      const bgParchment = '#fdfbf7'
      const navyDark = '#1e1b4b'
      const goldAccent = '#b45309'
      const goldLight = '#fef3c7'
      const slateDark = '#0f172a'
      const slateGray = '#475569'
      const crimsonNavy = '#991b1b'
      
      // 1. Background Fill (Cream Parchment)
      doc.fillColor(bgParchment)
         .rect(0, 0, 842, 595)
         .fill()
         
      // 2. Outer Border (Deep Navy, 4pt)
      doc.strokeColor(navyDark)
         .lineWidth(4)
         .rect(25, 25, 792, 545)
         .stroke()
         
      // 3. Inner Decorative Border (Gold, 1.5pt)
      doc.strokeColor(goldAccent)
         .lineWidth(1.5)
         .rect(33, 33, 776, 529)
         .stroke()
         
      // 4. Corner Ornaments (Gold Squares at the inner intersections)
      doc.fillColor(goldAccent)
         .rect(30, 30, 8, 8).fill()
         .rect(804, 30, 8, 8).fill()
         .rect(30, 557, 8, 8).fill()
         .rect(804, 557, 8, 8).fill()
         
      // 5. Header Brand Label
      doc.fillColor(navyDark)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('F A R F I N D A R O L E   L E A R N I N G   A C A D E M Y', 40, 65, { align: 'center', width: 762, characterSpacing: 2.5 })
         
      doc.fillColor(slateGray)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text('ON RECOMMENDATION OF THE AUTOMATED EVALUATION BOARD, HEREBY CONFERS THE', 40, 88, { align: 'center', width: 762, characterSpacing: 1.2 })
         
      // 6. Main Title
      doc.fillColor(slateDark)
         .fontSize(30)
         .font('Times-BoldItalic')
         .text('Certificate of Mastery & Graduation', 40, 112, { align: 'center', width: 762 })
         
      // 7. Presented To Section
      doc.fillColor(goldAccent)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('THIS HONORABLE CREDENTIAL IS PROUDLY PRESENTED TO', 40, 172, { align: 'center', width: 762, characterSpacing: 1.5 })
         
      // 8. Graduate Name (Crimson, Large Serif)
      doc.fillColor(crimsonNavy)
         .fontSize(34)
         .font('Times-Bold')
         .text(data.studentName, 40, 198, { align: 'center', width: 762 })
         
      // Gold Name Underline
      doc.strokeColor(goldAccent)
         .lineWidth(1)
         .moveTo(250, 242)
         .lineTo(592, 242)
         .stroke()
         
      // 9. Certificate Body Text
      doc.fillColor(slateGray)
         .fontSize(11)
         .font('Helvetica-Oblique')
         .text('for successfully demonstrating expert proficiency, completing all required curriculum modules, passing all graded coding challenges, and achieving a passing grade on the final assessment for the course', 96, 260, { align: 'center', width: 650, lineGap: 4 })
         
      // 10. Course Title Capsule
      // Draw background capsule
      doc.fillColor('#eef2ff')
         .roundedRect(121, 320, 600, 36, 6)
         .fill()
         
      // Render text inside capsule
      doc.fillColor('#312e81')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(data.courseTitle.toUpperCase(), 130, 331, { align: 'center', width: 580 })
         
      // 11. Issuing Date
      doc.fillColor(slateGray)
         .fontSize(9.5)
         .font('Helvetica')
         .text(`Accredited and issued on ${data.issuedAt}`, 40, 380, { align: 'center', width: 762 })
         
      // 12. Elegant Gold Seal at bottom center
      const centerX = 421
      const centerY = 445
      // Outer gold circle
      doc.strokeColor(goldAccent)
         .lineWidth(1.5)
         .circle(centerX, centerY, 26)
         .stroke()
      // Inner filled circle
      doc.fillColor(goldLight)
         .circle(centerX, centerY, 22)
         .fill()
      // Inner circle gold border
      doc.strokeColor(goldAccent)
         .lineWidth(1)
         .circle(centerX, centerY, 22)
         .stroke()
      // Text inside seal
      doc.fillColor(goldAccent)
         .fontSize(8)
         .font('Helvetica-Bold')
         .text('★ SECURE ★', centerX - 50, centerY - 4, { align: 'center', width: 100 })
         
      // 13. Cursive Signatures Layout
      // Left Signature (Academic Board)
      doc.strokeColor('#cbd5e1')
         .lineWidth(1)
         .moveTo(130, 470)
         .lineTo(290, 470)
         .stroke()
         
      doc.fillColor(navyDark)
         .fontSize(15)
         .font('Times-Italic')
         .text('FarFindARole Board', 130, 448, { align: 'center', width: 160 })
         
      doc.fillColor(slateDark)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Academic Board Chair', 130, 478, { align: 'center', width: 160 })
         
      doc.fillColor(slateGray)
         .fontSize(7)
         .font('Helvetica')
         .text('VERIFIED CURRICULUM AUDIT', 130, 490, { align: 'center', width: 160 })
         
      // Right Signature (AI Agent Evaluator)
      doc.strokeColor('#cbd5e1')
         .lineWidth(1)
         .moveTo(552, 470)
         .lineTo(712, 470)
         .stroke()
         
      doc.fillColor(navyDark)
         .fontSize(15)
         .font('Times-Italic')
         .text('AI Agent Evaluator', 552, 448, { align: 'center', width: 160 })
         
      doc.fillColor(slateDark)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('Automated Grading System', 552, 478, { align: 'center', width: 160 })
         
      doc.fillColor(slateGray)
         .fontSize(7)
         .font('Helvetica')
         .text('CRYPTOGRAPHIC CODE CHECK', 552, 490, { align: 'center', width: 160 })
         
      // 14. Monospace Cryptographic Verification Footer
      doc.fillColor(slateGray)
         .fontSize(8)
         .font('Courier-Bold')
         .text(`CREDENTIAL ID: ${data.verificationCode}`, 40, 528, { align: 'center', width: 762 })
         
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      doc.fillColor('#64748b')
         .fontSize(7.5)
         .font('Helvetica')
         .text(`Verify authenticity online at: ${appUrl}/verify/certificate/${data.verificationCode}`, 40, 542, { align: 'center', width: 762 })
         
      doc.end()
      
    } catch (e) {
      reject(e)
    }
  })
}

