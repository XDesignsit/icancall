import { NextResponse } from 'next/server';
import { sendSystemAlertEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, title, severity, message } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetTitle = title || 'Security Warning';
    const targetSeverity = (severity || 'warning') as 'info' | 'warning' | 'critical';
    const targetMessage = message || 'We detected access to your account from an unrecognized IP address.';

    const result = await sendSystemAlertEmail(email, targetTitle, targetSeverity, targetMessage);

    if (result.success) {
      return NextResponse.json({ message: 'System alert email sent!', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: 'Failed to send system alert email' }, { status: 500 });
    }
  } catch (err) {
    console.error('System Alert API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
