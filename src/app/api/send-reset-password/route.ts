import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, name, resetLink } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetName = name || 'Valued User';
    const targetLink = resetLink || 'https://icancall.co/reset-password?token=simulated_reset_token';

    const result = await sendPasswordResetEmail(email, targetName, targetLink);

    if (result.success) {
      return NextResponse.json({ message: 'Password reset email sent!', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }
  } catch (err) {
    console.error('Password Reset API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
