import { NextResponse } from 'next/server';
import { sendVoicemailAlertEmail } from '@/lib/mail';
import { rateLimit, verifyTurnstile } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Apply Rate Limiting: max 3 requests per 10 minutes for voicemail alert emails
    const limitResult = await rateLimit(ip, 'voicemail-alert', 3, 600);
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

    const { email, callerName, duration, recordingLink, transcription, captchaToken } = await request.json();

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

    const targetCaller = callerName || 'Unknown Caller';
    const targetDuration = duration || '0:30';
    const targetLink = recordingLink || 'https://icancall.co/recordings/sample.mp3';
    const targetTranscription = transcription || 'Please review this new voicemail in your account dashboard.';

    const result = await sendVoicemailAlertEmail(email, targetCaller, targetDuration, targetLink, targetTranscription);

    if (result.success) {
      return NextResponse.json(
        { message: 'Voicemail alert email sent!', messageId: result.messageId },
        { status: 200, headers }
      );
    } else {
      return NextResponse.json({ error: 'Failed to send voicemail alert email' }, { status: 500, headers });
    }
  } catch (err) {
    console.error('Voicemail Alert API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
