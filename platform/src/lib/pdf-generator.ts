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

  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [ 3 0 R ] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /MediaBox [ 0 0 842 595 ] /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>
endobj
7 0 obj
<< /Length 1500 >>
stream
BT
/F1 12 Tf
40 540 Td
(F A R F I N D A R O L E   L E A R N I N G   A C A D E M Y) Tj
/F1 9 Tf
0 -30 Td
(ON RECOMMENDATION OF THE AUTOMATED EVALUATION BOARD, HEREBY CONFERS THE) Tj
/F2 28 Tf
0 -50 Td
(Certificate of Mastery & Graduation) Tj
/F1 10 Tf
0 -45 Td
(THIS HONORABLE CREDENTIAL IS PROUDLY PRESENTED TO) Tj
/F2 32 Tf
0 -50 Td
(${studentName}) Tj
/F1 11 Tf
0 -40 Td
(for successfully demonstrating expert proficiency, completing all required curriculum modules,) Tj
0 -15 Td
(passing all graded coding challenges, and achieving a passing grade on the final assessment for the course:) Tj
/F1 16 Tf
0 -35 Td
(${courseTitle.toUpperCase()}) Tj
/F1 10 Tf
0 -40 Td
(Accredited and issued on ${issuedAt}) Tj
/F3 9 Tf
0 -50 Td
(CREDENTIAL ID: ${verificationCode}) Tj
/F1 8 Tf
0 -20 Td
(Verify authenticity online at: https://farfindarole-learning.pages.dev/verify/certificate/${verificationCode}) Tj
ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000268 00000 n 
0000000337 00000 n 
0000000411 00000 n 
0000000475 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
2050
%%EOF`;

  return Promise.resolve(Buffer.from(pdfContent, 'utf-8'));
}
