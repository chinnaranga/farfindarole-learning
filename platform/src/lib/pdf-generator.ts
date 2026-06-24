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
 * Pure JavaScript, dependency-free PDF generator.
 * Generates valid PDF documents directly as binary Buffers.
 * This is 100% compatible with V8 Isolates (Edge Runtime/Cloudflare Workers)
 * as it does not import Node.js 'stream', 'fs', or any native modules.
 */

export function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const sanitize = (str: string) => (str || '').replace(/[()]/g, '');
  const customerName = sanitize(data.customerName);
  const customerEmail = sanitize(data.customerEmail);
  const invoiceNumber = sanitize(data.invoiceNumber);
  const transactionId = sanitize(data.transactionId);
  const itemName = sanitize(data.itemName);
  const paymentMethod = sanitize(data.paymentMethod);
  const billingAddress = sanitize(data.billingAddress);

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /MediaBox [ 0 0 595 842 ] /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 1200 >>
stream
BT
/F1 16 Tf
50 780 Td
(FARFindARole - E-LEARNING PLATFORM) Tj
/F2 10 Tf
0 -20 Td
(FarFindARole Learn Ltd. | GSTIN: 27AAAAA1111A1Z1) Tj
0 -12 Td
(billing@farfindarole.com) Tj
/F1 20 Tf
350 32 Td
(INVOICE) Tj
/F2 9 Tf
0 -15 Td
(Invoice Number: ${invoiceNumber}) Tj
0 -12 Td
(Date: ${data.date}) Tj
/F1 10 Tf
-350 -45 Td
(BILL TO:) Tj
/F2 10 Tf
0 -15 Td
(${customerName}) Tj
0 -12 Td
(${customerEmail}) Tj
0 -12 Td
(Address: ${billingAddress}) Tj
/F1 10 Tf
120 39 Td
(TRANSACTION INFO:) Tj
/F2 10 Tf
0 -15 Td
(Transaction ID: ${transactionId}) Tj
0 -12 Td
(Payment Method: ${paymentMethod}) Tj
/F1 10 Tf
-120 -80 Td
(Description) Tj
200 0 Td
(Payment Method) Tj
150 0 Td
(Amount) Tj
-350 -8 Td
(_____________________________________________________________________________________) Tj
/F2 10 Tf
0 -20 Td
(${itemName}) Tj
200 0 Td
(${paymentMethod}) Tj
150 0 Td
(Rs. ${data.amount.toFixed(2)}) Tj
-350 -10 Td
(_____________________________________________________________________________________) Tj
/F2 10 Tf
220 -30 Td
(Subtotal: ) Tj
130 0 Td
(Rs. ${data.amount.toFixed(2)}) Tj
-350 -15 Td
(Tax (GST/VAT): ) Tj
130 0 Td
(Rs. ${data.tax.toFixed(2)}) Tj
-350 -20 Td
(Total Paid: ) Tj
130 0 Td
(Rs. ${data.total.toFixed(2)}) Tj
-350 -50 Td
(Thank you for your purchase and trust in FarFindARole Learn.) Tj
0 -15 Td
(For support, questions, or refunds, please reach out to billing@farfindarole.com) Tj
ET
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000257 00000 n 
0000000326 00000 n 
0000000390 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
1650
%%EOF`;

  return Promise.resolve(Buffer.from(pdfContent, 'utf-8'));
}

export function generateCertificatePDF(data: CertificatePDFData): Promise<Buffer> {
  const sanitize = (str: string) => (str || '').replace(/[()]/g, '');
  const studentName = sanitize(data.studentName);
  const courseTitle = sanitize(data.courseTitle);
  const verificationCode = sanitize(data.verificationCode);
  const issuedAt = sanitize(data.issuedAt);

  // Dynamic text centering helpers
  const getXForCenteredText = (text: string, fontSize: number, fontType: 'helvetica' | 'times' | 'courier') => {
    const factor = fontType === 'courier' ? 0.6 : (fontType === 'times' ? 0.48 : 0.52);
    const textWidth = text.length * fontSize * factor;
    return Math.round((842 - textWidth) / 2);
  };

  const drawCenteredText = (
    text: string,
    y: number,
    fontSize: number,
    fontName: string,
    fontType: 'helvetica' | 'times' | 'courier',
    colorRgb = '0.08 0.12 0.24'
  ) => {
    const x = getXForCenteredText(text, fontSize, fontType);
    return `BT\n/${fontName} ${fontSize} Tf\n${colorRgb} rg\n${x} ${y} Td\n(${text}) Tj\nET`;
  };

  const drawSignatureText = (
    text: string,
    centerX: number,
    y: number,
    fontSize: number,
    fontName: string,
    fontType: 'helvetica' | 'times' | 'courier',
    colorRgb = '0.08 0.12 0.24'
  ) => {
    const factor = fontType === 'courier' ? 0.6 : (fontType === 'times' ? 0.48 : 0.52);
    const textWidth = text.length * fontSize * factor;
    const x = Math.round(centerX - textWidth / 2);
    return `BT\n/${fontName} ${fontSize} Tf\n${colorRgb} rg\n${x} ${y} Td\n(${text}) Tj\nET`;
  };

  // Vector graphics drawing instructions
  const graphicsInstructions = [
    // 1. Fill background with cream color
    '0.99 0.98 0.95 rg',
    '0 0 842 595 re',
    'f',
    // 2. Draw dark navy outer border
    '0.08 0.12 0.24 RG',
    '4 w',
    '30 30 782 535 re',
    's',
    // 3. Draw gold inner border
    '0.76 0.60 0.33 RG',
    '1.5 w',
    '38 38 766 519 re',
    's',
    // 4. Corner ornaments (gold L-shapes)
    '0.76 0.60 0.33 RG',
    '2 w',
    '45 542 m 65 542 l 45 542 m 45 522 l s',
    '797 542 m 777 542 l 797 542 m 797 522 l s',
    '45 53 m 65 53 l 45 53 m 45 73 l s',
    '797 53 m 777 53 l 797 53 m 797 73 l s',
    // 5. Gold divider line under title
    '0.76 0.60 0.33 RG',
    '1 w',
    '250 420 m 592 420 l s',
    // 6. Signatures lines
    '0.08 0.12 0.24 RG',
    '1 w',
    '120 120 m 280 120 l s',
    '562 120 m 722 120 l s',
    // 7. Golden seal octagon at bottom center
    '0.76 0.60 0.33 rg',
    '403 115 m 409 127 l 421 133 l 433 127 l 439 115 l 433 103 l 421 97 l 409 103 l h f',
    // 8. Golden seal ribbons
    '0.76 0.60 0.33 rg',
    '415 97 m 405 70 l 412 70 l 421 90 l h f',
    '427 97 m 437 70 l 430 70 l 421 90 l h f'
  ].join('\n');

  // Text strings and positioning instructions
  const textInstructions = [
    drawCenteredText('F A R F I N D A R O L E   L E A R N I N G   A C A D E M Y', 500, 11, 'F2', 'helvetica'),
    drawCenteredText('ON RECOMMENDATION OF THE AUTOMATED EVALUATION BOARD, HEREBY CONFERS THE', 470, 8, 'F1', 'helvetica', '0.3 0.3 0.3'),
    drawCenteredText('Certificate of Mastery & Graduation', 432, 26, 'F6', 'times'),
    drawCenteredText('THIS HONORABLE CREDENTIAL IS PROUDLY PRESENTED TO', 390, 9, 'F1', 'helvetica', '0.3 0.3 0.3'),
    
    // Student Name (large, elegant)
    drawCenteredText(studentName, 340, 30, 'F3', 'times', '0.08 0.12 0.24'),
    
    // Description paragraphs
    drawCenteredText('for successfully demonstrating expert proficiency, completing all required curriculum modules,', 295, 10, 'F5', 'times', '0.2 0.2 0.2'),
    drawCenteredText('passing all graded coding challenges, and achieving a passing grade on the final assessment for the course:', 280, 10, 'F5', 'times', '0.2 0.2 0.2'),
    
    // Course Title (bold, highlighted)
    drawCenteredText(courseTitle.toUpperCase(), 240, 16, 'F2', 'helvetica', '0.08 0.12 0.24'),
    
    // Issue date
    drawCenteredText(`Accredited and issued on ${issuedAt}`, 205, 10, 'F5', 'times', '0.2 0.2 0.2'),
    
    // Signature blocks
    drawSignatureText('R. C. Reddy', 200, 128, 13, 'F3', 'times', '0.08 0.12 0.24'),
    drawSignatureText('Certified AI Auditor', 642, 128, 11, 'F3', 'times', '0.08 0.12 0.24'),
    drawSignatureText('Director of Academics', 200, 105, 8, 'F1', 'helvetica', '0.4 0.4 0.4'),
    drawSignatureText('Automated Evaluation Board', 642, 105, 8, 'F1', 'helvetica', '0.4 0.4 0.4'),
    
    // Credential verification info
    drawCenteredText(`CREDENTIAL ID: ${verificationCode}`, 62, 8, 'F4', 'courier', '0.3 0.3 0.3'),
    drawCenteredText(`Verify authenticity online at: https://farfindarole-learning.pages.dev/verify/certificate/${verificationCode}`, 50, 7, 'F1', 'helvetica', '0.4 0.4 0.4')
  ].join('\n');

  const streamContent = `${graphicsInstructions}\n${textInstructions}`;

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R /F5 8 0 R /F6 9 0 R >> >> /MediaBox [ 0 0 842 595 ] /Contents 10 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>
endobj
8 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>
endobj
9 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>
endobj
10 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj
xref
0 11
0000000000 65535 f 
trailer
<< /Size 11 /Root 1 0 R >>
startxref
2050
%%EOF`;

  return Promise.resolve(Buffer.from(pdfContent, 'utf-8'));
}
