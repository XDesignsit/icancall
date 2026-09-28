// A plan change that waits for the end of the paid period, done with a Stripe
// Subscription Schedule: the subscription keeps its current price until the
// period ends, then moves to the target price. Used for annual → monthly, where
// switching at once would restart the billing cycle and leave the unused year
// as a credit on a later invoice.
//
// Stripe refuses direct edits to a subscription's cancellation while a
// schedule is attached, so anything that cancels or changes the plan releases
// the schedule first (releaseSchedule).

import type Stripe from "stripe";
import { entityId, stripe, subscriptionItem, subscriptionPeriod } from "@/lib/stripe";

/** Ends any schedule attached to the subscription. The subscription itself carries on unchanged. */
export async function releaseSchedule(sub: Stripe.Subscription): Promise<void> {
  const scheduleId = entityId(sub.schedule);
  if (scheduleId) await stripe().subscriptionSchedules.release(scheduleId);
}

/**
 * Moves the subscription to `targetPriceId` when its current period ends.
 * Returns the moment it takes effect (ISO). Replaces any schedule already
 * attached. Nothing is charged or credited now: the switch happens at the
 * renewal, which then bills the new price normally.
 */
export async function scheduleSwitchAtPeriodEnd(sub: Stripe.Subscription, targetPriceId: string): Promise<string> {
  const { priceId, units } = subscriptionItem(sub);
  const periodEnd = subscriptionPeriod(sub).end;
  if (!priceId || !periodEnd) throw new Error("subscription has no price or period to schedule against");

  await releaseSchedule(sub);

  const schedule = await stripe().subscriptionSchedules.create({ from_subscription: sub.id });
  try {
    const first = schedule.phases[0];
    // The subscription's metadata (user_id) is re-applied when each phase
    // starts, so the webhooks after the switch still find the account.
    const metadata = { ...sub.metadata };
    await stripe().subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          items: [{ price: priceId, quantity: units }],
          start_date: first.start_date,
          end_date: Math.floor(new Date(periodEnd).getTime() / 1000),
          proration_behavior: "none",
          metadata,
        },
        { items: [{ price: targetPriceId, quantity: units }], proration_behavior: "none", metadata },
      ],
    });
  } catch (err) {
    // Never leave a half-built schedule attached: it would block cancelling.
    await stripe().subscriptionSchedules.release(schedule.id).catch(() => {});
    throw err;
  }
  return periodEnd;
}
