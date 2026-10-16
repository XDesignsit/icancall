import { NextResponse } from 'next/server';
import { verifyTelephonyWebhook } from '@/lib/twilioWebhook';
import { findAccountByTwilioNumber } from '@/lib/db';
import { parseConferenceRoom } from '@/lib/conferenceRoom';
import { latestPlacedLeg } from '@/lib/conferenceBridge';
import { announceContact, ringbackUrl } from '@/lib/cascadeAnnounce';
import { parseLeadIndex } from '@/lib/coverageSchedule';
import { toE164 } from '@/lib/phone';
import { langParamXml, parseCallLang } from '@/lib/callPrompts';

export const preferredRegion = 'iad1';

// A leg in one of these is still on its way to the caller: ringing, or
// answered and at agent-join's "Press 1 to accept" prompt.
const LIVE_LEG_STATUSES = new Set(['queued', 'ringing', 'in-progress']);

/**
 * The caller's hold loop in a direct-connect cascade: the conference waitUrl
 * the voice webhook sets (lib/cascadeAnnounce). Each pass plays one ring and
 * comes back here; when the cascade has placed a new leg since the last pass,
 * the caller first hears who it is ringing. `said` is the leg already
 * announced and `who` that contact's place in the line's contacts, for "Mom
 * didn't answer." The loop ends when a contact joins the room, or when the
 * caller is moved on to voicemail. `lang` is the caller's language
 * (lib/callPrompts), carried from the waitUrl through every pass.
 *
 * Twilio drops the caller from the room if this fails, so every error still
 * answers with the ring and the loop.
 */
export async function POST(request: Request) {
  const denied = await verifyTelephonyWebhook(request);
  if (denied) return denied;

  const requestUrl = new URL(request.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  const room = requestUrl.searchParams.get('room') || '';
  let said = requestUrl.searchParams.get('said') || '';
  let who = parseLeadIndex(requestUrl.searchParams.get('who'));
  const lang = parseCallLang(requestUrl.searchParams.get('lang'));
  let announcement = '';

  const conference = parseConferenceRoom(room);
  try {
    const twilioClient = (await import('@/lib/twilio')).default;
    const leg = conference && twilioClient ? await latestPlacedLeg(room) : null;
    if (conference && twilioClient && leg && leg !== said) {
      said = leg;
      const [call, account] = await Promise.all([
        twilioClient.calls(leg).fetch(),
        findAccountByTwilioNumber(conference.lineNumber),
      ]);
      const contacts = account?.line?.contacts || [];
      const dialed = toE164(call.to);
      const idx = contacts.findIndex((c) => c.phone && toE164(String(c.phone)) === dialed);
      if (LIVE_LEG_STATUSES.has(call.status) && idx >= 0) {
        const voiceId = account?.line?.settings?.voiceId || '21m00Tcm4TlvDq8ikWAM';
        const missed = who === null || who === idx ? null : contacts[who] || null;
        announcement = await announceContact(baseUrl, voiceId, contacts[idx], missed, lang);
        who = idx;
      }
    }
  } catch (err) {
    console.warn('Cascade hold loop: could not tell the caller who is being rung:', err);
  }

  const next = `/api/twilio/cascade-wait?room=${encodeURIComponent(room)}&amp;said=${encodeURIComponent(said)}${who === null ? '' : `&amp;who=${who}`}${langParamXml(lang)}`;
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${announcement}
  <Play>${ringbackUrl(baseUrl)}</Play>
  <Redirect method="POST">${next}</Redirect>
</Response>`, { headers: { 'Content-Type': 'application/xml' } });
}

export async function GET(request: Request) {
  return POST(request);
}
