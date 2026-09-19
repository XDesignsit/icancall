import { NextRequest, NextResponse } from "next/server";
import { isMock, supabase } from "@/lib/supabase";
import { subscriptionLiveness } from "@/lib/creem";
import {
  REACTIVATED_PATCH,
  REMINDER_DAYS_BEFORE,
  isEndedStatus,
  releaseAccountNumbers,
  sendReleaseReminderEmail,
  type Settings,
} from "@/lib/subscriptionEnd";

// Daily job (vercel.json → crons). For accounts whose subscription has ended:
// sends a last-call email a week before the numbers go, and releases the
// numbers once the grace period is over.
//
// Releasing a number is irreversible, so this fails closed at every step:
//   - no CRON_SECRET, or a caller without it      → refuses to run
//   - no Creem credentials to double-check with   → releases nothing
//   - Creem cannot be reached, or answers oddly   → releases nothing
//   - Creem says the subscription is not over after all (a missed webhook)
//                                                  → reactivates instead
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("release-ended-numbers: CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The local mock client only implements eq(); it filters in memory instead.
  const query = supabase.from("profiles").select("id, email, settings");
  const { data, error } = isMock ? await query : await query.not("settings->>numbersReleaseAt", "is", null);
  if (error) {
    console.error("release-ended-numbers: could not list profiles:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const now = Date.now();
  const summary = { checked: 0, reminded: 0, released: 0, reactivated: 0, skipped: 0 };

  for (const profile of (data || []) as { id: string; email: string; settings: Settings }[]) {
    const s = profile.settings || {};
    if (!s.numbersReleaseAt || s.numbersReleasedAt || !isEndedStatus(s.subscriptionStatus)) continue;
    summary.checked++;
    const releaseAt = new Date(s.numbersReleaseAt).getTime();

    if (releaseAt > now) {
      const reminderDue = releaseAt - now <= REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000;
      if (reminderDue && !s.releaseReminderSentAt && profile.email) {
        await sendReleaseReminderEmail(profile.email, s.numbersReleaseAt);
        await supabase.from("profiles").update({ settings: { ...s, releaseReminderSentAt: new Date().toISOString() } }).eq("id", profile.id);
        summary.reminded++;
      }
      continue;
    }

    // Due. Ask Creem before doing anything that cannot be undone.
    if (!process.env.CREEM_API_KEY || typeof s.creem_subscription_id !== "string" || !s.creem_subscription_id) {
      console.error(`release-ended-numbers: cannot verify ${profile.id} with Creem — leaving its numbers alone.`);
      summary.skipped++;
      continue;
    }
    const liveness = await subscriptionLiveness(s.creem_subscription_id);
    if (liveness.state === "unknown") {
      console.error(`release-ended-numbers: Creem could not confirm ${profile.id} has ended — leaving its numbers alone.`);
      summary.skipped++;
      continue;
    }
    if (liveness.state === "live") {
      console.warn(`release-ended-numbers: ${profile.id} is not ended at Creem after all — reactivating instead of releasing.`);
      await supabase
        .from("profiles")
        .update({
          settings: {
            ...s,
            ...REACTIVATED_PATCH,
            ...(liveness.purchase ? { plan: liveness.purchase.plan, billingCycle: liveness.purchase.billingCycle } : {}),
          },
        })
        .eq("id", profile.id);
      summary.reactivated++;
      continue;
    }

    try {
      const numbers = await releaseAccountNumbers({ id: profile.id, settings: s });
      console.log(`release-ended-numbers: released ${numbers.length} number(s) for ${profile.id}: ${numbers.join(", ")}`);
      summary.released++;
    } catch (err) {
      console.error(`release-ended-numbers: failed for ${profile.id}:`, err);
      summary.skipped++;
    }
  }

  return NextResponse.json({ success: true, ...summary });
}
