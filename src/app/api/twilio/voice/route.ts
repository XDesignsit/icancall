import { NextResponse } from 'next/server';
import { findAccountByTwilioNumber, getAvailableMinutes, deductMinutes, type LineContact } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import twilioClient from '@/lib/twilio';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    let digits = requestUrl.searchParams.get('Digits');
    let toPhoneNumber = requestUrl.searchParams.get('To');
    let dialCallStatus = requestUrl.searchParams.get('DialCallStatus');
    let dialCallDuration = requestUrl.searchParams.get('DialCallDuration');
    let contactIndexStr = requestUrl.searchParams.get('contactIndex');
    let callSid = requestUrl.searchParams.get('CallSid');

    if (request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('form-data') || contentType.includes('x-www-form-urlencoded')) {
          const formData = await request.formData();
          digits = formData.get('Digits')?.toString() || digits;
          toPhoneNumber = formData.get('To')?.toString() || toPhoneNumber;
          dialCallStatus = formData.get('DialCallStatus')?.toString() || dialCallStatus;
          dialCallDuration = formData.get('DialCallDuration')?.toString() || dialCallDuration;
          contactIndexStr = formData.get('contactIndex')?.toString() || contactIndexStr;
          callSid = formData.get('CallSid')?.toString() || callSid;
        }
      } catch (err) {
        console.warn('Could not parse form data:', err);
      }
    }

    // Default to magic test number if none provided (for basic URL hits)
    const activeNumber = toPhoneNumber ? toPhoneNumber.toString() : '+15005550006';

    // 1. Balance verification
    const account = await findAccountByTwilioNumber(activeNumber);
    let availableMinutes = 30; // Default fallback if number not in database
    
    // Dynamic ElevenLabs setup based on account settings
    const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    
    // Helper to generate dynamic ElevenLabs TTS play tags
    const getTtsPlayTag = (text: string) => {
      const escapedText = encodeURIComponent(text.trim());
      return `<Play>${baseUrl}/api/twilio/tts?text=${escapedText}&amp;voiceId=${voiceId}</Play>`;
    };

    if (account) {
      availableMinutes = getAvailableMinutes(account);
      if (availableMinutes <= 0) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${getTtsPlayTag("We are sorry, this number has run out of voice minutes. Please log in to your dashboard to top up.")}
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

    const lineMode = (account?.line?.mode as string) || 'menu';
    const customGreeting = account?.line?.settings?.greeting;
    const greetingText = customGreeting || "Thank you for calling the iCanCall priority line.";
    const greetingAudioPath = account?.line?.settings?.greetingAudioPath;
    const contacts = account?.line?.contacts || [];

    if (!digits) {
      // 2. Initial Call Greeting & Interactive IVR Menu
      let greetingVoiceUrl = null;
      if (greetingAudioPath) {
        try {
          const { data } = await supabase.storage
            .from('voice-prompts')
            .createSignedUrl(greetingAudioPath, 60);
          greetingVoiceUrl = data?.signedUrl;
        } catch (err) {
          console.warn('Error creating signed URL for greeting:', err);
        }
      }

      if (greetingVoiceUrl) {
        twiml += `\n  <Play>${greetingVoiceUrl}</Play>`;
      } else {
        twiml += `\n  ${getTtsPlayTag(greetingText)}`;
      }

      if (lineMode === 'menu') {
        // Construct Caller Menu Routing options dynamically
        // Using Promise.all to fetch signed URLs in parallel for low latency
        const menuPrompts = await Promise.all(
          contacts.map(async (c, index) => {
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
              return `\n      ${getTtsPlayTag("Press " + digit + " for")}\n      <Play>${voiceUrl}</Play>`;
            } else {
              return `\n      ${getTtsPlayTag("Press " + digit + " for " + c.name)}`;
            }
          })
        );

        twiml += `\n  <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}" method="POST" timeout="8">`;
        twiml += menuPrompts.join('');
        twiml += `\n      ${getTtsPlayTag("Or press 9 to leave a voice message.")}\n  </Gather>`;
        twiml += `\n  <!-- Default fallback to leaving a voicemail if they wait and enter nothing -->\n  <Redirect method="POST">/api/twilio/voice?Digits=9&amp;To=${encodeURIComponent(activeNumber)}</Redirect>`;
      } else {
        // Cascade or Simultaneous mode prompt
        twiml += `
        <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}" method="POST" timeout="8">
          ${getTtsPlayTag("Press 1 to reach your family's trusted contacts. Press 2 to leave a voice message for the family.")}
        </Gather>
        <!-- If gather times out or caller presses nothing, default to leaving a voicemail -->
        <Redirect method="POST">/api/twilio/voice?Digits=2&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
    } else if (digits === 'cascade-next') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        if (durationSeconds > 0 && activeNumber) {
          const minutesUsed = Math.ceil(durationSeconds / 60);
          await deductMinutes(activeNumber, minutesUsed);
        }
        twiml += '\n  <Hangup />';
      } else {
        const availableContacts = contacts.filter(
          (c): c is LineContact & { phone: string } => Boolean(c.available && c.phone)
        );
        const nextIdx = contactIndexStr ? parseInt(contactIndexStr.toString(), 10) : 0;
        if (nextIdx < availableContacts.length) {
          const nextContact = availableContacts[nextIdx];
          const timeLimitSeconds = Math.floor(availableMinutes * 60);
          twiml += `
            ${getTtsPlayTag("Trying the next contact. Please stand by.")}
            <Dial 
              timeout="15" 
              action="/api/twilio/voice?Digits=cascade-next&amp;contactIndex=${nextIdx + 1}&amp;To=${encodeURIComponent(activeNumber)}" 
              method="POST" 
              timeLimit="${timeLimitSeconds}"
            >
              <Number>${nextContact.phone}</Number>
            </Dial>
          `;
        } else {
          twiml += `
            ${getTtsPlayTag("Your primary trusted contacts are currently unavailable.")}
            <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
          `;
        }
      }
    } else if (digits === 'simultaneous-completed') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        if (durationSeconds > 0 && activeNumber) {
          const minutesUsed = Math.ceil(durationSeconds / 60);
          await deductMinutes(activeNumber, minutesUsed);
        }
        twiml += '\n  <Hangup />';
      } else {
        twiml += `
          ${getTtsPlayTag("Your primary trusted contacts are currently unavailable.")}
          <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
    } else if (digits === 'menu-completed') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        if (durationSeconds > 0 && activeNumber) {
          const minutesUsed = Math.ceil(durationSeconds / 60);
          await deductMinutes(activeNumber, minutesUsed);
        }
        twiml += '\n  <Hangup />';
      } else {
        twiml += `
          ${getTtsPlayTag("The contact is currently unavailable.")}
          <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
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
            ${getTtsPlayTag("Connecting you to " + contact.name + ". Please stand by.")}
            <Dial 
              timeout="15" 
              action="/api/twilio/voice?Digits=menu-completed&amp;To=${encodeURIComponent(activeNumber)}" 
              method="POST" 
              timeLimit="${timeLimitSeconds}"
            >
              <Number>${contact.phone}</Number>
            </Dial>
          `;
        } else {
          twiml += `
            ${getTtsPlayTag("That contact is currently unavailable.")}
            <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
          `;
        }
      } else if (digits === '9' || digits === 'no-answer') {
        if (digits === 'no-answer') {
          twiml += getTtsPlayTag("The contact is currently unavailable.");
        }
        twiml += `
          ${getTtsPlayTag("Please leave your message after the tone. When you are finished, you can hang up.")}
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
          ${getTtsPlayTag("Invalid selection.")}
          <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}</Redirect>
        `;
      }
    } else {
      // 4. Process digits for Cascade or Simultaneous mode
      if (digits === '1') {
        const availableContacts = contacts.filter(
          (c): c is LineContact & { phone: string } => Boolean(c.available && c.phone)
        );

        if (availableContacts.length > 0) {
          const timeLimitSeconds = Math.floor(availableMinutes * 60);
          const activeCallSid = callSid || 'mockCallSid';
          const roomName = `conf_${activeNumber.replace('+', '')}_${activeCallSid}`;

          if (twilioClient) {
            // PRODUCTION mode: Twilio Conference call-bridging with * transfer capability
            twiml += `
              ${getTtsPlayTag("Connecting you to your primary trusted contacts. Please stand by.")}
              <Dial timeLimit="${timeLimitSeconds}">
                <Conference beep="false" waitUrl="http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical">${roomName}</Conference>
              </Dial>
            `;

            if (lineMode === 'simultaneous') {
              // Outbound calls to all available contacts in parallel
              availableContacts.forEach(async (c) => {
                try {
                  await twilioClient!.calls.create({
                    to: c.phone,
                    from: activeNumber,
                    url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(roomName)}`,
                    statusCallback: `${baseUrl}/api/twilio/agent-completed?parentCallSid=${encodeURIComponent(activeCallSid)}`,
                    statusCallbackEvent: ['completed'],
                  });
                } catch (err) {
                  console.error(`Failed to call caregiver ${c.name}:`, err);
                }
              });
            } else {
              // Cascade mode (sequential) - Call the first caregiver
              const firstContact = availableContacts[0];
              try {
                await twilioClient!.calls.create({
                  to: firstContact.phone,
                  from: activeNumber,
                  url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(roomName)}`,
                  statusCallback: `${baseUrl}/api/twilio/cascade-callback?room=${encodeURIComponent(roomName)}&contactIndex=1&parentCallSid=${encodeURIComponent(activeCallSid)}`,
                  statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
                  timeout: 15
                });
              } catch (err) {
                console.error(`Failed to call first caregiver ${firstContact.name}:`, err);
              }
            }
          } else {
            // DEVELOPMENT/MOCK fallback: Standard Dialing without Conference to keep local testing working
            if (lineMode === 'simultaneous') {
              twiml += `
                ${getTtsPlayTag("Connecting you to your primary trusted contacts. Please stand by.")}
                <Dial 
                  timeout="15" 
                  action="/api/twilio/voice?Digits=simultaneous-completed&amp;To=${encodeURIComponent(activeNumber)}" 
                  method="POST" 
                  timeLimit="${timeLimitSeconds}"
                >`;
              availableContacts.forEach((c) => {
                twiml += `\n              <Number>${c.phone}</Number>`;
              });
              twiml += `\n            </Dial>`;
            } else {
              // Cascade mode (sequential)
              const firstContact = availableContacts[0];
              twiml += `
                ${getTtsPlayTag("Connecting you to your primary trusted contacts. Please stand by.")}
                <Dial 
                  timeout="15" 
                  action="/api/twilio/voice?Digits=cascade-next&amp;contactIndex=1&amp;To=${encodeURIComponent(activeNumber)}" 
                  method="POST" 
                  timeLimit="${timeLimitSeconds}"
                >
                  <Number>${firstContact.phone}</Number>
                </Dial>
              `;
            }
          }
        } else {
          // Fallback to voicemail if no contacts are available/online
          twiml += `
            ${getTtsPlayTag("Your primary trusted contacts are currently unavailable.")}
            <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}</Redirect>
          `;
        }
      } else if (digits === '2' || digits === 'no-answer') {
        if (digits === 'no-answer') {
          twiml += getTtsPlayTag("The primary contacts are currently unavailable.");
        }
        twiml += `
          ${getTtsPlayTag("Please leave your message after the tone. When you are finished, you can hang up.")}
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
          ${getTtsPlayTag("Invalid selection.")}
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
