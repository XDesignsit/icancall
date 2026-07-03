import { translations } from "@/lib/translations";

// llms.txt per https://llmstxt.org: H1, blockquote summary, then ## sections
// of markdown links. Points agents at the markdown edition of the homepage
// (/index.md) and the other public marketing pages.
export async function GET() {
  const t = translations.en;

  const body = `# iCanCall

> ${t.hero.lead} ${t.footer.blurb}

iCanCall is a virtual phone routing service: one dedicated, memorable phone number that rings a circle of up to six trusted contacts — in sequence (Call Cascade) or via a spoken menu — until someone answers. No hardware, no apps; works from any landline, flip phone, or smartphone. Plans: Essential $14.99/mo or $149/yr (1 number, 3 contacts, 30 voice minutes) and Pro $24.99/mo or $249/yr (2 numbers, 6 contacts, 60 minutes, scheduling, voicemail transcription). ${t.pricing.shortGuarantee}.

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

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
