import { supabase } from '@/lib/supabase';
import { ttsPlayTag } from '@/lib/twilioWebhook';
import { callPrompt, promptAroundName, type CallLang } from '@/lib/callPrompts';

/**
 * Direct connect, a line setting for every mode but the caller menu: callers
 * skip the "Press 1 to reach your family's trusted contacts" prompt and are
 * put straight through. In the sequential modes (cascade and schedule) they
 * also hear who is being rung as it happens -- "Calling Mom." then "Mom didn't
 * answer. Calling Dad." -- with a ringing tone in between instead of hold music.
 */
export function directConnectOn(settings: { directConnect?: unknown } | undefined, lineMode: string): boolean {
  return lineMode !== 'menu' && settings?.directConnect === true;
}

/** The ringing tone a direct-connect caller hears while a contact is rung (public/audio). */
export function ringbackUrl(baseUrl: string): string {
  return `${baseUrl}/audio/ringback.wav`;
}

interface AnnouncedContact {
  name?: unknown;
  voicePath?: unknown;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The contact's recorded name as a <Play> tag; null when there is none to play. */
async function recordedName(contact: AnnouncedContact): Promise<string | null> {
  // Older dashboard recordings were saved as WebM/MP4, which <Play> cannot play;
  // those read the typed name instead.
  const path = contact.voicePath;
  if (typeof path !== 'string' || !/\.(mp3|wav)$/i.test(path)) return null;
  try {
    const { data } = await supabase.storage.from('voice-prompts').createSignedUrl(path, 60);
    return data?.signedUrl ? `<Play>${escapeXml(data.signedUrl)}</Play>` : null;
  } catch (err) {
    console.warn('Error creating signed URL for contact name:', err);
    return null;
  }
}

function typedName(contact: AnnouncedContact): string | null {
  return typeof contact.name === 'string' && contact.name.trim() ? contact.name.trim() : null;
}

/**
 * TwiML telling the caller who is being rung now, and who just did not pick
 * up when there was someone before. A contact's recorded name is used when
 * there is one, as in the caller menu.
 */
export async function announceContact(
  baseUrl: string,
  voiceId: string,
  calling: AnnouncedContact,
  missed: AnnouncedContact | null = null,
  lang: CallLang = 'en'
): Promise<string> {
  const say = (text: string) => (text ? ttsPlayTag(baseUrl, text, voiceId) : '');
  const sayAround = (key: 'calling' | 'didntAnswer', recording: string) => {
    const [before, after] = promptAroundName(lang, key);
    return `${say(before)}${recording}${say(after)}`;
  };
  const [missedRecording, callingRecording] = await Promise.all([
    missed ? recordedName(missed) : Promise.resolve(null),
    recordedName(calling),
  ]);

  const parts: string[] = [];
  if (missed) {
    const name = typedName(missed);
    parts.push(missedRecording
      ? sayAround('didntAnswer', missedRecording)
      : say(name ? callPrompt(lang, 'didntAnswer', { name }) : callPrompt(lang, 'noAnswer')));
  }
  const name = typedName(calling);
  parts.push(callingRecording
    ? sayAround('calling', callingRecording)
    : say(name ? callPrompt(lang, 'calling', { name }) : callPrompt(lang, 'callingNext')));
  return parts.join('\n  ');
}
