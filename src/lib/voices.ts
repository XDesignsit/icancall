import { planConfig } from "@/lib/planConfig";

/**
 * The voices iCanCall lines speak with. Every prompt a caller hears goes
 * through ElevenLabs with the line's voice (lib/twilioWebhook ttsPlayTag), so
 * the voice set on a line decides how the whole call sounds.
 *
 * A line can use one of the stock voices below, or -- on plans that include
 * it -- the account owner's own cloned voice (api/caregiver/voice-clone). The
 * voice ID on a line is whatever the dashboard last saved, so the server only
 * honours one of those two (effectiveVoiceId); anything else reads as the
 * default voice.
 */

export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

/** The owner's cloned voice, kept in profiles.settings.customVoice. Written server-side only. */
export interface CustomVoice {
  id: string;
  createdAt: string;
}

export const ELEVENLABS_VOICE_GROUPS: {
  langKey: string;
  voices: { id: string; name: string; gender: "voiceFemale" | "voiceMale"; desc: string }[];
}[] = [
  { langKey: "langEnglish", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescWarm" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescProfessional" },
  ] },
  { langKey: "langSpanish", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "2EiwWnXF2V4j29thjbwy", name: "Clyde", gender: "voiceMale", desc: "voiceDescFriendly" },
  ] },
  { langKey: "langFrench", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescSoftAccent" },
    { id: "5Q0t7uMcgp8Aagzh1ZQQ", name: "Paul", gender: "voiceMale", desc: "voiceDescDeep" },
  ] },
  { langKey: "langJapanese", voices: [
    { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescFriendly" },
  ] },
  { langKey: "langChinese", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescCleanAccent" },
    { id: "pNInz6obpgmx5142qiA7", name: "Adam", gender: "voiceMale", desc: "voiceDescNarrator" },
  ] },
  { langKey: "langArabic", voices: [
    { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "5Q0t7uMcgp8Aagzh1ZQQ", name: "Paul", gender: "voiceMale", desc: "voiceDescDeepAccent" },
  ] },
  { langKey: "langHindi", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescSoftAccent" },
    { id: "2EiwWnXF2V4j29thjbwy", name: "Clyde", gender: "voiceMale", desc: "voiceDescFriendlyAccent" },
  ] },
  { langKey: "langPortuguese", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescFriendlyAccent" },
    { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "voiceMale", desc: "voiceDescDeepAccent" },
  ] },
  { langKey: "langGerman", voices: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "voiceFemale", desc: "voiceDescCleanAccent" },
    { id: "pNInz6obpgmx5142qiA7", name: "Adam", gender: "voiceMale", desc: "voiceDescProfessional" },
  ] },
  { langKey: "langItalian", voices: [
    { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", gender: "voiceFemale", desc: "voiceDescWarmAccent" },
    { id: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "voiceMale", desc: "voiceDescDeep" },
  ] },
  { langKey: "langKorean", voices: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "voiceFemale", desc: "voiceDescFriendlyAccent" },
    { id: "29vD33N1CtxCmqQRPOHJ", name: "Drew", gender: "voiceMale", desc: "voiceDescProfessionalAccent" },
  ] },
];

const STOCK_VOICE_IDS = new Set(ELEVENLABS_VOICE_GROUPS.flatMap((g) => g.voices.map((v) => v.id)));

/** The cloned voice stored in a profile's settings, when there is a valid one. */
export function customVoiceOf(settings: { customVoice?: unknown } | null | undefined): CustomVoice | null {
  const v = settings?.customVoice as Partial<CustomVoice> | undefined;
  return v && typeof v.id === "string" && v.id ? { id: v.id, createdAt: String(v.createdAt || "") } : null;
}

/** Whether the plan lets the owner clone their voice. */
export function planAllowsVoiceClone(plan: string | null | undefined): boolean {
  return planConfig(plan).voiceClone;
}

/**
 * The voice a line actually speaks with: a stock voice, or the account's own
 * cloned voice while its plan includes cloning. Anything else, such as a voice
 * left behind by a downgrade or a deleted clone, is the default voice.
 */
export function effectiveVoiceId(
  requested: unknown,
  customVoice: CustomVoice | null,
  plan: string | null | undefined
): string {
  if (typeof requested !== "string" || !requested) return DEFAULT_VOICE_ID;
  if (STOCK_VOICE_IDS.has(requested)) return requested;
  if (customVoice && requested === customVoice.id && planAllowsVoiceClone(plan)) return requested;
  return DEFAULT_VOICE_ID;
}
