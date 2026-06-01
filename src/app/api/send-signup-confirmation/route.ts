import { NextResponse } from 'next/server';
import { sendWelcomeBillingEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, name, planName, price, interval, paymentStatus, phoneNumbersIncluded } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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
      return NextResponse.json({ message: 'Signup confirmation email sent!', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: 'Failed to send signup confirmation email' }, { status: 500 });
    }
  } catch (err) {
    console.error('Signup Confirmation API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
