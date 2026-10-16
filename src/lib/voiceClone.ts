import { supabase } from '@/lib/supabase';
import { invalidateCachedAccount } from '@/lib/db';
import { customVoiceOf, type CustomVoice } from '@/lib/voices';

/**
 * Instant voice clones of account owners, made with ElevenLabs from a reading
 * recorded on the dashboard (api/caregiver/voice-clone). The clone's ID is
 * kept in profiles.settings.customVoice; lines then pick it like any other
 * voice (lib/voices).
 *
 * Every clone takes one of the ElevenLabs workspace's custom-voice slots, so
 * one is deleted as soon as it is replaced or removed, or the account's
 * numbers are released at the end of a subscription.
 */

const API = 'https://api.elevenlabs.io/v1';

export type CloneFailure = 'unconfigured' | 'permissions' | 'voice_limit' | 'rejected' | 'failed';

export class VoiceCloneError extends Error {
  constructor(public reason: CloneFailure, message: string) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new VoiceCloneError('unconfigured', 'ELEVENLABS_API_KEY is not set');
  return key;
}

/** Sorts an ElevenLabs error response into what the dashboard can tell the owner. */
function failureFrom(status: number, body: string): CloneFailure {
  const text = body.toLowerCase();
  if (status === 401 || status === 403 || text.includes('permission')) return 'permissions';
  if (text.includes('voice_limit') || text.includes('limit_reached') || text.includes('maximum amount of custom voices')) return 'voice_limit';
  if (status === 400 || status === 422) return 'rejected';
  return 'failed';
}

/** Clones a voice from one recording; returns the new ElevenLabs voice ID. */
export async function createVoiceClone(sample: Blob, fileName: string, ownerId: string): Promise<string> {
  const form = new FormData();
  form.append('name', `iCanCall ${ownerId.slice(0, 8)}`);
  form.append('description', `Account owner's own voice for their iCanCall line prompts (profile ${ownerId}).`);
  form.append('labels', JSON.stringify({ app: 'icancall', profile: ownerId }));
  form.append('remove_background_noise', 'true');
  form.append('files', sample, fileName);

  const res = await fetch(`${API}/voices/add`, { method: 'POST', headers: { 'xi-api-key': apiKey() }, body: form });
  const body = await res.text();
  if (!res.ok) {
    console.error('ElevenLabs voice clone failed:', res.status, body);
    throw new VoiceCloneError(failureFrom(res.status, body), `ElevenLabs answered ${res.status}`);
  }
  const voiceId = (JSON.parse(body) as { voice_id?: string }).voice_id;
  if (!voiceId) throw new VoiceCloneError('failed', 'ElevenLabs returned no voice ID');
  return voiceId;
}

/** Deletes a clone at ElevenLabs. One that is already gone counts as deleted. */
export async function deleteVoiceClone(voiceId: string): Promise<void> {
  const res = await fetch(`${API}/voices/${encodeURIComponent(voiceId)}`, { method: 'DELETE', headers: { 'xi-api-key': apiKey() } });
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    console.error('ElevenLabs voice delete failed:', res.status, body);
    throw new VoiceCloneError(failureFrom(res.status, body), `ElevenLabs answered ${res.status}`);
  }
}

/**
 * Stores (or, with null, clears) the owner's clone on their profile and drops
 * the cached call lookups for their lines, so the next call uses it.
 */
export async function saveCustomVoice(ownerId: string, voice: CustomVoice | null): Promise<void> {
  const { data: profile, error } = await supabase.from('profiles').select('settings').eq('id', ownerId).maybeSingle();
  if (error) throw error;
  const settings = { ...(profile?.settings || {}) };
  if (voice) settings.customVoice = voice;
  else delete settings.customVoice;
  const { error: updateError } = await supabase.from('profiles').update({ settings }).eq('id', ownerId);
  if (updateError) throw updateError;

  const { data: lines } = await supabase.from('phone_lines').select('number').eq('user_id', ownerId);
  for (const line of lines || []) if (line.number) invalidateCachedAccount(String(line.number));
}

/**
 * Deletes the owner's clone, if they have one, at ElevenLabs and on their
 * profile. Failures are logged rather than thrown: the caller (the end of a
 * subscription) goes on either way, and the voice reads as the default.
 */
export async function removeOwnerVoiceClone(profile: { id: string; settings?: Record<string, unknown> | null }): Promise<void> {
  const voice = customVoiceOf(profile.settings);
  if (!voice) return;
  try {
    await deleteVoiceClone(voice.id);
    await saveCustomVoice(profile.id, null);
  } catch (err) {
    console.error(`Could not remove the cloned voice of ${profile.id}:`, err);
  }
}
