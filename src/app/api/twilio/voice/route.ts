import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    let digits = null;
    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          digits = formData.get('Digits');
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    if (!digits) {
      digits = new URL(request.url).searchParams.get('Digits');
    }

    let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>';

    if (!digits) {
      // 1. Initial Call Greeting & Interactive IVR Menu
      twiml += `
        <Say voice="Polly.Amy">Thank you for calling the iCanCall emergency safety line.</Say>
        <Gather numDigits="1" action="/api/twilio/voice" method="POST" timeout="8">
          <Say voice="Polly.Amy">
            Press 1 to cascade ring the family emergency circle.
            Press 2 to leave a voice message for the family.
          </Say>
        </Gather>
        <!-- If gather times out or caller presses nothing, default to leaving a voicemail -->
        <Redirect method="POST">/api/twilio/voice?Digits=2</Redirect>
      `;
    } else if (digits === '1') {
      // 2. Cascade emergency dialing (Sequential Ring)
      twiml += `
        <Say voice="Polly.Amy">Connecting you to the primary emergency contacts. Please stand by.</Say>
        <!-- Sequential Dial: If primary fails, fallback to secondary caregiver -->
        <Dial timeout="15" action="/api/twilio/voice?Digits=no-answer" method="POST">
          <Number>+14155550192</Number> <!-- Primary Delgado (Maria) -->
        </Dial>
      `;
    } else if (digits === '2' || digits === 'no-answer') {
      // 3. Record Voicemail with Automatic Transcribe Callback configured
      if (digits === 'no-answer') {
        twiml += `<Say voice="Polly.Amy">The primary contacts are currently unavailable.</Say>`;
      }
      twiml += `
        <Say voice="Polly.Amy">Please leave your message after the tone. When you are finished, you can hang up.</Say>
        <Record 
          action="/api/twilio/transcription" 
          transcribe="true" 
          transcribeCallback="/api/twilio/transcription"
          maxLength="120"
          playBeep="true"
        />
      `;
    } else {
      // Invalid input fallback
      twiml += `
        <Say voice="Polly.Amy">Invalid selection.</Say>
        <Redirect method="POST">/api/twilio/voice</Redirect>
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
