import type { NextRequest } from "next/server";
import { translations } from "@/lib/translations";
import { PLAN_PRICING } from "@/lib/pricing";
import { PRELAUNCH, isPrelaunchGated } from "@/lib/prelaunch";

// llms.txt per https://llmstxt.org: H1, blockquote summary, then ## sections
// of markdown links. Points agents at the markdown edition of the homepage
// (/index.md) and the other public marketing pages. While the prelaunch gate
// is on, non-bypassed clients get the waitlist edition instead — matching
// what human visitors see on /coming-soon.
export async function GET(request: NextRequest) {
  const t = translations.en;

  const fullBody = `# iCanCall

> ${t.hero.lead} ${t.footer.blurb}

iCanCall is a virtual phone routing service: one dedicated, memorable phone number that rings a circle of up to six trusted contacts — in sequence (Call Cascade), simultaneously (Simultaneous Ring), or via a spoken menu — until someone answers. No hardware, no apps; works from any landline, flip phone, or smartphone. Plans: Essential ${PLAN_PRICING.essential.monthlyLabel}/mo or ${PLAN_PRICING.essential.annualLabel}/yr (1 number, 3 contacts, ${PLAN_PRICING.essential.voiceMinutes} voice minutes) and Pro ${PLAN_PRICING.pro.monthlyLabel}/mo or ${PLAN_PRICING.pro.annualLabel}/yr (2 numbers, 6 contacts, ${PLAN_PRICING.pro.voiceMinutes} minutes, scheduling, voicemail transcription). ${t.pricing.shortGuarantee}.

## Docs

- [Homepage (Markdown)](https://icancall.co/index.md): Full marketing homepage as markdown — features, pricing, FAQ, and testimonials

## Pages

- [For Seniors](https://icancall.co/seniors): ${t.usecases.u2Desc}
- [For Parents](https://icancall.co/parents): ${t.usecases.u1Desc}
- [For Caregivers](https://icancall.co/caregivers): Coordinate a care circle with schedules, instant alerts, and voicemail transcriptions that keep every caregiver in the loop
- [Comparison Chart](https://icancall.co/comparison-chart): How iCanCall compares to alternatives

## Optional

- [Sign up](https://app.icancall.co/signup): Create an account and choose a plan
- [Log in](https://app.icancall.co/login): Existing customer dashboard
- [Privacy Policy](https://icancall.co/privacy-policy)
- [Terms of Service](https://icancall.co/terms-of-service)
`;

  const w = t.waitlist!;
  const prelaunchBody = `# iCanCall

> ${w.launchingSoon}. ${w.heroLead}

iCanCall is a virtual phone routing service launching soon: one dedicated, memorable phone number that rings a circle of trusted family contacts until someone answers — no hardware, no apps. It is currently in private early access; join the waitlist for first pick of memorable numbers and founding-member pricing.

## Docs

- [About iCanCall (Markdown)](https://icancall.co/index.md): Prelaunch overview — what iCanCall does and what waitlist members can expect

## Pages

- [Join the waitlist](https://icancall.co/coming-soon): ${w.reserveText}

## Optional

- [Privacy Policy](https://icancall.co/privacy-policy)
- [Terms of Service](https://icancall.co/terms-of-service)
`;

  return new Response(isPrelaunchGated(request) ? prelaunchBody : fullBody, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Cookie-dependent while the gate is on — see src/app/index.md/route.ts
      "Cache-Control": PRELAUNCH ? "no-store" : "public, max-age=3600",
    },
  });
}
