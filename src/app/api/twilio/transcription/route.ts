import { NextResponse } from 'next/server';
import { sendVoicemailAlertEmail } from '@/lib/mail';
import { findAccountByTwilioNumber } from '@/lib/db';

export const preferredRegion = 'iad1';

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
    let account = null;

    if (toPhoneNumber) {
      account = await findAccountByTwilioNumber(toPhoneNumber);
      if (account) {
        // Check if Missed Call Notifications toggle is enabled
        const lineSettings = account.line?.settings || {};
        const notifMissed = lineSettings.notifMissed ?? true;
        if (!notifMissed) {
          console.log(`✉️ Voicemail email notification skipped for call ${callSid} to ${account.email} because Missed Call Notifications toggle is disabled.`);
          return NextResponse.json({ success: true, message: 'Voicemail alert skipped (disabled in settings)' });
        }

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

      // Try sending SMS alert if notifSMS is enabled
      if (account) {
        const lineSettings = account.line?.settings || {};
        const notifSMS = lineSettings.notifSMS ?? true;
        const smsPhone = account.smsPhone;

        if (notifSMS && smsPhone) {
          try {
            const { sendSms } = await import('@/lib/twilio');
            // Clean/truncate transcript to fit nicely in an SMS if it's very long
            const cleanTranscript = transcript.length > 120
              ? `${transcript.substring(0, 117)}...`
              : transcript;
            const smsBody = `iCanCall Voicemail Alert: New message from ${callerLabel} (${recordingDuration}s). Transcript: "${cleanTranscript}"`;
            await sendSms(smsPhone, smsBody);
            console.log(`💬 Automated Voicemail Alert SMS sent to ${smsPhone}`);
          } catch (smsError) {
            console.error('❌ Failed to dispatch voicemail SMS alert:', smsError);
          }
        }
      }

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
