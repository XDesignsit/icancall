import { NextResponse } from 'next/server';
import { verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { claimCallAlert, getCall, recordCallEnded } from '@/lib/callRecords';
import { sendCallAlert } from '@/lib/callAlerts';

export const preferredRegion = 'iad1';

const FINAL_STATUSES = new Set(['completed', 'busy', 'no-answer', 'failed', 'canceled']);

// The numbers' own call-status webhook (set when a number is bought, or by
// ensureCallStatusWebhook): Twilio calls it once the caller's call is over,
// however it ended. It closes the call log row and sends the caregiver's alert
// for a call that was answered or missed. A voicemail alerts from the
// transcription webhook instead, once the transcript is in.
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const callSid = form.get('CallSid')?.toString();
    const callStatus = form.get('CallStatus')?.toString() || '';
    const lineNumber = form.get('To')?.toString() || '';
    const duration = Number(form.get('CallDuration') ?? Number.NaN);
    if (!callSid || !FINAL_STATUSES.has(callStatus)) return new NextResponse('OK');

    // Not a call the voice webhook logged, or a retry of this webhook.
    const call = await getCall(callSid);
    if (!call || call.ended_at) return new NextResponse('OK');

    let status = call.status;
    if (status === 'ringing') {
      // Nobody took the call. If the caller was offered voicemail and left a
      // message, it is a voicemail even when the recording's own webhook has
      // not landed yet -- otherwise they would get a "missed" text first.
      status = call.voicemail_offered_at && (await leftMessage(callSid)) ? 'voicemail' : 'missed';
    }
    const closed = await recordCallEnded(call, {
      status,
      durationSeconds: Number.isFinite(duration) ? duration : null,
    });

    if (closed.status !== 'voicemail') {
      const account = await findAccountByTwilioNumber(lineNumber);
      if (account && (await claimCallAlert(callSid))) {
        const requestUrl = new URL(request.url);
        await sendCallAlert(account, closed, `${requestUrl.protocol}//${requestUrl.host}`);
      }
    }

    return new NextResponse('OK');
  } catch (error) {
    console.error('Call status webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

async function leftMessage(callSid: string): Promise<boolean> {
  const twilioClient = (await import('@/lib/twilio')).default;
  if (!twilioClient) return false;
  try {
    const recordings = await twilioClient.recordings.list({ callSid, limit: 1 });
    return recordings.length > 0;
  } catch (err) {
    console.error(`Could not look up recordings for ${callSid}:`, err);
    return false;
  }
}
