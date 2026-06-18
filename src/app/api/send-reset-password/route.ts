import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/mail';
import { rateLimit, verifyTurnstile } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Apply Rate Limiting: max 3 requests per 10 minutes for password reset emails
    const limitResult = await rateLimit(ip, 'reset-password', 3, 600);
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

    const { email, name, resetLink, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers });
    }

    if (captchaToken) {
      const isValidCaptcha = await verifyTurnstile(captchaToken, ip);
      if (!isValidCaptcha) {
        return NextResponse.json({ error: 'Invalid CAPTCHA validation' }, { status: 400, headers });
      }
    }

    const targetName = name || 'Valued User';
    const targetLink = resetLink || 'https://icancall.co/reset-password?token=simulated_reset_token';

    const result = await sendPasswordResetEmail(email, targetName, targetLink);

    if (result.success) {
      return NextResponse.json(
        { message: 'Password reset email sent!', messageId: result.messageId },
        { status: 200, headers }
      );
    } else {
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500, headers });
    }
  } catch (err) {
    console.error('Password Reset API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}

