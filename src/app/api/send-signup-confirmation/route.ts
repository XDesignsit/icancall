import { NextResponse } from 'next/server';
import { sendWelcomeBillingEmail } from '@/lib/mail';
import { rateLimit, verifyTurnstile } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Apply Rate Limiting: max 3 requests per 10 minutes for email signup confirmations
    const limitResult = await rateLimit(ip, 'signup-confirmation', 3, 600);
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

    const { email, name, planName, price, interval, paymentStatus, phoneNumbersIncluded, captchaToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers });
    }

    // Verify Turnstile CAPTCHA token if it is provided or required
    if (process.env.TURNSTILE_SECRET_KEY && !captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA token is required.' }, { status: 400, headers });
    }

    if (captchaToken) {
      const isValidCaptcha = await verifyTurnstile(captchaToken, ip);
      if (!isValidCaptcha) {
        return NextResponse.json({ error: 'Invalid CAPTCHA validation' }, { status: 400, headers });
      }
    }

    const targetName = name || 'New Customer';
    const targetPlanName = planName || 'Pro Plan';
    const targetPrice = price || '$15.00';
    const targetInterval = interval || 'month';
    const targetStatus = paymentStatus || 'Active (Paid)';
    const targetNumbers = phoneNumbersIncluded || '2 Virtual Lines';

    const result = await sendWelcomeBillingEmail(
      email,
      targetName,
      targetPlanName,
      targetPrice,
      targetInterval,
      targetStatus,
      targetNumbers
    );

    if (result.success) {
      return NextResponse.json(
        { message: 'Signup confirmation email sent!', messageId: result.messageId },
        { status: 200, headers }
      );
    } else {
      return NextResponse.json({ error: 'Failed to send signup confirmation email' }, { status: 500, headers });
    }
  } catch (err) {
    console.error('Signup Confirmation API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}

