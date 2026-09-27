import type { Twilio } from 'twilio';
import { parseConferenceRoom } from '@/lib/conferenceRoom';
import { supabase } from '@/lib/supabase';

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
 *
 * Cascade and simultaneous legs only join the conference once a person presses
 * a key at agent-join's screening prompt. Carrier voicemail answers a call like
 * a person does, and without the prompt it would join and take the caller.
 * agent-join records each leg someone accepts (markLegAccepted), and a
 * screened leg that ends without that record never reached the caller. A
 * leg's own CallStatus cannot tell the two apart -- voicemail that answered is
 * "completed" too -- nor can the conference, which Twilio reports as
 * in-progress while the caller waits in it alone.
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

const ACCEPTED_LEGS = 'accepted_call_legs';

/** Records that a person accepted this caregiver leg at agent-join's prompt. */
export async function markLegAccepted(callSid: string, room: string): Promise<void> {
  const { error } = await supabase.from(ACCEPTED_LEGS).upsert({ call_sid: callSid, room });
  if (error) console.error('Could not record the accepted caregiver leg; its end will count as missed:', error);
}

/**
 * Whether a person accepted this leg. When that cannot be read, the leg counts
 * as missed: better to ring one contact too many than to drop the caller.
 */
export async function wasLegAccepted(callSid: string | null | undefined): Promise<boolean> {
  if (!callSid) return false;
  const { data, error } = await supabase.from(ACCEPTED_LEGS).select('call_sid').eq('call_sid', callSid).maybeSingle();
  if (error) console.error('Could not look up the caregiver leg:', error);
  return Boolean(data);
}

/**
 * Who is in the caller's room while the caller is still there; null once they
 * have hung up or been moved on to voicemail. Before the room exists -- the
 * caller is still hearing the greeting, and a leg that fails or is declined at
 * once can report before they get there -- that is just the caller.
 */
async function callerRoom(client: Twilio, room: string, callerCallSid: string): Promise<string[] | null> {
  const rooms = await client.conferences.list({ friendlyName: room, limit: 20 });
  const open = rooms.find((c) => c.status !== 'completed');
  if (open) {
    const present = await participantCallSids(client, open.sid);
    return present.includes(callerCallSid) ? present : null;
  }
  if (rooms.length > 0) return null;
  const caller = await client.calls(callerCallSid).fetch();
  return caller.status === 'in-progress' ? [callerCallSid] : null;
}

/** Whether the caller is still on the line with nobody in their room: the cascade should ring its next contact. */
export async function callerWaitingAlone(client: Twilio, room: string): Promise<boolean> {
  const conference = parseConferenceRoom(room);
  if (!conference) return false;
  const present = await callerRoom(client, room, conference.callerCallSid);
  return present !== null && present.every((sid) => sid === conference.callerCallSid);
}

export async function releaseCallerIfAlone(
  client: Twilio,
  { room, endedCallSid, baseUrl, missed = false }: {
    room: string;
    endedCallSid?: string | null;
    baseUrl: string;
    /** The leg that ended never reached the caller (see wasLegAccepted). */
    missed?: boolean;
  }
): Promise<CallerOutcome> {
  const conference = parseConferenceRoom(room);
  if (!conference) return 'gone';
  const { lineNumber, callerCallSid } = conference;
  const isOtherLeg = (sid: string) => sid !== callerCallSid && sid !== endedCallSid;

  // 1. The caller must still be waiting in this room. Once they hang up, or have
  //    been moved on to voicemail, there is nothing left to decide.
  const present = await callerRoom(client, room, callerCallSid);
  if (!present) return 'gone';

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

  // 4. Nobody is left. If the last leg never reached the caller, nobody picked
  //    up for them: take a message, as the other no-answer paths do. Otherwise
  //    the conversation is over.
  if (missed) {
    await client.calls(callerCallSid).update({
      url: `${baseUrl}/api/twilio/voice?Digits=no-answer&To=${encodeURIComponent(lineNumber)}`,
      method: 'POST',
    });
    return 'voicemail';
  }
  await client.calls(callerCallSid).update({ status: 'completed' });
  return 'ended';
}
