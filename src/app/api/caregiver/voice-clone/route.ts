import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { supabase } from '@/lib/supabase';
import { resolveAccount } from '@/lib/account';
import { customVoiceOf, planAllowsVoiceClone } from '@/lib/voices';
import { createVoiceClone, deleteVoiceClone, saveCustomVoice, VoiceCloneError } from '@/lib/voiceClone';

// ElevenLabs takes a while to build a clone from a couple of minutes of audio.
export const maxDuration = 60;

// The reading must be long enough for a usable clone, and short enough to stay
// under Vercel's request body limit (16 kHz mono WAV is 32 kB a second).
const MIN_SECONDS = 30;
const MAX_SECONDS = 130;

/** The owner of the session's account; null for a signed-out request. */
async function sessionAccount() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  if (!payload?.userId) return null;
  return resolveAccount(payload.userId);
}

/** Seconds of audio in a PCM WAV built by lib/wavEncoder; null when it is not one. */
function wavSeconds(bytes: Buffer): number | null {
  if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') return null;
  const byteRate = bytes.readUInt32LE(28);
  return byteRate > 0 ? (bytes.length - 44) / byteRate : null;
}

function failure(reason: string, status: number) {
  return NextResponse.json({ error: reason }, { status });
}

/**
 * Clones the account owner's voice from a reading recorded on the dashboard
 * (form fields: audio, a WAV; consent, "true"). A clone they already had is
 * replaced and deleted. Answers { voiceId } on success, or an error code the
 * dashboard turns into a message.
 */
export async function POST(request: Request) {
  try {
    const account = await sessionAccount();
    if (!account) return failure('unauthorized', 401);
    if (account.role !== 'owner') return failure('owner_only', 403);

    const { data: profile } = await supabase.from('profiles').select('settings').eq('id', account.accountId).maybeSingle();
    if (!planAllowsVoiceClone(profile?.settings?.plan)) return failure('plan', 403);

    const form = await request.formData();
    if (form.get('consent') !== 'true') return failure('consent', 400);
    const audio = form.get('audio');
    if (!(audio instanceof Blob)) return failure('audio', 400);
    const bytes = Buffer.from(await audio.arrayBuffer());
    const seconds = wavSeconds(bytes);
    if (seconds === null) return failure('audio', 415);
    if (seconds < MIN_SECONDS) return failure('too_short', 400);
    if (seconds > MAX_SECONDS) return failure('too_long', 400);

    const previous = customVoiceOf(profile?.settings);
    const voiceId = await createVoiceClone(new Blob([bytes], { type: 'audio/wav' }), 'reading.wav', account.accountId);
    try {
      await saveCustomVoice(account.accountId, { id: voiceId, createdAt: new Date().toISOString() });
    } catch (err) {
      // Not stored, so nothing would ever delete it: give the slot back.
      await deleteVoiceClone(voiceId).catch(() => {});
      throw err;
    }
    if (previous && previous.id !== voiceId) {
      await deleteVoiceClone(previous.id).catch((err) => console.error('Could not delete the replaced voice clone:', err));
    }
    return NextResponse.json({ voiceId });
  } catch (err) {
    if (err instanceof VoiceCloneError) return failure(err.reason, err.reason === 'voice_limit' || err.reason === 'rejected' ? 422 : 502);
    console.error('Voice clone failed:', err);
    return failure('failed', 500);
  }
}

/** Removes the owner's cloned voice. Lines that used it go back to the default voice. */
export async function DELETE() {
  try {
    const account = await sessionAccount();
    if (!account) return failure('unauthorized', 401);
    if (account.role !== 'owner') return failure('owner_only', 403);

    const { data: profile } = await supabase.from('profiles').select('settings').eq('id', account.accountId).maybeSingle();
    const voice = customVoiceOf(profile?.settings);
    if (voice) {
      await deleteVoiceClone(voice.id);
      await saveCustomVoice(account.accountId, null);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof VoiceCloneError) return failure(err.reason, 502);
    console.error('Voice clone removal failed:', err);
    return failure('failed', 500);
  }
}
