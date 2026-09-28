// Single source of truth for plan pricing shown on marketing surfaces:
// the homepage (src/app/page.tsx), its markdown edition
// (src/lib/homepage-markdown.ts), and /llms.txt (src/app/llms.txt/route.ts).
//
// When prices change, also update:
// - PLANS in src/app/signup/page.tsx (checkout amounts; compiled into the
//   standalone signup HTML, so follow the repack/sync steps in AGENTS.md)
// - ui.justPriceAnnualEssential / ui.justPriceAnnualPro copy strings in
//   src/lib/translations.ts (all languages)
export const PLAN_PRICING = {
  essential: {
    monthlyAmount: 14.99,
    annualAmount: 149,
    monthlyLabel: "$14.99",
    annualLabel: "$149",
    voiceMinutes: 30,
  },
  pro: {
    monthlyAmount: 24.99,
    annualAmount: 249,
    monthlyLabel: "$24.99",
    annualLabel: "$249",
    voiceMinutes: 60,
  },
  careteam: {
    monthlyAmount: 49.99,
    annualAmount: 499,
    monthlyLabel: "$49.99",
    annualLabel: "$499",
    voiceMinutes: 150,
  },
} as const;

// Add-on prices quoted on the homepage (pricing footnote and FAQ). They must
// match what checkout actually charges: the Stripe add-on prices and the
// dashboard's add-on stepper (src/app/dashboard/views/AccountView.tsx).
// The comparison chart spells the number price out per language
// (nAddonPrice in src/app/comparison-chart/page.tsx and the standalone
// ICanCall_Comparison_Chart.html), so update it there too.
export const ADDON_PRICING = {
  /** Extra phone number, recurring monthly */
  extraNumberLabel: "$6.99",
  /** One-time block of 30 extra voice minutes */
  extraMinutesLabel: "$4.99",
} as const;
