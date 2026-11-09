// The voice-minute pool runs on a monthly cycle for every plan except pets,
// whose 30 minutes are per year (minutesCycleMonths). Monthly
// subscriptions reset when Stripe reports the renewal invoice paid
// (api/billing/webhook). Annual subscriptions are only charged once a year, so
// the daily job api/cron/reset-annual-minutes gives them the same monthly
// reset, counted from the day their billing period started.

import { planConfig } from "@/lib/planConfig";
import { isOneTimePets, isPetsPlan } from "@/lib/pets";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * The cycle's whole minute pool, in talk minutes, the unit `addons.usedMin`
 * counts: the plan's minutes, the 30-minute blocks bought this cycle and the
 * minutes rolled over. The dashboard shows usedMin against this, and the voice
 * webhook stops connecting calls once it is used up.
 */
export function minutePool(plan: string, addons: Settings = {}): number {
  return planConfig(plan).voiceMinutes + Number(addons.minuteBlocks || 0) * 30 + Number(addons.rolloverMin || 0);
}

/**
 * The owner is alerted once a cycle when this share of the pool is used, and
 * again when it is all used (lib/minuteAlerts). 85% matches the dashboard's
 * "Running low" badge, which shows at 15% left.
 */
export const LOW_MINUTES_SHARE = 0.85;

/** Minutes used at which each alert goes out, for a pool of `pool` minutes. */
export function minuteAlertThresholds(pool: number): { low: number; out: number } {
  return { low: Math.ceil(pool * LOW_MINUTES_SHARE), out: pool };
}

/**
 * Drops the alert markers (set by the claim_minute_alert database function)
 * that no longer hold once the pool has grown, so a top-up re-arms the alert
 * it moved the account back below, and only that one. Returns the `addons`
 * value to store.
 */
export function rearmMinuteAlerts(plan: string, addons: Settings): Settings {
  const next = { ...addons };
  const used = Number(next.usedMin || 0);
  const { low, out } = minuteAlertThresholds(minutePool(plan, next));
  if (used < out) delete next.outMinAlertedAt;
  if (used < low) delete next.lowMinAlertedAt;
  return next;
}

/** Minutes a call is charged: its talk time, rounded up to the minute as carriers bill it. */
export function billedMinutes(talkSeconds: number | null | undefined): number {
  return talkSeconds && talkSeconds > 0 ? Math.ceil(talkSeconds / 60) : 0;
}

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
  // A new cycle re-arms both minute alerts.
  const { lowMinAlertedAt: _low, outMinAlertedAt: _out, ...rest } = addons;
  return { ...rest, usedMin: 0, minuteBlocks: 0, rolloverMin };
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

/** Length of an account's minutes cycle in months: a year for pet plans, a month for everyone else. */
export function minutesCycleMonths(settings: Settings): number {
  return isPetsPlan(settings?.plan) ? 12 : 1;
}

/**
 * The start of the minutes cycle (`months` long, monthly by default) that
 * `now` falls in, for a billing period that began at `periodStart`. Always
 * counted from the period start itself, so month lengths never make it drift.
 */
export function currentMinutesCycleStart(periodStart: Date, now: Date, months = 1): Date {
  let n = Math.max(0, Math.floor(((now.getUTCFullYear() - periodStart.getUTCFullYear()) * 12 + now.getUTCMonth() - periodStart.getUTCMonth()) / months));
  while (n > 0 && addMonths(periodStart, n * months).getTime() > now.getTime()) n--;
  return addMonths(periodStart, n * months);
}

/**
 * The next dates the billing card shows, worked out from the period Stripe
 * last reported (settings.stripe_period_start) rather than typed in:
 *
 *   billingRenewsAt — when the plan is next charged: a month or a year after
 *                     the period started.
 *   minutesResetsAt — when the voice-minute pool next resets: the next monthly
 *                     cycle, for annual plans too (see the cron above).
 *
 * Null when there is no honest date to show: no period recorded (demo
 * accounts, or nothing paid yet), the plan has ended, or it is set to end
 * before that date. Both are ISO strings.
 */
export function renewalDates(settings: Settings, now: Date = new Date()): { billingRenewsAt: string | null; minutesResetsAt: string | null } {
  const none = { billingRenewsAt: null, minutesResetsAt: null };
  const start = new Date(settings.stripe_period_start || "");
  if (Number.isNaN(start.getTime())) return none;

  const status = settings.subscriptionStatus;
  if (status === "canceled" || status === "expired") return none;
  const endsAt = status === "scheduled_cancel" && settings.subscriptionEndsAt ? new Date(settings.subscriptionEndsAt) : null;

  // The first renewal after now. Counted from the period start (like the
  // minutes cycle) so month lengths never make it drift, and stepping forward
  // if a renewal webhook has not been recorded yet.
  const stepMonths = settings.billingCycle === "yearly" ? 12 : 1;
  let n = 1;
  while (addMonths(start, n * stepMonths).getTime() <= now.getTime() && n < 1000) n++;
  const renews = addMonths(start, n * stepMonths);

  const cycleMonths = minutesCycleMonths(settings);
  const minutesReset = addMonths(currentMinutesCycleStart(start, now, cycleMonths), cycleMonths);
  const beforeEnd = (d: Date) => !endsAt || d.getTime() < endsAt.getTime();
  return {
    // A plan that is set to end does not renew, it ends: the cancel section says when.
    // A one-time pet term never renews.
    billingRenewsAt: endsAt || isOneTimePets(settings) ? null : renews.toISOString(),
    minutesResetsAt: beforeEnd(minutesReset) ? minutesReset.toISOString() : null,
  };
}
