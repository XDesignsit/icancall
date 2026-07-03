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
    monthlyLabel: "$14.99",
    annualLabel: "$149",
    voiceMinutes: 30,
  },
  pro: {
    monthlyLabel: "$24.99",
    annualLabel: "$249",
    voiceMinutes: 60,
  },
} as const;
