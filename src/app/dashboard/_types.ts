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
    bilingual?: boolean;
    language2?: string;
    notifSMS?: boolean;
    notifEmail?: boolean;
    notifMissed?: boolean;
    notifWeekly?: boolean;
    greetingAudioPath?: string;
    voiceId?: string;
  };
}

export interface CallLogEntry {
  id: number;
  status: "connected" | "missed" | "voicemail";
  caller: string;
  routed: string;
  rel: string;
  dur: string;
  when: string;
}

export interface Account {
  name: string;
  preferred: string;
  email: string;
  notifyEmail: string;
  phone: string;
  address: string;
  timezone: string;
  language: string;
  twoFactor: boolean;
  card: { brand: string; last4: string; exp: string };
  billingAddr: string;
  plan: PlanId;
  billingCycle: "monthly" | "yearly";
  addons: {
    extraNumbers: number;
    minuteBlocks: number;
    usedMin: number;
    rolloverMin: number;
  };
  avatarUrl?: string;
}

export type PickerNumber = { id: string; number: string; area: string; memorable: string | null };
