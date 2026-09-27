import type { Twilio } from 'twilio';
import { parseConferenceRoom } from '@/lib/conferenceRoom';

/**
 * When the caller's leg of the caregiver bridge should end.
 *
 * The caller waits in a Twilio Conference while caregivers are rung on legs of
 * their own (calls.create), so Twilio never hangs the caller up by itself: their
 * <Dial><Conference> lasts as long as the conference does. Whenever a caregiver
 * leg ends, its status callback asks this helper whether anyone is still there
 * for the caller -- in the conference, being rung, or in the "*" transfer menu
 * -- and the caller is let go only when nobody is.
 *
 * A caregiver who presses * and picks someone to transfer to hangs up right
 * after the new leg is placed, so that leg is already queued or ringing when
 * the forwarding caregiver's callback arrives, and keeps the caller on the line.
 */

export type CallerOutcome =
  | 'kept'      // someone is still talking to, or on the way to, the caller
  | 'ended'     // nobody left after a conversation: the caller was hung up
  | 'voicemail' // nobody ever picked up: the caller was sent to leave a message
  | 'gone';     // the caller had already left the room; nothing to do

// A call moves through these in order. Reading them in the same order means a
// leg that advances between two reads still turns up in a later one.
const LIVE_CALL_STATUSES = ['queued', 'ringing', 'in-progress'] as const;

async function participantCallSids(client: Twilio, conferenceSid: string): Promise<string[]> {
  const participants = await client.conferences(conferenceSid).participants.list({ limit: 50 });
  return participants
    .filter((p) => p.status !== 'complete' && p.status !== 'failed')
    .map((p) => p.callSid);
}

/**
 * Legs sitting in another caller's room on the same line. Those caregivers are
 * busy with someone else, so they must not keep this caller waiting.
 */
async function legsInOtherRooms(client: Twilio, lineNumber: string, room: string): Promise<Set<string>> {
  const prefix = `conf_${lineNumber.slice(1)}_`;
  const conferences = await client.conferences.list({ status: 'in-progress', limit: 100 });
  const others = conferences.filter((c) => c.friendlyName.startsWith(prefix) && c.friendlyName !== room);
  const sids = await Promise.all(others.map((c) => participantCallSids(client, c.sid)));
  return new Set(sids.flat());
}

export async function releaseCallerIfAlone(
  client: Twilio,
  { room, endedCallSid, baseUrl }: { room: string; endedCallSid?: string | null; baseUrl: string }
): Promise<CallerOutcome> {
  const conference = parseConferenceRoom(room);
  if (!conference) return 'gone';
  const { lineNumber, callerCallSid } = conference;
  const isOtherLeg = (sid: string) => sid !== callerCallSid && sid !== endedCallSid;

  // 1. The caller must still be waiting in this room. Once they hang up, or have
  //    been moved on to voicemail, there is nothing left to decide.
  const rooms = await client.conferences.list({ friendlyName: room, limit: 20 });
  const open = rooms.find((c) => c.status !== 'completed');
  if (!open) return 'gone';
  const present = await participantCallSids(client, open.sid);
  if (!present.includes(callerCallSid)) return 'gone';

  // 2. A caregiver is still in the conference with them.
  if (present.some(isOtherLeg)) return 'kept';

  // 3. A caregiver is on the way: a leg from this line that is still ringing, or
  //    answered but outside the conference (in the "*" menu, or about to join).
  //    Ringing legs cannot be traced to a room, so any on this line counts.
  const live = [];
  for (const status of LIVE_CALL_STATUSES) {
    const calls = await client.calls.list({ from: lineNumber, status, limit: 50 });
    live.push(...calls.filter((c) => isOtherLeg(c.sid)));
  }
  if (live.length > 0) {
    const elsewhere = live.some((c) => c.status === 'in-progress')
      ? await legsInOtherRooms(client, lineNumber, room)
      : new Set<string>();
    if (live.some((c) => !elsewhere.has(c.sid))) return 'kept';
  }

  // 4. Nobody is left. A conference only starts once a second participant joins,
  //    so one still in "init" means no caregiver ever picked up: take a message,
  //    as the other no-answer paths do. Otherwise the conversation is over.
  if (open.status === 'init') {
    await client.calls(callerCallSid).update({
      url: `${baseUrl}/api/twilio/voice?Digits=no-answer&To=${encodeURIComponent(lineNumber)}`,
      method: 'POST',
    });
    return 'voicemail';
  }
  await client.calls(callerCallSid).update({ status: 'completed' });
  return 'ended';
}
