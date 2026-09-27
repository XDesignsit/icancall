// Around-the-clock coverage ("schedule" line mode): who a call rings first at
// a given moment. The voice webhooks and the dashboard both use this, so the
// timeline's "Active now" is exactly who a real call rings first.
//
// Time zone: the schedule runs on the account's time zone (Account → Profile),
// never the server's UTC clock. That setting is stored as one of the labels
// below; an account that has never saved one falls back to the called
// number's area-code region.

import { stateForAreaCode } from './areaCodeStates';
import { toE164 } from './phone';

/**
 * The labels offered by the Timezone select in AccountView (keep the two in
 * step), with the IANA zone each one means and its standard-time UTC offset.
 */
export const ACCOUNT_TIME_ZONES = [
  { label: 'Hawaii (HT)', iana: 'Pacific/Honolulu', stdOffsetMin: -600 },
  { label: 'Alaska (AKT)', iana: 'America/Anchorage', stdOffsetMin: -540 },
  { label: 'Pacific (PT)', iana: 'America/Los_Angeles', stdOffsetMin: -480 },
  { label: 'Mountain (MT)', iana: 'America/Denver', stdOffsetMin: -420 },
  { label: 'Central (CT)', iana: 'America/Chicago', stdOffsetMin: -360 },
  { label: 'Eastern (ET)', iana: 'America/New_York', stdOffsetMin: -300 },
  { label: 'Atlantic (AST)', iana: 'America/Puerto_Rico', stdOffsetMin: -240 },
  { label: 'London (GMT)', iana: 'Europe/London', stdOffsetMin: 0 },
  { label: 'Europe (CET)', iana: 'Europe/Paris', stdOffsetMin: 60 },
  { label: 'India (IST)', iana: 'Asia/Kolkata', stdOffsetMin: 330 },
  { label: 'Australia (AEST)', iana: 'Australia/Sydney', stdOffsetMin: 600 },
];

export const DEFAULT_ACCOUNT_TIME_ZONE = 'Pacific (PT)';

// Dominant zone for each area-code region, for accounts with no stored zone.
const REGION_TIME_ZONES: Record<string, string> = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix', AR: 'America/Chicago',
  CA: 'America/Los_Angeles', CO: 'America/Denver', CT: 'America/New_York', DE: 'America/New_York',
  DC: 'America/New_York', FL: 'America/New_York', GA: 'America/New_York', HI: 'Pacific/Honolulu',
  ID: 'America/Boise', IL: 'America/Chicago', IN: 'America/Indiana/Indianapolis', IA: 'America/Chicago',
  KS: 'America/Chicago', KY: 'America/New_York', LA: 'America/Chicago', ME: 'America/New_York',
  MD: 'America/New_York', MA: 'America/New_York', MI: 'America/Detroit', MN: 'America/Chicago',
  MS: 'America/Chicago', MO: 'America/Chicago', MT: 'America/Denver', NE: 'America/Chicago',
  NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York', NM: 'America/Denver',
  NY: 'America/New_York', NC: 'America/New_York', ND: 'America/Chicago', OH: 'America/New_York',
  OK: 'America/Chicago', OR: 'America/Los_Angeles', PA: 'America/New_York', RI: 'America/New_York',
  SC: 'America/New_York', SD: 'America/Chicago', TN: 'America/Chicago', TX: 'America/Chicago',
  UT: 'America/Denver', VT: 'America/New_York', VA: 'America/New_York', WA: 'America/Los_Angeles',
  WV: 'America/New_York', WI: 'America/Chicago', WY: 'America/Denver',
  PR: 'America/Puerto_Rico', VI: 'America/St_Thomas', GU: 'Pacific/Guam', AS: 'Pacific/Pago_Pago',
  MP: 'Pacific/Saipan', TT: 'America/Port_of_Spain', BB: 'America/Barbados', JM: 'America/Jamaica',
};

/** The IANA zone for an account time zone label, if it is one of ours. */
export function timeZoneForLabel(label: unknown): string | undefined {
  return ACCOUNT_TIME_ZONES.find((z) => z.label === label)?.iana;
}

/**
 * The IANA zone a line's schedule runs on: the account's stored time zone,
 * else the region of the line's own area code, else the dashboard's default.
 */
export function scheduleTimeZone(accountTimeZone: unknown, lineNumber: string): string {
  const stored = timeZoneForLabel(accountTimeZone);
  if (stored) return stored;
  const national = lineNumber.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  const region = stateForAreaCode(national.slice(0, 3));
  return (region && REGION_TIME_ZONES[region.abbr]) || timeZoneForLabel(DEFAULT_ACCOUNT_TIME_ZONE)!;
}

/**
 * The account time zone label matching this browser's standard-time offset,
 * used as the default before the owner picks one. Client-side only.
 */
export function guessAccountTimeZone(): string {
  const year = new Date().getFullYear();
  const offsets = [new Date(year, 0, 1), new Date(year, 6, 1)].map((d) => d.getTimezoneOffset());
  // getTimezoneOffset is minutes *behind* UTC, and daylight time is the smaller of the two.
  const stdOffsetMin = -Math.max(...offsets);
  return ACCOUNT_TIME_ZONES.find((z) => z.stdOffsetMin === stdOffsetMin)?.label ?? DEFAULT_ACCOUNT_TIME_ZONE;
}

/** Hour of the day (0 to 24, fractional) at `date` in `timeZone`. */
export function hourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  return part('hour') + part('minute') / 60;
}

interface SlotLike {
  name?: unknown;
  startHour?: unknown;
  endHour?: unknown;
}

function slotCovers(slot: SlotLike, hour: number): boolean {
  const start = Number(slot.startHour);
  const end = Number(slot.endHour);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;
  // A slot that ends earlier than it starts runs past midnight (22 → 6).
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** The slot covering `hour`; when slots overlap, the first one listed wins. */
export function activeCoverageSlot<T extends SlotLike>(schedule: T[] | null | undefined, hour: number): T | undefined {
  return (Array.isArray(schedule) ? schedule : []).find((slot) => slotCovers(slot, hour));
}

const sameName = (a: unknown, b: unknown) =>
  typeof a === 'string' && typeof b === 'string' && a.trim() !== '' && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Index into `contacts` of the circle member on duty at `hour`, or null when
 * no slot covers that hour or its slot names someone outside the circle
 * (slots reference contacts by name).
 */
export function onDutyContactIndex(
  schedule: SlotLike[] | null | undefined,
  contacts: { name?: unknown }[],
  hour: number
): number | null {
  const slot = activeCoverageSlot(schedule, hour);
  if (!slot) return null;
  const idx = contacts.findIndex((c) => sameName(c.name, slot.name));
  return idx === -1 ? null : idx;
}

/**
 * Who a cascade rings, in order: every Available contact with a phone number,
 * in circle order, except that `leadIndex` (the on-duty member) goes first
 * when it is one of them. A Busy or missing lead leaves the plain cascade.
 * A contact who is the caller -- a circle member phoning the line -- is left
 * out: ringing them would only ring the phone they are calling from. Every
 * leg of one call must pass the same caller, as legs find their place in this
 * list by index.
 */
export function cascadeOrder<T extends { available?: unknown; phone?: unknown }>(
  contacts: T[],
  leadIndex: number | null,
  callerNumber?: string | null
): (T & { phone: string })[] {
  const caller = toE164(callerNumber);
  const reachable = (c: T | undefined): c is T & { phone: string } =>
    Boolean(c?.available && c.phone && (!caller || toE164(String(c.phone)) !== caller));
  const inOrder = contacts.filter(reachable);
  const lead = leadIndex === null ? undefined : contacts[leadIndex];
  return reachable(lead) ? [lead, ...inOrder.filter((c) => c !== lead)] : inOrder;
}

/** Reads the `lead` query value the webhooks pass between cascade legs. */
export function parseLeadIndex(value: string | null | undefined): number | null {
  if (value === null || value === undefined || !/^\d+$/.test(value)) return null;
  return Number(value);
}
