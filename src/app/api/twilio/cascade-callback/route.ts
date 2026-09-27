import { NextResponse } from 'next/server';
import { verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { parseConferenceRoom } from '@/lib/conferenceRoom';
import { callerWaitingAlone, releaseCallerIfAlone, wasLegAccepted } from '@/lib/conferenceBridge';
import { cascadeOrder, parseLeadIndex } from '@/lib/coverageSchedule';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
    let contactIndexStr = requestUrl.searchParams.get('contactIndex');
    let callSid = requestUrl.searchParams.get('CallSid');
    // Schedule-mode calls pin the on-duty contact they rang first (voice route).
    const leadIndex = parseLeadIndex(requestUrl.searchParams.get('lead'));

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          room = formData.get('room')?.toString() || room;
          contactIndexStr = formData.get('contactIndex')?.toString() || contactIndexStr;
          callSid = formData.get('CallSid')?.toString() || callSid;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    const conference = parseConferenceRoom(room);
    const twilioClient = (await import('@/lib/twilio')).default;
    if (!room || !conference || !twilioClient) {
      return new NextResponse('OK');
    }

    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // A leg nobody accepted -- busy, unanswered or failed, or answered by
    // voicemail (or a caregiver who hung up) at agent-join's prompt -- rings the
    // next contact while there is one and the caller is still waiting.
    const accepted = await wasLegAccepted(callSid);
    if (!accepted && (await callerWaitingAlone(twilioClient, room))) {
      const nextIdx = contactIndexStr ? parseInt(contactIndexStr, 10) : 0;
      const activeNumber = conference.lineNumber;
      const account = await findAccountByTwilioNumber(activeNumber);
      const contacts = account?.line?.contacts || [];
      const availableContacts = cascadeOrder(contacts, leadIndex);

      if (nextIdx < availableContacts.length) {
        const nextContact = availableContacts[nextIdx];
        try {
          await twilioClient.calls.create({
            to: nextContact.phone,
            from: activeNumber,
            url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(room)}&screen=1`,
            statusCallback: `${baseUrl}/api/twilio/cascade-callback?room=${encodeURIComponent(room)}&contactIndex=${nextIdx + 1}${leadIndex === null ? '' : `&lead=${leadIndex}`}`,
            statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
            timeout: 15
          });
          return new NextResponse('OK');
        } catch (err) {
          console.error('Failed to call next contact in cascade:', err);
        }
      }
    }

    // The conversation is over (the caregiver hung up, or pressed * and handed
    // the caller on), or there is nobody left to ring and the caller leaves a
    // message. Either way they stay on while anyone else is there for them.
    await releaseCallerIfAlone(twilioClient, { room, endedCallSid: callSid, baseUrl, missed: !accepted });

    return new NextResponse('OK');
  } catch (error) {
    console.error('Cascade Callback Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
