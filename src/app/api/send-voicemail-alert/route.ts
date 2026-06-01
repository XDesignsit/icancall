import { NextResponse } from 'next/server';
import { sendVoicemailAlertEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, callerName, duration, recordingLink, transcription } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const targetCaller = callerName || 'Unknown Caller';
    const targetDuration = duration || '0:30';
    const targetLink = recordingLink || 'https://icancall.co/recordings/sample.mp3';
    const targetTranscription = transcription || 'Please review this new voicemail in your account dashboard.';

    const result = await sendVoicemailAlertEmail(email, targetCaller, targetDuration, targetLink, targetTranscription);

    if (result.success) {
      return NextResponse.json({ message: 'Voicemail alert email sent!', messageId: result.messageId });
    } else {
      return NextResponse.json({ error: 'Failed to send voicemail alert email' }, { status: 500 });
    }
  } catch (err) {
    console.error('Voicemail Alert API Error:', err);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
