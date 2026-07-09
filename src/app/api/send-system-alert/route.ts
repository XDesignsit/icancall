import { NextResponse } from 'next/server';
import { sendSystemAlertEmail } from '@/lib/mail';
import { rateLimit, verifyTurnstile } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Apply Rate Limiting: max 3 requests per 10 minutes for system alert emails
    const limitResult = await rateLimit(ip, 'system-alert', 3, 600);
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

    const { email, title, severity, message, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers });
    }

    // Verify captchaToken if TURNSTILE_SECRET_KEY is configured
    if (process.env.TURNSTILE_SECRET_KEY && !captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA token is required.' }, { status: 400, headers });
    }

    if (captchaToken) {
      const isValidCaptcha = await verifyTurnstile(captchaToken, ip);
      if (!isValidCaptcha) {
        return NextResponse.json({ error: 'Invalid CAPTCHA validation' }, { status: 400, headers });
      }
    }

    const targetTitle = title || 'Security Warning';
    const targetSeverity = (severity || 'warning') as 'info' | 'warning' | 'critical';
    const targetMessage = message || 'We detected access to your account from an unrecognized IP address.';

    const result = await sendSystemAlertEmail(email, targetTitle, targetSeverity, targetMessage);

    if (result.success) {
      return NextResponse.json(
        { message: 'System alert email sent!', messageId: result.messageId },
        { status: 200, headers }
      );
    } else {
      return NextResponse.json({ error: 'Failed to send system alert email' }, { status: 500, headers });
    }
  } catch (err) {
    console.error('System Alert API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
