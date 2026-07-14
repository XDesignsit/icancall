import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || 'May 1, 2026';
    const desc = searchParams.get('desc') || 'Pro Plan - Monthly';
    const amount = searchParams.get('amount') || '$24.99';
    const last4 = searchParams.get('last4') || '4242';

    // Parse the date to form a consistent invoice ID
    const dateSlug = date.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const invoiceId = `INV-${dateSlug}-4829`;

    // Construct the text content in PDF stream syntax.
    // Tj prints text, Td moves the cursor. We keep lines and sizes clear.
    const streamContent = `BT
/F1 20 Tf
0.22 0.44 0.88 rg
70 720 Td
(iCanCall) Tj
0 0 0 rg
/F1 10 Tf
0.4 0.4 0.4 rg
0 -20 Td
(Virtual Phone Routing for Loved Ones) Tj
0 -10 Td
(support@icancall.co | https://icancall.co) Tj
0 0 0 rg
/F1 16 Tf
0 -50 Td
(RECEIPT / INVOICE) Tj
/F1 10 Tf
0 -30 Td
(Invoice Number: ${invoiceId}) Tj
0 -15 Td
(Date: ${date}) Tj
0 -15 Td
(Payment Status: PAID) Tj
0 -40 Td
/F1 12 Tf
(Billed To:) Tj
/F1 10 Tf
0 -18 Td
(Caregiver Dashboard Account) Tj
0 -12 Td
(Visa ending in ${last4}) Tj
0 -50 Td
/F1 12 Tf
(Description) Tj
250 0 Td
(Amount) Tj
-250 -20 Td
/F1 10 Tf
(${desc}) Tj
250 0 Td
(${amount}) Tj
-250 -40 Td
/F1 12 Tf
(Total Paid) Tj
250 0 Td
(${amount}) Tj
-250 -60 Td
/F1 10 Tf
(Thank you for securing your family with iCanCall!) Tj
ET`;

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];

    const addObj = (str: string) => {
      offsets.push(pdf.length);
      pdf += str + '\n';
    };

    addObj(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`);

    addObj(`2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj`);

    addObj(`3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj`);

    addObj(`4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >>
endobj`);

    addObj(`5 0 obj
<< /Length ${streamContent.length} >>
stream
${streamContent}
endstream
endobj`);

    const startXref = pdf.length;
    pdf += 'xref\n';
    pdf += `0 ${offsets.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (const offset of offsets) {
      pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += 'trailer\n';
    pdf += `<< /Size ${offsets.length + 1} /Root 1 0 R >>\n`;
    pdf += 'startxref\n';
    pdf += `${startXref}\n`;
    pdf += '%%EOF\n';

    const pdfBuffer = Buffer.from(pdf, 'utf-8');

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="receipt.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Failed to generate PDF receipt:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
