import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber } from '@/lib/db';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    let room = requestUrl.searchParams.get('room');
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

    if (!room) {
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: No conference room specified.</Say></Response>', {
        status: 400,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const activeNumber = room.replace('conf_', '');
    const account = await findAccountByTwilioNumber(activeNumber);
    const contacts = account?.line?.contacts || [];

    const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const getTtsPlayTag = (text: string) => {
      const escapedText = encodeURIComponent(text.trim());
      return `<Play>${baseUrl}/api/twilio/tts?text=${escapedText}&amp;voiceId=${voiceId}</Play>`;
    };

    let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>';

    if (!digits) {
      // 1. Play transfer options to the caregiver
      twiml += `\n  <Gather numDigits="1" action="/api/twilio/agent-transfer?room=${encodeURIComponent(room)}" method="POST" timeout="8">`;
      contacts.forEach((c, index) => {
        const digit = index + 1;
        twiml += `\n    ${getTtsPlayTag("Press " + digit + " to transfer to " + c.name)}`;
      });
      twiml += `\n    ${getTtsPlayTag("Or press 9 to rejoin the call.")}`;
      twiml += '\n  </Gather>';
      // Default to rejoining if they timeout
      twiml += `\n  <Redirect method="POST">/api/twilio/agent-transfer?Digits=9&amp;room=${encodeURIComponent(room)}</Redirect>`;
    } else if (digits === '9') {
      // 2. Rejoin the call
      twiml += `\n  ${getTtsPlayTag("Rejoining call.")}`;
      twiml += `\n  <Dial hangupOnStar="true" action="/api/twilio/agent-transfer?room=${encodeURIComponent(room)}" method="POST">`;
      twiml += `\n    <Conference beep="false" endConferenceOnExit="false" startConferenceOnEnter="true">${room}</Conference>`;
      twiml += '\n  </Dial>';
    } else {
      // 3. Process transfer selection
      const idx = parseInt(digits, 10) - 1;
      const contact = contacts[idx];

      if (contact && contact.phone) {
        twiml += `\n  ${getTtsPlayTag("Transferring call to " + contact.name + ". Goodbye.")}`;
        twiml += '\n  <Hangup />';

        // Asynchronously place the outbound call to the new contact
        const twilioClient = (await import('@/lib/twilio')).default;
        if (twilioClient) {
          try {
            await twilioClient.calls.create({
              to: contact.phone,
              from: activeNumber,
              url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(room)}`,
            });
          } catch (err) {
            console.error('Failed to create outbound call for transfer:', err);
          }
        }
      } else {
        twiml += `\n  ${getTtsPlayTag("Invalid selection.")}`;
        twiml += `\n  <Redirect method="POST">/api/twilio/agent-transfer?room=${encodeURIComponent(room)}</Redirect>`;
      }
    }

    twiml += '\n</Response>';

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Agent Transfer Webhook Error:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>A system error occurred. Goodbye.</Say></Response>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
