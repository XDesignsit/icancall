import { NextResponse } from 'next/server';
import { ttsPlayTag, verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { claimCallAlert, recordTranscript, recordVoicemail, type CallRow } from '@/lib/callRecords';
import { sendCallAlert } from '@/lib/callAlerts';

export const preferredRegion = 'iad1';

// The voicemail <Record> reports here twice (voice webhook):
//  - kind=recording, its action, as soon as the caller finishes. The call log
//    gets the recording, and the caller hears a goodbye -- this answer is
//    TwiML they are still on the line for.
//  - kind=transcript, its transcribeCallback, when the transcript is ready
//    (or transcription failed). The caregiver's voicemail alert goes out
//    then, once, transcript included.
// Records made before the kind parameter tell the two apart by whether
// Twilio sent a TranscriptionStatus.
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request, { telnyx: true });
  if (denied) return denied;

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const lineNumber = url.searchParams.get('To') || '';

  try {
    const form = await request.formData();
    const callSid = form.get('CallSid')?.toString() || '';
    const recordingUrl = form.get('RecordingUrl')?.toString() || '';
    const transcriptionStatus = form.get('TranscriptionStatus')?.toString() || '';
    const kind = url.searchParams.get('kind') || (transcriptionStatus ? 'transcript' : 'recording');
    const account = lineNumber ? await findAccountByTwilioNumber(lineNumber) : undefined;

    if (kind === 'recording') {
      const seconds = Number(form.get('RecordingDuration') || 0);
      // A recording with nothing in it is a caller who hung up at the beep:
      // the call stays a missed call.
      if (callSid && recordingUrl && seconds > 0) await recordVoicemail(callSid, recordingUrl, seconds);

      const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${ttsPlayTag(baseUrl, 'Thank you. Your message has been sent. Goodbye.', voiceId)}
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    const transcriptText = form.get('TranscriptionText')?.toString().trim() || null;
    const transcript = transcriptionStatus === 'completed' ? transcriptText : null;
    console.log(`Voicemail transcript for ${callSid}: ${transcriptionStatus || 'unknown'}`);
    if (!callSid || !account) return new NextResponse('OK');

    const logged = await recordTranscript(callSid, transcript);
    if (logged) {
      if (await claimCallAlert(callSid)) await sendCallAlert(account, logged);
    } else {
      // A call the log never saw (it came in before the call log existed):
      // this webhook fires once per message, so alert from what it carries.
      const unlogged: CallRow = {
        call_sid: callSid,
        line_id: account.line?.id || '',
        from_number: form.get('From')?.toString() || null,
        status: 'voicemail',
        answered_by: null,
        answered_rel: null,
        answered_at: null,
        voicemail_offered_at: null,
        recording_url: recordingUrl || null,
        recording_seconds: null,
        transcript,
        duration_seconds: null,
        talk_seconds: null,
        started_at: new Date().toISOString(),
        ended_at: null,
        alerted_at: null,
      };
      await sendCallAlert(account, unlogged);
    }
    return new NextResponse('OK');
  } catch (error) {
    console.error('Voicemail webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

// Support GET for basic route checking
export async function GET() {
  return NextResponse.json({ status: 'active', message: 'TwiML Voicemail callback router online.' });
}
