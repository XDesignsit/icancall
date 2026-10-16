import { callPrompt, type CallLang } from "@/lib/callPrompts";
import { isOwnRecording, planAllowsVoiceClone } from "@/lib/voices";

/**
 * "Record each prompt", the second way to give a line the owner's own voice
 * (the first is an ElevenLabs clone, lib/voiceClone). The owner records every
 * sentence the line's callers can hear; the call plays those recordings and
 * speaks anything not recorded in the line's voice (the clone, if any).
 *
 * A recording is filed under the exact English sentence it says
 * (settings.promptRecordings["Calling Mom."]), so renaming or reordering a
 * contact makes the old take stop matching on its own and the voice fills in
 * until it is recorded again. Recordings are English only: a caller who
 * switches to the second language hears the voice.
 */

export type OwnVoiceMode = "clone" | "recorded";

export interface PromptRecording {
  /** Storage path in the voice-prompts bucket (a WAV from the dashboard recorder). */
  path: string;
  recordedAt: string;
}

export type PromptRecordings = Record<string, PromptRecording>;

export type ScriptGroup = "every" | "method" | "contacts";

export interface ScriptLine {
  text: string;
  group: ScriptGroup;
}

interface LineLike {
  mode?: string;
  contacts?: { name?: unknown }[];
  settings?: {
    greeting?: unknown;
    directConnect?: unknown;
    ownVoice?: unknown;
    promptRecordings?: unknown;
  };
}

const en = (key: Parameters<typeof callPrompt>[1], vars?: Parameters<typeof callPrompt>[2]) => callPrompt("en", key, vars);

/** The English greeting a line's callers hear: its custom one, or the standard one. */
export function greetingText(settings: LineLike["settings"]): string {
  const custom = typeof settings?.greeting === "string" ? settings.greeting.trim() : "";
  return custom || en("greeting");
}

/**
 * Every sentence the line's callers can hear in English, for its current
 * connection method and contacts, in the order a call meets them.
 */
export function promptScript(line: LineLike): ScriptLine[] {
  const mode = line.mode || "menu";
  const direct = mode !== "menu" && line.settings?.directConnect === true;
  const contacts = (line.contacts || []).map((c) => (typeof c.name === "string" ? c.name.trim() : ""));
  const named = contacts.filter(Boolean);

  const lines: ScriptLine[] = [{ text: greetingText(line.settings), group: "every" }];
  const add = (group: ScriptGroup, ...texts: string[]) => texts.forEach((text) => lines.push({ text, group }));

  if (mode === "menu") {
    contacts.forEach((name, i) => name && add("contacts", en("menuOption", { digit: i + 1, name })));
    add("method", en("menuVoicemail"), en("invalidSelection"));
    named.forEach((name) => add("contacts", en("connectingTo", { name })));
    add("method", en("contactUnavailable"), en("thatContactUnavailable"));
  } else {
    if (!direct) add("method", en("reachPrompt"), en("invalidSelection"));
    if (direct && mode !== "simultaneous") {
      named.forEach((name) => add("contacts", en("calling", { name }), en("didntAnswer", { name })));
    } else {
      add("method", en("connectingAll"));
      if (mode !== "simultaneous") add("method", en("tryingNext"));
    }
    add("method", en("allUnavailable"));
  }

  add("every", en("primaryUnavailable"), en("leaveMessage"), en("messageSent"), en("outOfMinutes"));

  // The same sentence can come up twice (two contacts with one name); record it once.
  const seen = new Set<string>();
  return lines.filter((l) => !seen.has(l.text) && seen.add(l.text));
}

/** The line's recordings, read defensively from its settings. */
export function promptRecordingsOf(settings: LineLike["settings"]): PromptRecordings {
  const raw = settings?.promptRecordings;
  if (!raw || typeof raw !== "object") return {};
  const out: PromptRecordings = {};
  for (const [text, rec] of Object.entries(raw as Record<string, Partial<PromptRecording>>)) {
    if (rec && isOwnRecording(rec.path)) out[text] = { path: rec.path, recordedAt: String(rec.recordedAt || "") };
  }
  return out;
}

/** Whether the line plays the owner's prompt recordings (its plan must include an own voice). */
export function recordedPromptsOn(settings: LineLike["settings"], plan: string | null | undefined): boolean {
  return settings?.ownVoice === "recorded" && planAllowsVoiceClone(plan);
}

/**
 * The stored recording of this exact sentence for an English call, or null
 * when the line does not use recordings, the call is in another language, or
 * nobody has recorded it (yet, or since a contact was renamed).
 */
export function recordingFor(
  settings: LineLike["settings"],
  plan: string | null | undefined,
  lang: CallLang,
  text: string,
  ownerId: string | null | undefined
): string | null {
  if (lang !== "en" || !ownerId || !recordedPromptsOn(settings, plan)) return null;
  const path = promptRecordingsOf(settings)[text]?.path;
  // Settings come from the browser, so only files in the owner's own folder.
  return path && path.startsWith(`${ownerId}/`) ? path : null;
}
