import { NextResponse } from 'next/server';
import { ttsPlayTag, verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { parseConferenceRoom } from '@/lib/conferenceRoom';
import { callerStillThere, firstAcceptedLeg, markLegAccepted, stopPlacedLegs } from '@/lib/conferenceBridge';
import { recordCallAnswered } from '@/lib/callRecords';
import { toE164 } from '@/lib/phone';

export const preferredRegion = 'iad1';

// Runs when a caregiver leg is answered. Legs placed with screen=1 (cascade and
// simultaneous ringing) first ask for a key press, because carrier voicemail
// answers a call exactly like a person does: without the prompt it would join
// the conference, take the caller, and stop the cascade. Nobody pressing a key
// ends the leg unjoined, and its status callback moves on to the next contact
// or takes a message. A key press is recorded before joining, so the callback
// knows the leg reached the caller (conferenceBridge).
// Transfer legs skip the prompt: the caregiver chose that person, and their
// voicemail is a fair place for the caller to land.
// A key press that comes too late -- another contact accepted first (All Ring),
// or the caller has hung up -- is told so instead of joining an empty room.
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
    const screen = requestUrl.searchParams.get('screen') === '1';
    const accepted = requestUrl.searchParams.get('accepted') === '1';
    let callSid = requestUrl.searchParams.get('CallSid');
    let legTo = requestUrl.searchParams.get('To');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          room = formData.get('room')?.toString() || room;
          callSid = formData.get('CallSid')?.toString() || callSid;
          legTo = formData.get('To')?.toString() || legTo;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    // The name is echoed into TwiML below, so only accept one the voice webhook built.
    const conference = parseConferenceRoom(room);
    if (!room || !conference) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: No conference room specified.</Say></Response>', {
        status: 400,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    let twiml: string;
    if (screen && !accepted) {
      // Any key accepts (finishOnKey="" makes # and * count too); the Gather
      // posts back here with accepted=1. Silence falls through to the hangup.
      const account = await findAccountByTwilioNumber(conference.lineNumber);
      const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
      const prompt = ttsPlayTag(baseUrl, "Incoming call from your family's iCanCall line. Press 1 to accept.", voiceId);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" finishOnKey="" timeout="5" action="/api/twilio/agent-join?room=${encodeURIComponent(room)}&amp;accepted=1" method="POST">
    ${prompt}
    <Pause length="1"/>
    ${prompt}
  </Gather>
  <Hangup/>
</Response>`;
    } else {
      // From here on this leg has reached the caller: when it ends, the
      // conversation is over rather than the next contact being due. The call
      // log names whoever this leg rang.
      if (accepted && callSid) {
        const account = await findAccountByTwilioNumber(conference.lineNumber);
        const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
        const twilioClient = (await import('@/lib/twilio')).default;

        // All Ring rings everyone at once: the first to accept takes the call
        // and the rest stop ringing. The acceptance is recorded before asking
        // who was first, so two people pressing at once cannot both win.
        await markLegAccepted(callSid, room);
        const [first, callerThere] = await Promise.all([
          firstAcceptedLeg(room),
          twilioClient ? callerStillThere(twilioClient, room) : Promise.resolve(true),
        ]);
        const farewell = first && first !== callSid
          ? 'Another family member has already answered this call. Thank you.'
          : !callerThere
            ? 'Sorry, the caller has already hung up.'
            : null;
        if (farewell) {
          return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${ttsPlayTag(baseUrl, farewell, voiceId)}
  <Hangup/>
</Response>`, { headers: { 'Content-Type': 'application/xml' } });
        }

        const dialed = toE164(legTo);
        const contact = account?.line?.contacts.find((c) => c.phone && toE164(String(c.phone)) === dialed) || null;
        await Promise.all([
          twilioClient ? stopPlacedLegs(twilioClient, room) : Promise.resolve(),
          recordCallAnswered(conference.callerCallSid, contact),
        ]);
      }

      // Connect the caregiver to the conference room
      // hangupOnStar="true": enables them to press * to leave and trigger the action callback
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial hangupOnStar="true" action="/api/twilio/agent-transfer?room=${encodeURIComponent(room)}" method="POST">
    <Conference beep="false" endConferenceOnExit="false" startConferenceOnEnter="true">${room}</Conference>
  </Dial>
</Response>`;
    }

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Agent Join Webhook Error:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>A system error occurred. Goodbye.</Say></Response>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
