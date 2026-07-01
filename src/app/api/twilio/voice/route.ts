import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber, getAvailableMinutes } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export const preferredRegion = 'iad1';

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
    const greetingText = customGreeting || "Thank you for calling the iCanCall priority line.";
    const contacts = account?.line?.contacts || [];

    // If caller dialed cascade mode directly or pressed '1'
    if (lineMode === 'cascade' && !digits) {
      digits = '1';
    }

    if (!digits) {
      // 2. Initial Call Greeting & Interactive IVR Menu
      twiml += `\n  <Say voice="Polly.Amy">${greetingText}</Say>`;

      if (lineMode === 'menu') {
        // Construct Caller Menu Routing options dynamically
        // Using Promise.all to fetch signed URLs in parallel for low latency
        const menuPrompts = await Promise.all(
          contacts.map(async (c: any, index: number) => {
            const digit = index + 1;
            let voiceUrl = null;
            if (c.voicePath) {
              try {
                const { data } = await supabase.storage
                  .from('voice-prompts')
                  .createSignedUrl(c.voicePath, 60);
                voiceUrl = data?.signedUrl;
              } catch (err) {
                console.warn('Error creating signed URL for contact:', c.name, err);
              }
            }

            if (voiceUrl) {
              return `\n      <Say voice="Polly.Amy">Press ${digit} for</Say>\n      <Play>${voiceUrl}</Play>`;
            } else {
              return `\n      <Say voice="Polly.Amy">Press ${digit} for ${c.name}.</Say>`;
            }
          })
        );

        twiml += `\n  <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}" method="POST" timeout="8">`;
        twiml += menuPrompts.join('');
        twiml += `\n      <Say voice="Polly.Amy">Or press 9 to leave a voice message.</Say>\n  </Gather>`;
        twiml += `\n  <!-- Default fallback to leaving a voicemail if they wait and enter nothing -->\n  <Redirect method="POST">/api/twilio/voice?Digits=9&amp;To=${encodeURIComponent(activeNumber)}</Redirect>`;
      } else {
        // Cascade mode prompt
        twiml += `
        <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}" method="POST" timeout="8">
          <Say voice="Polly.Amy">
            Press 1 to reach your family's trusted contacts.
            Press 2 to leave a voice message for the family.
          </Say>
        </Gather>
        <!-- If gather times out or caller presses nothing, default to leaving a voicemail -->
        <Redirect method="POST">/api/twilio/voice?Digits=2&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
    } else if (lineMode === 'menu') {
      // 3. Process digits for Menu Routing mode
      const d = parseInt(digits.toString(), 10);
      const timeLimitSeconds = Math.floor(availableMinutes * 60);

      if (d >= 1 && d <= contacts.length) {
        const contact = contacts[d - 1];
        if (contact && contact.phone) {
          twiml += `
            <Say voice="Polly.Amy">Connecting you to ${contact.name}. Please stand by.</Say>
            <Dial 
              timeout="15" 
              action="/api/twilio/voice-completed?To=${encodeURIComponent(activeNumber)}" 
              method="POST" 
              timeLimit="${timeLimitSeconds}"
            >
              <Number>${contact.phone}</Number>
            </Dial>
            <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
          `;
        } else {
          twiml += `
            <Say voice="Polly.Amy">That contact is currently unavailable.</Say>
            <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
          `;
        }
      } else if (digits === '9' || digits === 'no-answer') {
        if (digits === 'no-answer') {
          twiml += `<Say voice="Polly.Amy">The contact is currently unavailable.</Say>`;
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
        twiml += `
          <Say voice="Polly.Amy">Invalid selection.</Say>
          <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
    } else {
      // 4. Process digits for Cascade mode
      if (digits === '1') {
        const availableContacts = contacts.filter((c: any) => c.available && c.phone) || [];

        if (availableContacts.length > 0) {
          const timeLimitSeconds = Math.floor(availableMinutes * 60);
          twiml += `
            <Say voice="Polly.Amy">Connecting you to your primary trusted contacts. Please stand by.</Say>
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
            <Say voice="Polly.Amy">Your primary trusted contacts are currently unavailable.</Say>
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
        twiml += `
          <Say voice="Polly.Amy">Invalid selection.</Say>
          <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
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
