import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber, getAvailableMinutes } from '@/lib/db';

export async function POST(request: Request) {
  try {
    let digits = null;
    let toPhoneNumber = null;

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          digits = formData.get('Digits');
          toPhoneNumber = formData.get('To');
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    if (!digits) {
      const url = new URL(request.url);
      digits = url.searchParams.get('Digits');
      toPhoneNumber = toPhoneNumber || url.searchParams.get('To');
    }

    // Default to magic test number if none provided (for basic URL hits)
    const activeNumber = toPhoneNumber ? toPhoneNumber.toString() : '+15005550006';

    // 1. Balance verification
    const account = await findAccountByTwilioNumber(activeNumber);
    let availableMinutes = 30; // Default fallback if number not in database
    
    if (account) {
      availableMinutes = getAvailableMinutes(account);
      if (availableMinutes <= 0) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Amy">We are sorry, this number has run out of voice minutes. Please log in to your dashboard to top up.</Say>
  <Hangup />
</Response>`,
          {
            headers: {
              'Content-Type': 'application/xml',
            },
          }
        );
      }
    }

    let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>';

    const lineMode = account?.line?.mode || 'menu';
    const customGreeting = account?.line?.settings?.greeting;
    const greetingText = customGreeting || "Thank you for calling the iCanCall emergency safety line.";

    // If caller dialed cascade mode directly or pressed '1'
    if (lineMode === 'cascade' && !digits) {
      digits = '1';
    }

    if (!digits) {
      // 2. Initial Call Greeting & Interactive IVR Menu
      twiml += `
        <Say voice="Polly.Amy">${greetingText}</Say>
        <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}" method="POST" timeout="8">
          <Say voice="Polly.Amy">
            Press 1 to cascade ring the family emergency circle.
            Press 2 to leave a voice message for the family.
          </Say>
        </Gather>
        <!-- If gather times out or caller presses nothing, default to leaving a voicemail -->
        <Redirect method="POST">/api/twilio/voice?Digits=2&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
      `;
    } else if (digits === '1') {
      // 3. Sequential / Simultaneous Dialing to available contacts
      const availableContacts = account?.line?.contacts?.filter((c: any) => c.available && c.phone) || [];

      if (availableContacts.length > 0) {
        const timeLimitSeconds = Math.floor(availableMinutes * 60);
        twiml += `
          <Say voice="Polly.Amy">Connecting you to the primary emergency contacts. Please stand by.</Say>
          <Dial 
            timeout="15" 
            action="/api/twilio/voice-completed?To=${encodeURIComponent(activeNumber)}" 
            method="POST" 
            timeLimit="${timeLimitSeconds}"
          >`;
        availableContacts.forEach((c: any) => {
          twiml += `\n            <Number>${c.phone}</Number>`;
        });
        twiml += `\n          </Dial>`;
      } else {
        // Fallback to voicemail if no contacts are available/online
        twiml += `
          <Say voice="Polly.Amy">The primary emergency contacts are currently unavailable.</Say>
          <Say voice="Polly.Amy">Please leave your message after the tone. When you are finished, you can hang up.</Say>
          <Record 
            action="/api/twilio/transcription?To=${encodeURIComponent(activeNumber)}" 
            transcribe="true" 
            transcribeCallback="/api/twilio/transcription?To=${encodeURIComponent(activeNumber)}"
            maxLength="120"
            playBeep="true"
          />`;
      }
    } else if (digits === '2' || digits === 'no-answer') {
      // 4. Record Voicemail with Automatic Transcribe Callback configured
      if (digits === 'no-answer') {
        twiml += `<Say voice="Polly.Amy">The primary contacts are currently unavailable.</Say>`;
      }
      twiml += `
        <Say voice="Polly.Amy">Please leave your message after the tone. When you are finished, you can hang up.</Say>
        <Record 
          action="/api/twilio/transcription?To=${encodeURIComponent(activeNumber)}" 
          transcribe="true" 
          transcribeCallback="/api/twilio/transcription?To=${encodeURIComponent(activeNumber)}"
          maxLength="120"
          playBeep="true"
        />
      `;
    } else {
      // Invalid input fallback
      twiml += `
        <Say voice="Polly.Amy">Invalid selection.</Say>
        <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
      `;
    }

    twiml += '\n</Response>';

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('TwiML Inbound Voice Webhook Failure:', error);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>A system error occurred. Goodbye.</Say></Response>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}

// Support both GET and POST requests
export async function GET(request: Request) {
  return POST(request);
}
