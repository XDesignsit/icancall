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
