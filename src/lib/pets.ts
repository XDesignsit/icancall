// Pet plans, sold on /pets. In the app they are one plan, "pets" (lib/planConfig:
// 1 number, caller menu only, 6 contacts, 30 minutes a year, no add-ons, no
// voice clone), bought on one of five terms. Annual is a yearly Stripe
// subscription and behaves like any annual plan; the other four are one-time
// payments that cover the pet for a fixed number of years.
//
// State on profiles.settings, written server-side only:
//   plan: "pets", billingCycle: "yearly" (minutes reset yearly either way)
//   petTerm            which term was bought
//   petPurchasedAt     when it was paid for (one-time terms also store it as
//                      stripe_period_start, the anchor for the yearly minute reset)
//   petCoverEndsAt     when a one-time term's cover ends (null for annual)
//   petCheckoutId      the paid Checkout Session of a one-time term, so the
//                      same payment cannot create two accounts

export type PetTerm = "annual" | "lifetime" | "small_bird_lifetime" | "parrot_10yr" | "parrot_20yr";

type Settings = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface PetTermConfig {
  id: PetTerm;
  name: string;
  /** US dollars. */
  amount: number;
  /** Annual renews yearly; the others are paid once. */
  oneTime: boolean;
  /** Years a one-time term covers (Lifetime ones are capped at 20). */
  years: number | null;
}

export const PET_TERMS: Record<PetTerm, PetTermConfig> = {
  annual: { id: "annual", name: "Pets Annual", amount: 29, oneTime: false, years: null },
  lifetime: { id: "lifetime", name: "Pets Lifetime", amount: 249, oneTime: true, years: 20 },
  small_bird_lifetime: { id: "small_bird_lifetime", name: "Small Bird Lifetime", amount: 249, oneTime: true, years: 20 },
  parrot_10yr: { id: "parrot_10yr", name: "Parrot 10-Year", amount: 179, oneTime: true, years: 10 },
  parrot_20yr: { id: "parrot_20yr", name: "Parrot 20-Year", amount: 349, oneTime: true, years: 20 },
};

/** Stripe price ids, from env (scripts/stripe-setup.mjs prints them). */
export const PET_PRICE_IDS: Record<PetTerm, string | undefined> = {
  annual: process.env.STRIPE_PRICE_ID_PETS_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_ID_PETS_LIFETIME,
  small_bird_lifetime: process.env.STRIPE_PRICE_ID_PETS_SMALL_BIRD_LIFETIME,
  parrot_10yr: process.env.STRIPE_PRICE_ID_PETS_PARROT_10YR,
  parrot_20yr: process.env.STRIPE_PRICE_ID_PETS_PARROT_20YR,
};

export function isPetTerm(v: unknown): v is PetTerm {
  return typeof v === "string" && v in PET_TERMS;
}

/** Which one-time pet term a Stripe price sells, or null (Annual maps through PLAN_PRICE_IDS like other plans). */
export function oneTimePetTermForPriceId(priceId: string | undefined | null): PetTerm | null {
  if (!priceId) return null;
  const term = (Object.keys(PET_PRICE_IDS) as PetTerm[]).find((t) => PET_TERMS[t].oneTime && PET_PRICE_IDS[t] === priceId);
  return term ?? null;
}

export const isPetsPlan = (plan: unknown): boolean => plan === "pets";

/** A pet account paid once (no subscription to renew, change or cancel). */
export function isOneTimePets(settings: Settings | null | undefined): boolean {
  return isPetsPlan(settings?.plan) && isPetTerm(settings?.petTerm) && PET_TERMS[settings.petTerm as PetTerm].oneTime;
}

/** When a one-time term's cover ends: `years` after purchase. */
export function petCoverEndsAt(term: PetTerm, purchasedAt: Date): string | null {
  const years = PET_TERMS[term].years;
  if (!PET_TERMS[term].oneTime || !years) return null;
  const end = new Date(purchasedAt.getTime());
  end.setUTCFullYear(end.getUTCFullYear() + years);
  return end.toISOString();
}

/** Line settings a pet line cannot change: the greeting is the fixed lost-pet one (api/twilio/voice). */
export const PET_LOCKED_LINE_SETTINGS = ["greeting", "greeting2", "greetingAudioPath", "promptRecordings", "ownVoice", "directConnect"] as const;

/** Pet numbers sit on microchips for years, so an ended pet plan keeps its number this long (other plans: GRACE_DAYS). */
export const PETS_GRACE_DAYS = 182;

/**
 * Whether a voicemail left while the line was out of minutes is still locked:
 * it opens once the account's minutes have reset since (a renewal, or the
 * yearly reset), which is what api/caregiver/recordings and the call log check.
 */
export function isVoicemailLocked(lockedAt: string | null | undefined, settings: Settings | null | undefined): boolean {
  if (!lockedAt) return false;
  const resetAt = Math.max(
    new Date(settings?.minutes_cycle_start || 0).getTime() || 0,
    new Date(settings?.stripe_period_start || 0).getTime() || 0,
  );
  return resetAt <= new Date(lockedAt).getTime();
}

/** Shown above the pay button. Pet plans have the service guarantee only, no change-of-mind refunds. */
export const PETS_REFUND_POLICY_NOTE =
  "Refund policy: if iCanCall doesn't work, contact support@icancall.co within 14 days of purchase. If we can't fix it, you get a full refund.";
