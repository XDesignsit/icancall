import { translations } from "@/lib/translations";
import homeEn from "@/lib/translations/home/en";
import { ADDON_PRICING, PLAN_PRICING } from "@/lib/pricing";
import { planFeatures } from "@/lib/planFeatures";
import { fill } from "@/lib/translations/home/format";

/**
 * Prelaunch edition served to non-bypassed clients while PRELAUNCH is on —
 * mirrors what human visitors see on /coming-soon (waitlist pitch, no
 * pricing). Copy comes from the same waitlist translations as that page.
 */
export function renderComingSoonMarkdown(): string {
  const t = translations.en;
  const w = t.waitlist!;

  return `# iCanCall — ${w.beFirstInLine} ${w.beFirstInLineAccent}

> ${w.launchingSoon}

${w.heroLead}

## ${w.demoSub}

${w.demoBody}.

## ${w.expectTitle}

${w.expectLead}

- **${w.expectCardTitle1}** — ${w.expectCardText1}
- **${w.expectCardTitle2}** — ${w.expectCardText2}
- **${w.expectCardTitle3}** — ${w.expectCardText3}

## ${w.reserveTitle}

${w.reserveText}. Join the waitlist at https://www.icancall.co/coming-soon

## Links

- [Join the waitlist](https://icancall.co/coming-soon)
- [Privacy Policy](https://icancall.co/privacy-policy)
- [Terms of Service](https://icancall.co/terms-of-service)

---

${t.footer.blurb}

${t.footer.allRights}
`;
}

/**
 * Renders the marketing homepage as Markdown for text/markdown clients
 * (LLM agents, CLI tools). Copy is pulled from the same translations used
 * by the React homepage (src/app/_home) so the two never drift apart.
 */
export function renderHomepageMarkdown(): string {
  const t = translations.en;
  const h = homeEn;
  const feats = planFeatures(t);
  const numberPrice = ADDON_PRICING.extraNumberLabel;

  const plans = [
    { title: t.pricing.essentialTitle, desc: t.pricing.essentialDesc, annual: t.ui.justPriceAnnualEssential, price: PLAN_PRICING.essential, feats: feats.essential, badge: "" },
    { title: t.pricing.proTitle, desc: t.pricing.proDesc, annual: t.ui.justPriceAnnualPro, price: PLAN_PRICING.pro, feats: feats.pro, badge: ` (${h.pricing.mostPopular})` },
    { title: t.pricing.careteamTitle, desc: t.pricing.careteamDesc, annual: t.ui.justPriceAnnualCareteam, price: PLAN_PRICING.careteam, feats: feats.careteam, badge: "" },
  ];

  const tiles = [h.features.phones, h.features.cascade, h.features.menu, h.features.voicemail, h.features.voice, h.features.dashboard, h.features.private];

  const usecases = h.usecases.cards.map((c, i) => ({ ...c, href: ["/parents", "/seniors", "/caregivers"][i] }));

  return `# iCanCall — ${h.hero.titleStart}${h.hero.titleAccent}

${h.hero.lead}

${fill(h.hero.fromPrice, { price: PLAN_PRICING.essential.monthlyLabel })} · ${h.hero.guarantee} · ${h.hero.noContracts}

## ${h.problem.titleStart}${h.problem.titleAccent}

${h.problem.lines.join(" ")}

## ${h.how.eyebrow}: ${h.how.title}

${h.how.steps.map((s, i) => `${i + 1}. **${s.title}** ${s.body}`).join("\n")}

## ${h.setup.title}

${h.setup.lead}

${h.setup.cards.map((c, i) => `${i + 1}. **${c.title}** ${c.body}`).join("\n")}

## ${h.usecases.eyebrow}: ${h.usecases.title}

${usecases.map((c) => `- **${c.audience}** — ${c.title} ${c.body} [${c.link}](https://icancall.co${c.href})`).join("\n")}

## ${h.features.eyebrow}: ${h.features.title}

${tiles.map((f) => `- **${f.title}** — ${f.body}`).join("\n")}

## ${h.trust.eyebrow}: ${h.trust.titleStart}${h.trust.titleAccent}

${h.trust.lead}

${h.trust.points.map((p) => `- ${p}`).join("\n")}

${h.trust.disclaimer}

## ${h.pricing.eyebrow}: ${h.pricing.title}

${h.pricing.lead}

${plans
  .map(
    (p) => `### ${p.title}${p.badge} — ${p.price.monthlyLabel}/month or ${p.price.annualLabel}/year

${p.desc} Annual billing: ${p.annual.toLowerCase()}.

${p.feats.map((f) => `- ${f}`).join("\n")}`,
  )
  .join("\n\n")}

### ${h.pricing.guaranteeTitle}

${h.pricing.guaranteeBody}

${fill(h.pricing.more, { numberPrice, minutesPrice: ADDON_PRICING.extraMinutesLabel })}

## ${h.faq.title}

${h.faq.items.map((f) => `### ${f.q}\n\n${fill(f.a, { numberPrice })}`).join("\n\n")}

## ${h.final.title}

${h.final.lead}

## Links

- [Sign up](https://app.icancall.co/signup)
- [Log in](https://app.icancall.co/login)
- [For Seniors](https://icancall.co/seniors)
- [For Parents](https://icancall.co/parents)
- [For Caregivers](https://icancall.co/caregivers)
- [Comparison Chart](https://icancall.co/comparison-chart)
- [Contact](https://icancall.co/contact)
- [Privacy Policy](https://icancall.co/privacy-policy)
- [Terms of Service](https://icancall.co/terms-of-service)

---

${h.footer.blurb}

${h.footer.copyright}
`;
}
