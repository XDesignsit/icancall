import type { PlanId } from "@/lib/planConfig";

/* Shared shapes for the dashboard views. */

export interface Contact {
  id: string;
  name: string;
  rel: string;
  phone: string;
  color: string;
  available: boolean;
  voicePath?: string;
}

export interface CoverageSlot {
  id: string;
  name: string;
  description: string;
  startHour: number;
  endHour: number;
  color: string;
}

export interface Line {
  id: string;
  label: string;
  person: string;
  number: string;
  color: string;
  mode: "menu" | "cascade" | "simultaneous" | "schedule";
  minutesUsed: number;
  contacts: Contact[];
  schedule?: CoverageSlot[];
  settings?: {
    greeting?: string;
    /** Bilingual Support (lib/callPrompts): off unless true. */
    bilingual?: boolean;
    /** The second language's code ("es"); older lines hold its name ("Spanish"). */
    language2?: string;
    /** Custom greeting for callers who switch to the second language; empty uses the standard one, translated. */
    greeting2?: string;
    notifSMS?: boolean;
    notifEmail?: boolean;
    notifMissed?: boolean;
    notifWeekly?: boolean;
    greetingAudioPath?: string;
    voiceId?: string;
    /** Skip the "Press 1" prompt and name each contact as it is rung (lib/cascadeAnnounce). Not for the caller menu. */
    directConnect?: boolean;
    /** Which own voice the line uses: an ElevenLabs clone, or the prompts recorded one by one (lib/promptRecordings). */
    ownVoice?: "clone" | "recorded";
    /** Prompt recordings by the exact English sentence they say (lib/promptRecordings). */
    promptRecordings?: Record<string, { path: string; recordedAt: string }>;
  };
}

export interface CallLogEntry {
  id: number | string;
  status: "connected" | "missed" | "voicemail";
  caller: string;
  routed: string;
  rel: string;
  dur: string;
  when: string;
  /** When the call came in (ISO), for calls from the call log API. */
  at?: string;
  transcript?: string | null;
  /** The voicemail's audio, for voicemail calls from the call log API. */
  recordingUrl?: string | null;
  /** A pet line's voicemail left while out of minutes: closed until the minutes reset (lib/pets). */
  locked?: boolean;
}

export interface Account {
  name: string;
  preferred: string;
  email: string;
  notifyEmail: string;
  phone: string;
  /** Text call alerts: on only for a number verified through api/caregiver/sms-alerts or signup. */
  smsConsent?: boolean;
  smsPhone?: string;
  address: string;
  timezone: string;
  language: string;
  twoFactor: boolean;
  card: { brand: string; last4: string; exp: string };
  billingAddr: string;
  plan: PlanId;
  billingCycle: "monthly" | "yearly";
  /** Pet plans (lib/pets): the term bought, and when a one-time term's cover ends. */
  petTerm?: string;
  petCoverEndsAt?: string | null;
  /** Stripe subscription state, written server-side only. "scheduled_cancel" = cancelled but active until subscriptionEndsAt. */
  subscriptionStatus?: string;
  subscriptionEndsAt?: string | null;
  /** Next charge, and next voice-minute reset (ISO). Derived server-side from Stripe's billing period; null when there is no honest date to show. */
  billingRenewsAt?: string | null;
  minutesResetsAt?: string | null;
  /** A plan change waiting for the end of the paid period (annual → monthly). Written server-side only. */
  pendingPlanChange?: { plan: PlanId; billingCycle: "monthly" | "yearly"; effectiveAt: string } | null;
  /** Set once the subscription has really ended: numbers are held until numbersReleaseAt, then released. */
  subscriptionEndedAt?: string | null;
  numbersReleaseAt?: string | null;
  numbersReleasedAt?: string | null;
  addons: {
    extraNumbers: number;
    minuteBlocks: number;
    usedMin: number;
    rolloverMin: number;
  };
  avatarUrl?: string;
  /** The owner's cloned voice (api/caregiver/voice-clone); set server-side only. */
  customVoice?: { id: string; createdAt: string } | null;
}

export type PickerNumber = { id: string; number: string; area: string; memorable: string | null };
