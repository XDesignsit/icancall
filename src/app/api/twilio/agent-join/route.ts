import { NextResponse } from 'next/server';
import { ttsPlayTag, verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { parseConferenceRoom } from '@/lib/conferenceRoom';

export const preferredRegion = 'iad1';

// Runs when a caregiver leg is answered. Legs placed with screen=1 (cascade and
// simultaneous ringing) first ask for a key press, because carrier voicemail
// answers a call exactly like a person does: without the prompt it would join
// the conference, take the caller, and stop the cascade. Nobody pressing a key
// ends the leg unjoined, and its status callback moves on to the next contact.
// Transfer legs skip the prompt: the caregiver chose that person, and their
// voicemail is a fair place for the caller to land.
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
    const screen = requestUrl.searchParams.get('screen') === '1';
    let digits = requestUrl.searchParams.get('Digits');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          room = formData.get('room')?.toString() || room;
          digits = formData.get('Digits')?.toString() || digits;
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

    let twiml: string;
    if (screen && !digits) {
      // Any key accepts. The Gather posts back here without screen=1, which
      // joins the conference below; silence falls through to the hangup.
      const account = await findAccountByTwilioNumber(conference.lineNumber);
      const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
      const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
      const prompt = ttsPlayTag(baseUrl, "Incoming call from your family's iCanCall line. Press 1 to accept.", voiceId);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="5" action="/api/twilio/agent-join?room=${encodeURIComponent(room)}" method="POST">
    ${prompt}
    <Pause length="1"/>
    ${prompt}
  </Gather>
  <Hangup/>
</Response>`;
    } else {
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
