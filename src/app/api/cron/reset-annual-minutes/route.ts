import { NextRequest, NextResponse } from "next/server";
import { isMock, supabase } from "@/lib/supabase";
import { isEndedStatus } from "@/lib/subscriptionEnd";
import { currentMinutesCycleStart, resetMinutesPool } from "@/lib/minutesCycle";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

// Daily job (vercel.json → crons). Annual subscriptions pay once a year, so
// Creem's renewal webhook would only reset their minutes yearly. This gives
// them the monthly reset every plan promises, on the monthly anniversary of
// the day their billing period started (settings.creem_period_start).
//
//   - monthly subscribers are left to the webhook
//   - an ended subscription gets no new minutes
//   - an account whose period start was never recorded is skipped, not guessed
//   - settings.minutes_cycle_start remembers the cycle already handled, so
//     running twice in a day (or missing a day) resets exactly once per cycle
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("reset-annual-minutes: CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The local mock client only implements eq(); it filters in memory instead.
  const query = supabase.from("profiles").select("id, settings");
  const { data, error } = isMock ? await query : await query.eq("settings->>billingCycle", "yearly");
  if (error) {
    console.error("reset-annual-minutes: could not list profiles:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const now = new Date();
  const summary = { checked: 0, reset: 0, skipped: 0 };

  for (const profile of (data || []) as { id: string; settings: Settings }[]) {
    const s = profile.settings || {};
    if (s.billingCycle !== "yearly" || isEndedStatus(s.subscriptionStatus)) continue;
    summary.checked++;

    const periodStart = new Date(s.creem_period_start || "");
    if (Number.isNaN(periodStart.getTime()) || periodStart.getTime() > now.getTime()) {
      summary.skipped++;
      continue;
    }

    const cycleStart = currentMinutesCycleStart(periodStart, now);
    const handled = new Date(s.minutes_cycle_start || s.creem_period_start).getTime();
    if (cycleStart.getTime() <= handled) continue;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ settings: { ...s, addons: resetMinutesPool(s), minutes_cycle_start: cycleStart.toISOString() } })
      .eq("id", profile.id);
    if (updateError) {
      console.error(`reset-annual-minutes: could not reset ${profile.id}:`, updateError);
      summary.skipped++;
      continue;
    }
    console.log(`Monthly minutes reset for annual plan ${profile.id} (cycle from ${cycleStart.toISOString()})`);
    summary.reset++;
  }

  return NextResponse.json({ success: true, ...summary });
}
