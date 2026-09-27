import type { HomepageTranslations } from "@/lib/translations";
import { PLAN_PRICING } from "@/lib/pricing";

export type MarketingPlanId = keyof typeof PLAN_PRICING;

/**
 * The feature list advertised for each plan on the homepage pricing cards and
 * the homepage's markdown edition, in display order, in the given language.
 */
export function planFeatures(t: HomepageTranslations): Record<MarketingPlanId, string[]> {
  return {
    essential: [
      t.pricing.eFeat1,
      t.pricing.eFeat2,
      t.pricing.eFeat3,
      `${PLAN_PRICING.essential.voiceMinutes} ${t.ui.voiceMinutes}`,
      t.pricing.eFeat4,
      t.pricing.eFeat5,
      t.ui.worksOnAnyPhoneNoApp,
      t.pricing.shortGuarantee,
    ],
    pro: [
      t.pricing.pFeat1,
      t.pricing.pFeat2,
      t.pricing.eFeat3,
      `${PLAN_PRICING.pro.voiceMinutes} ${t.ui.minutesIncluded}`,
      t.pricing.pFeat3,
      t.pricing.eFeat5,
      t.pricing.pFeat4,
      t.pricing.pFeat5,
      t.ui.worksOnAnyPhoneNoApp,
      t.pricing.shortGuarantee,
    ],
    careteam: [
      t.pricing.cFeat1,
      t.pricing.cFeat2,
      t.pricing.cFeat3,
      `${PLAN_PRICING.careteam.voiceMinutes} ${t.ui.minutesIncluded}`,
      t.pricing.cFeat5,
      t.ui.worksOnAnyPhoneNoApp,
      t.pricing.shortGuarantee,
    ],
  };
}
