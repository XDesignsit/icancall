import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/mail';
import { rateLimit } from '@/lib/rateLimit';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Max 5 contact submissions per 10 minutes per IP.
    const limitResult = await rateLimit(ip, 'contact', 5, 600);
    const headers = {
      'X-RateLimit-Limit': limitResult.limit.toString(),
      'X-RateLimit-Remaining': limitResult.remaining.toString(),
      'X-RateLimit-Reset': limitResult.reset.toString(),
    };

    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers }
      );
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide your name, a valid email, and a message.' },
        { status: 400, headers }
      );
    }

    const { name, email, message } = parsed.data;
    const to = process.env.CONTACT_EMAIL || 'support@icancall.co';

    const text =
      `New contact form submission\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n\n` +
      `Message:\n${message}\n`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px;">
        <div style="margin-bottom: 24px;">
          <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: -0.025em;">iCanCall</span>
        </div>
        <h2 style="color: #0f172a; font-size: 1.35rem; font-weight: 700; margin: 0 0 20px 0;">New contact message</h2>
        <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0 0 20px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(email)}</a></p>
        <div style="color: #0f172a; font-size: 0.95rem; line-height: 1.6; padding: 16px 18px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 10px; white-space: pre-wrap;">${escapeHtml(message)}</div>
      </div>`;

    const result = await sendEmail({
      to,
      subject: `New contact message from ${name}`,
      text,
      html,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'We could not send your message right now. Please try again shortly.' },
        { status: 502, headers }
      );
    }

    return NextResponse.json({ success: true }, { status: 200, headers });
  } catch (err) {
    console.error('[Contact API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
