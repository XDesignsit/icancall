// The voice-minute pool runs on a monthly cycle for every plan. Monthly
// subscriptions reset when Creem reports the renewal payment
// (api/creem/webhook). Annual subscriptions are only charged once a year, so
// the daily job api/cron/reset-annual-minutes gives them the same monthly
// reset, counted from the day their billing period started.

import { planConfig } from "@/lib/planConfig";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Starts a new minutes cycle. Add-on minutes are one-time credits: blocks
 * bought this cycle plus whatever was carried over. Plan minutes are used
 * first; the credits that are left roll over, and the purchase itself does
 * not repeat. Returns the `addons` value to store.
 */
export function resetMinutesPool(settings: Settings): Settings {
  const addons = settings.addons || {};
  const planBaseMinutes = planConfig(settings.plan || "essential").voiceMinutes;
  const creditMinutes = (addons.minuteBlocks || 0) * 30 + (addons.rolloverMin || 0);
  const usedMin = Math.min(addons.usedMin || 0, planBaseMinutes + creditMinutes);
  const rolloverMin = Math.max(0, creditMinutes - Math.max(0, usedMin - planBaseMinutes));
  return { ...addons, usedMin: 0, minuteBlocks: 0, rolloverMin };
}

/** `months` calendar months after `from` (UTC), keeping the day of month where the month has it (Jan 31 → Feb 28). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * The start of the monthly minutes cycle that `now` falls in, for a billing
 * period that began at `periodStart`. Always counted from the period start
 * itself, so month lengths never make it drift.
 */
export function currentMinutesCycleStart(periodStart: Date, now: Date): Date {
  let n = Math.max(0, (now.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 + now.getUTCMonth() - periodStart.getUTCMonth());
  while (n > 0 && addMonths(periodStart, n).getTime() > now.getTime()) n--;
  return addMonths(periodStart, n);
}
