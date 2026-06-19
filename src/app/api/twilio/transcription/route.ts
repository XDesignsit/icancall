import { NextResponse } from 'next/server';
import { sendVoicemailAlertEmail } from '@/lib/mail';
import { findAccountByTwilioNumber } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Parse Twilio standard webhook POST parameters
    const callSid = formData.get('CallSid') || 'Unknown Call';
    const fromNumber = formData.get('From') || 'Unknown Caller';
    const recordingUrl = formData.get('RecordingUrl') || '';
    const transcriptionText = formData.get('TranscriptionText');
    const transcriptionStatus = formData.get('TranscriptionStatus');
    const recordingDuration = formData.get('RecordingDuration') || '0:30';

    console.log('📞 Twilio Webhook Callback Received:', {
      callSid,
      fromNumber,
      recordingUrl,
      transcriptionStatus,
      recordingDuration,
    });

    // Check if transcription is completed (or fallback to recording trigger)
    const transcript = transcriptionText 
      ? String(transcriptionText) 
      : 'Recording captured. Audio transcript is currently processing...';

    // Parse target phone line To number from query params
    const url = new URL(request.url);
    const toPhoneNumber = url.searchParams.get('To');

    let alertRecipient = process.env.SMTP_FROM_EMAIL || 'support@icancall.co';
    let callerLabel = String(fromNumber);

    if (toPhoneNumber) {
      const account = await findAccountByTwilioNumber(toPhoneNumber);
      if (account) {
        // Set email recipient to caregiver's dynamic profile email
        alertRecipient = account.notifyEmail || account.email || alertRecipient;

        // Try to match fromNumber in contacts list
        const fromClean = String(fromNumber).replace(/\D/g, '');
        if (fromClean.length >= 7) {
          const contacts = account.line?.contacts || [];
          const match = contacts.find((c: any) => {
            if (!c.phone) return false;
            const cleanPhone = String(c.phone).replace(/\D/g, '');
            // Match last 10 digits to bypass country prefix matching differences
            return cleanPhone.endsWith(fromClean.slice(-10));
          });

          if (match) {
            callerLabel = `${match.name} (${match.rel || 'Contact'})`;
          }
        }
      }
    }

    // Dispatch the gorgeous Maileroo Voicemail Alert Email instantly!
    const result = await sendVoicemailAlertEmail(
      alertRecipient,
      callerLabel,
      `${recordingDuration} seconds`,
      String(recordingUrl),
      transcript
    );

    if (result.success) {
      console.log(`✉️ Automated Voicemail Alert email dispatched via Maileroo for call ${callSid} to ${alertRecipient}`);
      return NextResponse.json({ success: true, message: 'Voicemail alert dispatched successfully!' });
    } else {
      console.error('❌ Failed to dispatch voicemail email alert:', result.error);
      return NextResponse.json({ success: false, error: 'Email dispatch failure' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Twilio Callback Endpoint Error:', error);
    return NextResponse.json({ error: 'Internal server processing error' }, { status: 500 });
  }
}

// Support GET for basic route checking
export async function GET() {
  return NextResponse.json({ status: 'active', message: 'TwiML Voicemail callback router online.' });
}
