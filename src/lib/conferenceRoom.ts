import { toE164 } from '@/lib/phone';

/**
 * Conference room names for the caregiver bridge.
 *
 * The voice webhook parks the caller in a Twilio Conference, and every later
 * leg -- caregivers joining, the "*" transfer menu, the cascade dialler -- finds
 * its way back by the room name alone. The name therefore carries what those
 * routes need: the line's number (to look up its contacts and to dial out from)
 * and the caller's CallSid.
 *
 *   conf_<line number digits>_<caller CallSid>   e.g. conf_14155550188_CA0123…
 *
 * Build and parse it only through these helpers so the routes cannot drift
 * apart. Stripping just the "conf_" prefix, for instance, leaves the CallSid
 * attached, and toE164 then folds its digits into the phone number.
 */

// E.164 allows at most 15 digits. A CallSid is "CA" plus hex; the voice webhook
// substitutes "mockCallSid" when Twilio sends none. The strict shape also keeps
// the name safe to echo back inside <Conference> TwiML.
const ROOM_PATTERN = /^conf_(\d{7,15})_([A-Za-z0-9]+)$/;

export interface ConferenceRoom {
  /** The iCanCall line in E.164, e.g. +14155550188. */
  lineNumber: string;
  /** CallSid of the inbound caller's leg. */
  callerCallSid: string;
}

export function buildConferenceRoom(lineNumber: string, callerCallSid: string): string {
  return `conf_${toE164(lineNumber).slice(1)}_${callerCallSid}`;
}

/** Null when the name is missing or not one buildConferenceRoom produced. */
export function parseConferenceRoom(room: string | null | undefined): ConferenceRoom | null {
  const match = ROOM_PATTERN.exec(room || '');
  if (!match) return null;
  return { lineNumber: `+${match[1]}`, callerCallSid: match[2] };
}
