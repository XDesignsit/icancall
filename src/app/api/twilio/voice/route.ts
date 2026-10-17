import { NextResponse } from 'next/server';
import { recordedPromptTag, ttsPlayTag, verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber, getAvailableMinutes, chargeCallMinutes } from '@/lib/db';
import { buildConferenceRoom } from '@/lib/conferenceRoom';
import { recordPlacedLegs } from '@/lib/conferenceBridge';
import { announceContact, directConnectOn } from '@/lib/cascadeAnnounce';
import { cascadeOrder, hourInTimeZone, onDutyContactIndex, parseLeadIndex } from '@/lib/coverageSchedule';
import { supabase } from '@/lib/supabase';
import twilioClient, { providerForNumber } from '@/lib/twilio';
import { recordCallAnswered, recordCallStarted, recordVoicemailOffered } from '@/lib/callRecords';
import { ensureCallStatusWebhook } from '@/lib/numbers';
import { callPrompt, langParam, langParamXml, languageOffer, parseCallLang, promptAroundName, type CallPromptKey } from '@/lib/callPrompts';
import { isOwnRecording } from '@/lib/voices';
import { greetingText as promptGreetingText } from '@/lib/promptRecordings';

export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request, { telnyx: true });
  if (denied) return denied;

  try {
    const requestUrl = new URL(request.url);
    let digits = requestUrl.searchParams.get('Digits');
    let toPhoneNumber = requestUrl.searchParams.get('To');
    let dialCallStatus = requestUrl.searchParams.get('DialCallStatus');
    let dialCallDuration = requestUrl.searchParams.get('DialCallDuration');
    let contactIndexStr = requestUrl.searchParams.get('contactIndex');
    let callSid = requestUrl.searchParams.get('CallSid');
    let fromNumber = requestUrl.searchParams.get('From');
    // Set on cascade legs of a schedule-mode call: the contact rung first.
    const leadFromQuery = parseLeadIndex(requestUrl.searchParams.get('lead'));
    // The caller's language once they took the line's Bilingual Support offer
    // (lib/callPrompts); English otherwise. Every URL below carries it on.
    let lang = parseCallLang(requestUrl.searchParams.get('lang'));
    // Set on the Gather that offers the switch before a direct-connect call.
    const fromDirectOffer = requestUrl.searchParams.get('direct') === '1';

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
          fromNumber = formData.get('From')?.toString() || fromNumber;
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
    const getTtsPlayTag = (text: string) => ttsPlayTag(baseUrl, text, voiceId);
    // The owner's own recording of a sentence, when the line plays recordings (lib/promptRecordings).
    const recorded = recordedPromptTag(baseUrl, account?.line?.settings, account?.plan, lang, account?.id);
    // A caller-facing sentence in the call's language, as a <Play> tag.
    const say = (key: CallPromptKey, vars?: { digit?: number | string; name?: string }) => {
      const text = callPrompt(lang, key, vars);
      return recorded(text) || getTtsPlayTag(text);
    };

    if (account) {
      availableMinutes = getAvailableMinutes(account);
      if (availableMinutes <= 0) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${say('outOfMinutes')}
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

    let lineMode = (account?.line?.mode as string) || 'menu';
    if (account?.plan === 'essential') {
      lineMode = 'cascade';
    }
    const settings = account?.line?.settings;
    const contacts = account?.line?.contacts || [];
    // Callers skip the "Press 1" prompt and hear who is being rung (lib/cascadeAnnounce).
    const directConnect = directConnectOn(settings, lineMode);

    // Bilingual Support: English callers are offered the second language after
    // the greeting. Taking it starts the call over in that language.
    const offer = lang === 'en' ? languageOffer(settings, lineMode, contacts.length) : null;
    if (offer && digits === offer.digit) {
      lang = offer.lang;
      digits = null;
    } else if (fromDirectOffer && digits) {
      // Any other key on a direct-connect line's offer just puts the caller through.
      digits = '1';
    }
    const lq = langParamXml(lang);

    // The second language has its own custom greeting (greeting2), or the
    // standard one translated; the generated English greeting audio is English only.
    const customGreeting = lang === 'en' ? settings?.greeting : settings?.greeting2;
    const greetingText = customGreeting || callPrompt(lang, 'greeting');
    // Only a recorded greeting is played; a generated one is spoken live in the line's voice (lib/voices).
    const greetingAudioPath = lang === 'en' && isOwnRecording(settings?.greetingAudioPath) ? settings?.greetingAudioPath : undefined;
    const offerTag = offer && lang === 'en' ? getTtsPlayTag(callPrompt(offer.lang, 'languageOffer', { digit: offer.digit })) : '';

    if (!digits) {
      // A new call (or the menu again after a bad key; recording is a no-op then).
      if (account?.line && callSid) {
        await Promise.all([
          recordCallStarted(callSid, account.line.id, fromNumber),
          ensureCallStatusWebhook(account.line, activeNumber),
        ]);
      }

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

      const greetingRecording = recorded(lang === 'en' ? promptGreetingText(settings) : '');
      if (greetingRecording) {
        twiml += `\n  ${greetingRecording}`;
      } else if (greetingVoiceUrl) {
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
            // A whole "Press 1 for Mom" the owner recorded comes before the contact's recorded name.
            if (recorded(callPrompt(lang, 'menuOption', { digit, name: c.name }))) {
              return `\n      ${say('menuOption', { digit, name: c.name })}`;
            }
            let voiceUrl = null;
            // A name the contact recorded is played; a generated one, or an older
            // WebM/MP4 recording <Play> cannot play, is spoken in the line's voice.
            if (isOwnRecording(c.voicePath)) {
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
              const [before, after] = promptAroundName(lang, 'menuOption', { digit });
              return [before && getTtsPlayTag(before), `<Play>${voiceUrl}</Play>`, after && getTtsPlayTag(after)]
                .filter(Boolean).map((tag) => `\n      ${tag}`).join('');
            } else {
              return `\n      ${say('menuOption', { digit, name: c.name })}`;
            }
          })
        );

        twiml += `\n  <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}${lq}" method="POST" timeout="8">`;
        if (offerTag) twiml += `\n      ${offerTag}`;
        twiml += menuPrompts.join('');
        twiml += `\n      ${say('menuVoicemail')}\n  </Gather>`;
        twiml += `\n  <!-- Default fallback to leaving a voicemail if they wait and enter nothing -->\n  <Redirect method="POST">/api/twilio/voice?Digits=9&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>`;
      } else if (directConnect) {
        // Straight through to the contacts, as if the caller had pressed 1,
        // after a short pause for the language offer when there is one.
        if (offerTag) {
          twiml += `\n  <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}&amp;direct=1" method="POST" timeout="3">\n      ${offerTag}\n  </Gather>`;
        }
        twiml += `\n  <Redirect method="POST">/api/twilio/voice?Digits=1&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>`;
      } else {
        // Cascade or Simultaneous mode prompt
        twiml += `
        <Gather numDigits="1" action="/api/twilio/voice?To=${encodeURIComponent(activeNumber)}${lq}" method="POST" timeout="8">
          ${offerTag}${say('reachPrompt')}
        </Gather>
        <!-- If gather times out or caller presses nothing, default to leaving a voicemail -->
        <Redirect method="POST">/api/twilio/voice?Digits=2&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
        `;
      }
    } else if (digits === 'cascade-next') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        if (callSid) {
          const answeredIdx = (contactIndexStr ? parseInt(contactIndexStr.toString(), 10) : 1) - 1;
          const answered = cascadeOrder(contacts, leadFromQuery, fromNumber)[answeredIdx] || null;
          await recordCallAnswered(callSid, answered, durationSeconds);
        }
        // Charged here as well as by call-status, which Telnyx lines never get; once per call either way.
        if (callSid) await chargeCallMinutes(callSid, activeNumber, durationSeconds);
        twiml += '\n  <Hangup />';
      } else {
        const availableContacts = cascadeOrder(contacts, leadFromQuery, fromNumber);
        const nextIdx = contactIndexStr ? parseInt(contactIndexStr.toString(), 10) : 0;
        if (nextIdx < availableContacts.length) {
          const nextContact = availableContacts[nextIdx];
          const timeLimitSeconds = Math.floor(availableMinutes * 60);
          const prompt = directConnect
            ? await announceContact(baseUrl, voiceId, nextContact, availableContacts[nextIdx - 1] || null, lang, recorded)
            : say('tryingNext');
          twiml += `
            ${prompt}
            <Dial 
              timeout="15" 
              action="/api/twilio/voice?Digits=cascade-next&amp;contactIndex=${nextIdx + 1}${leadFromQuery === null ? '' : `&amp;lead=${leadFromQuery}`}&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
              method="POST" 
              timeLimit="${timeLimitSeconds}"
            >
              <Number>${nextContact.phone}</Number>
            </Dial>
          `;
        } else {
          twiml += `
            ${say('allUnavailable')}
            <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
          `;
        }
      }
    } else if (digits === 'simultaneous-completed') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        // <Dial> to several numbers does not say which of them picked up.
        if (callSid) await recordCallAnswered(callSid, null, durationSeconds);
        // Charged here as well as by call-status, which Telnyx lines never get; once per call either way.
        if (callSid) await chargeCallMinutes(callSid, activeNumber, durationSeconds);
        twiml += '\n  <Hangup />';
      } else {
        twiml += `
          ${say('allUnavailable')}
          <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
        `;
      }
    } else if (digits === 'menu-completed') {
      const dialStatus = dialCallStatus;
      if (dialStatus === 'completed' || dialStatus === 'answered') {
        const durationSeconds = dialCallDuration ? parseInt(dialCallDuration.toString(), 10) : 0;
        if (callSid) {
          const picked = parseLeadIndex(requestUrl.searchParams.get('contact'));
          await recordCallAnswered(callSid, picked === null ? null : contacts[picked] || null, durationSeconds);
        }
        // Charged here as well as by call-status, which Telnyx lines never get; once per call either way.
        if (callSid) await chargeCallMinutes(callSid, activeNumber, durationSeconds);
        twiml += '\n  <Hangup />';
      } else {
        twiml += `
          ${say('contactUnavailable')}
          <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
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
            ${say('connectingTo', { name: contact.name })}
            <Dial 
              timeout="15" 
              action="/api/twilio/voice?Digits=menu-completed&amp;contact=${d - 1}&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
              method="POST" 
              timeLimit="${timeLimitSeconds}"
            >
              <Number>${contact.phone}</Number>
            </Dial>
          `;
        } else {
          twiml += `
            ${say('thatContactUnavailable')}
            <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
          `;
        }
      } else if (digits === '9' || digits === 'no-answer') {
        if (callSid) await recordVoicemailOffered(callSid);
        if (digits === 'no-answer') {
          twiml += say('contactUnavailable');
        }
        twiml += `
          ${say('leaveMessage')}
          <Record 
            action="/api/twilio/transcription?kind=recording&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
            transcribe="true" 
            transcribeCallback="/api/twilio/transcription?kind=transcript&amp;To=${encodeURIComponent(activeNumber)}"
            maxLength="120"
            playBeep="true"
          />
        `;
      } else {
        twiml += `
          ${say('invalidSelection')}
          <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
        `;
      }
    } else {
      // 4. Process digits for Cascade, Simultaneous or Schedule mode
      if (digits === '1') {
        // Around-the-clock coverage rings whoever the schedule has on duty in
        // the account's time zone first, then cascades through the rest of the
        // circle. The lead is fixed here and handed to every later leg, so a
        // cascade that runs across a slot boundary keeps its order.
        const leadIndex = lineMode === 'schedule' && account
          ? onDutyContactIndex(account.line?.schedule, contacts, hourInTimeZone(new Date(), account.timeZone))
          : null;
        const availableContacts = cascadeOrder(contacts, leadIndex, fromNumber);

        if (availableContacts.length > 0) {
          const timeLimitSeconds = Math.floor(availableMinutes * 60);
          const activeCallSid = callSid || 'mockCallSid';
          const roomName = buildConferenceRoom(activeNumber, activeCallSid);

          // Telnyx (Caribbean) numbers execute this same markup as TeXML but do
          // not use Twilio's Conference + calls.create bridging, so they fall
          // through to the provider-agnostic <Dial> path below.
          const useTwilioConference = twilioClient && providerForNumber(activeNumber) === 'twilio';

          if (useTwilioConference) {
            // PRODUCTION mode: Twilio Conference call-bridging with * transfer capability.
            // The room closes when the caller leaves it, so a caregiver is not
            // left on a silent line after the caller hangs up. A direct-connect
            // cascade waits in a hold loop that names each contact as it is
            // rung (api/twilio/cascade-wait); everyone else hears hold music.
            const announceLegs = directConnect && lineMode !== 'simultaneous';
            const waitUrl = announceLegs
              ? `${baseUrl}/api/twilio/cascade-wait?room=${encodeURIComponent(roomName)}${lq}`
              : 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical';
            twiml += `
              ${announceLegs ? '' : say('connectingAll')}
              <Dial timeLimit="${timeLimitSeconds}">
                <Conference beep="false" endConferenceOnExit="true" waitUrl="${waitUrl}">${roomName}</Conference>
              </Dial>
            `;

            if (lineMode === 'simultaneous') {
              // Outbound calls to all available contacts in parallel. Wait for
              // them to be placed: the function may be frozen once it responds.
              // They are recorded so the first to accept can stop the rest.
              const placed: string[] = [];
              await Promise.all(availableContacts.map(async (c) => {
                try {
                  const leg = await twilioClient!.calls.create({
                    to: c.phone,
                    from: activeNumber,
                    url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(roomName)}&screen=1`,
                    statusCallback: `${baseUrl}/api/twilio/agent-completed?room=${encodeURIComponent(roomName)}&missed=1${langParam(lang)}`,
                    statusCallbackEvent: ['completed'],
                    timeout: 20
                  });
                  placed.push(leg.sid);
                } catch (err) {
                  console.error(`Failed to call caregiver ${c.name}:`, err);
                }
              }));
              await recordPlacedLegs(roomName, placed);
            } else {
              // Cascade and Schedule modes (sequential) - Call the first caregiver
              const firstContact = availableContacts[0];
              try {
                const leg = await twilioClient!.calls.create({
                  to: firstContact.phone,
                  from: activeNumber,
                  url: `${baseUrl}/api/twilio/agent-join?room=${encodeURIComponent(roomName)}&screen=1`,
                  statusCallback: `${baseUrl}/api/twilio/cascade-callback?room=${encodeURIComponent(roomName)}&contactIndex=1${leadIndex === null ? '' : `&lead=${leadIndex}`}${langParam(lang)}`,
                  statusCallbackEvent: ['completed', 'busy', 'no-answer', 'failed'],
                  timeout: 15
                });
                await recordPlacedLegs(roomName, [leg.sid]);
              } catch (err) {
                console.error(`Failed to call first caregiver ${firstContact.name}:`, err);
              }
            }
          } else {
            // DEVELOPMENT/MOCK fallback: Standard Dialing without Conference to keep local testing working
            if (lineMode === 'simultaneous') {
              twiml += `
                ${say('connectingAll')}
                <Dial 
                  timeout="15" 
                  action="/api/twilio/voice?Digits=simultaneous-completed&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
                  method="POST" 
                  timeLimit="${timeLimitSeconds}"
                >`;
              availableContacts.forEach((c) => {
                twiml += `\n              <Number>${c.phone}</Number>`;
              });
              twiml += `\n            </Dial>`;
            } else {
              // Cascade and Schedule modes (sequential)
              const firstContact = availableContacts[0];
              const prompt = directConnect
                ? await announceContact(baseUrl, voiceId, firstContact, null, lang, recorded)
                : say('connectingAll');
              twiml += `
                ${prompt}
                <Dial 
                  timeout="15" 
                  action="/api/twilio/voice?Digits=cascade-next&amp;contactIndex=1${leadIndex === null ? '' : `&amp;lead=${leadIndex}`}&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
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
            ${say('allUnavailable')}
            <Redirect method="POST">/api/twilio/voice?Digits=no-answer&amp;To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
          `;
        }
      } else if (digits === '2' || digits === 'no-answer') {
        if (callSid) await recordVoicemailOffered(callSid);
        if (digits === 'no-answer') {
          twiml += say('primaryUnavailable');
        }
        twiml += `
          ${say('leaveMessage')}
          <Record 
            action="/api/twilio/transcription?kind=recording&amp;To=${encodeURIComponent(activeNumber)}${lq}" 
            transcribe="true" 
            transcribeCallback="/api/twilio/transcription?kind=transcript&amp;To=${encodeURIComponent(activeNumber)}"
            maxLength="120"
            playBeep="true"
          />
        `;
      } else {
        twiml += `
          ${say('invalidSelection')}
          <Redirect method="POST">/api/twilio/voice?To=${encodeURIComponent(activeNumber)}${lq}</Redirect>
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
