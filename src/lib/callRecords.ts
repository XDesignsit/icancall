import { supabase } from '@/lib/supabase';
import { toE164 } from '@/lib/phone';

/**
 * The call log: one row per call to an iCanCall line, in public.calls (see the
 * migration for the life of a row). The dashboard's call log reads it, and the
 * caregiver's call alerts are sent from it.
 *
 * Every write here happens inside a telephony webhook, so nothing throws: a
 * failed write costs a log line, never the call itself.
 */

const TABLE = 'calls';

export type CallStatus = 'ringing' | 'connected' | 'missed' | 'voicemail';

export interface CallRow {
  call_sid: string;
  line_id: string;
  from_number: string | null;
  status: CallStatus;
  answered_by: string | null;
  answered_rel: string | null;
  answered_at: string | null;
  voicemail_offered_at: string | null;
  recording_url: string | null;
  recording_seconds: number | null;
  transcript: string | null;
  duration_seconds: number | null;
  talk_seconds: number | null;
  started_at: string;
  ended_at: string | null;
  alerted_at: string | null;
}

function logFailure(what: string, callSid: string, error: unknown) {
  if (error) console.error(`Call log: could not ${what} for ${callSid}:`, error);
}

/** A call has reached a line. Twilio may retry the webhook, so a repeat is a no-op. */
export async function recordCallStarted(callSid: string, lineId: string, from: string | null): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ call_sid: callSid, line_id: lineId, from_number: from ? toE164(from) || from : null }, { onConflict: 'call_sid', ignoreDuplicates: true });
    logFailure('record the new call', callSid, error);
  } catch (err) {
    logFailure('record the new call', callSid, err);
  }
}

/**
 * A contact accepted the call. The first one to do so is the one the log and
 * the alert name; a later transfer does not rewrite it. A plain <Dial> only
 * reports after the conversation, with how long it lasted, so it passes that
 * and the answer is dated back.
 */
export async function recordCallAnswered(
  callSid: string,
  contact: { name?: unknown; rel?: unknown } | null,
  talkedSeconds = 0
): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: 'connected',
        answered_by: typeof contact?.name === 'string' && contact.name.trim() ? contact.name.trim() : null,
        answered_rel: typeof contact?.rel === 'string' && contact.rel.trim() ? contact.rel.trim() : null,
        answered_at: new Date(Date.now() - Math.max(0, talkedSeconds) * 1000).toISOString(),
      })
      .eq('call_sid', callSid)
      .is('answered_at', null);
    logFailure('record who answered', callSid, error);
  } catch (err) {
    logFailure('record who answered', callSid, err);
  }
}

/** The caller reached the leave-a-message prompt. */
export async function recordVoicemailOffered(callSid: string): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ voicemail_offered_at: new Date().toISOString() })
      .eq('call_sid', callSid)
      .is('voicemail_offered_at', null);
    logFailure('record the voicemail prompt', callSid, error);
  } catch (err) {
    logFailure('record the voicemail prompt', callSid, err);
  }
}

/** The caller left a message. */
export async function recordVoicemail(callSid: string, recordingUrl: string, recordingSeconds: number): Promise<void> {
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ status: 'voicemail', recording_url: recordingUrl, recording_seconds: recordingSeconds })
      .eq('call_sid', callSid);
    logFailure('record the voicemail', callSid, error);
  } catch (err) {
    logFailure('record the voicemail', callSid, err);
  }
}

/** The voicemail's transcript arrived (null when transcription failed). */
export async function recordTranscript(callSid: string, transcript: string | null): Promise<CallRow | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'voicemail', transcript })
      .eq('call_sid', callSid)
      .select()
      .maybeSingle();
    logFailure('record the transcript', callSid, error);
    return (data as CallRow | null) ?? null;
  } catch (err) {
    logFailure('record the transcript', callSid, err);
    return null;
  }
}

export async function getCall(callSid: string): Promise<CallRow | null> {
  try {
    const { data, error } = await supabase.from(TABLE).select('*').eq('call_sid', callSid).maybeSingle();
    logFailure('read the call', callSid, error);
    return (data as CallRow | null) ?? null;
  } catch (err) {
    logFailure('read the call', callSid, err);
    return null;
  }
}

/** The caller hung up (or was hung up): close the row with its final status. */
export async function recordCallEnded(
  call: CallRow,
  { status, durationSeconds }: { status: CallStatus; durationSeconds: number | null }
): Promise<CallRow> {
  const endedAt = new Date();
  const talkSeconds = call.answered_at
    ? Math.max(0, Math.round((endedAt.getTime() - new Date(call.answered_at).getTime()) / 1000))
    : null;
  const closed = { status, duration_seconds: durationSeconds, talk_seconds: talkSeconds, ended_at: endedAt.toISOString() };
  try {
    const { error } = await supabase.from(TABLE).update(closed).eq('call_sid', call.call_sid);
    logFailure('close the call', call.call_sid, error);
  } catch (err) {
    logFailure('close the call', call.call_sid, err);
  }
  return { ...call, ...closed };
}

/**
 * Claims the call's one alert. True for exactly one caller, however many
 * webhooks report on the call; false also when the claim cannot be made, since
 * an alert that might repeat is worse than one that is late.
 */
export async function claimCallAlert(callSid: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ alerted_at: new Date().toISOString() })
      .eq('call_sid', callSid)
      .is('alerted_at', null)
      .select('call_sid');
    logFailure('claim the alert', callSid, error);
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    logFailure('claim the alert', callSid, err);
    return false;
  }
}

/** The most recent calls to the given lines, newest first. */
export async function listCalls(lineIds: string[], limit = 200): Promise<CallRow[]> {
  if (lineIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('line_id', lineIds)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as CallRow[]) || [];
}
