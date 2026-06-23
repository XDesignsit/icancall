import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://app.icancall.co';
    const dashboardUrl = `${origin}/dashboard`;

    const result = await sendEmail({
      to: email,
      subject: 'Welcome to iCanCall! 🎉',
      text: `Hi ${name || 'there'},\n\nWelcome to iCanCall! Your account is ready to use. Access your dashboard at:\n\n${dashboardUrl}\n\nBest,\nThe iCanCall Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to iCanCall, ${name || 'there'}! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">We are excited to have you on board. Your transactional mail delivery is now fully configured and live via Maileroo SMTP!</p>
          <div style="margin-top: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Go to Dashboard</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0;" />
          <p style="color: #94a3b8; font-size: 0.875rem;">If you did not request this email, please ignore it.</p>
        </div>
      `,
    });

    if (result.success) {
      return NextResponse.json({ message: 'Email sent successfully!', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: 'Failed to send email via SMTP transporter' }, { status: 500 });
    }
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
