import { translations } from "@/lib/translations";

// Dollar amounts and minute allowances mirror the values hardcoded in the
// pricing cards of src/app/page.tsx — keep both in sync.
const PRICING = {
  essential: { monthly: "$14.99/month", annual: "$149/year", minutes: 30 },
  pro: { monthly: "$24.99/month", annual: "$249/year", minutes: 60 },
};

/**
 * Renders the marketing homepage as Markdown for text/markdown clients
 * (LLM agents, CLI tools). Copy is pulled from the same translations used
 * by the React homepage so the two never drift apart.
 */
export function renderHomepageMarkdown(): string {
  const t = translations.en;

  const essentialFeatures = [
    t.pricing.eFeat1,
    t.pricing.eFeat2,
    t.pricing.eFeat3,
    `${PRICING.essential.minutes} ${t.ui.voiceMinutes}`,
    t.pricing.eFeat4,
    t.pricing.eFeat5,
    t.ui.worksOnAnyPhoneNoApp,
    t.pricing.shortGuarantee,
  ];

  const proFeatures = [
    t.pricing.pFeat1,
    t.pricing.pFeat2,
    t.pricing.eFeat3,
    `${PRICING.pro.minutes} ${t.ui.minutesIncluded}`,
    t.pricing.pFeat3,
    t.pricing.eFeat5,
    t.pricing.pFeat4,
    t.pricing.pFeat5,
    t.ui.worksOnAnyPhoneNoApp,
    t.pricing.shortGuarantee,
  ];

  const faqs = [
    [t.faq.q1, t.faq.a1],
    [t.faq.q2, t.faq.a2],
    [t.faq.q3, t.faq.a3],
    [t.faq.q4, t.faq.a4],
    [t.faq.q5, t.faq.a5],
    [t.faq.q6, t.faq.a6],
  ];

  const testimonials = [
    [t.testimonials.t1Quote, t.testimonials.t1By, t.testimonials.t1Role],
    [t.testimonials.t2Quote, t.testimonials.t2By, t.testimonials.t2Role],
    [t.testimonials.t3Quote, t.testimonials.t3By, t.testimonials.t3Role],
  ];

  return `# iCanCall — ${t.hero.titleAccent}${t.hero.titleRest}

${t.hero.lead}

${t.hero.trustLine}

## ${t.steps.title}

${t.steps.lead}

1. **${t.steps.step1Title.replace(/^\d+\.\s*/, "")}** — ${t.steps.step1Desc}
2. **${t.steps.step2Title.replace(/^\d+\.\s*/, "")}** — ${t.steps.step2Desc}
3. **${t.steps.step3Title.replace(/^\d+\.\s*/, "")}** — ${t.steps.step3Desc}

## ${t.features.title}

${t.features.lead}

- **${t.features.f1Title}** — ${t.features.f1Desc}
- **${t.features.f2Title}** — ${t.features.f2Desc}
- **${t.features.f3Title}** — ${t.features.f3Desc}
- **${t.features.f4Title}** — ${t.features.f4Desc}
- **${t.features.f5Title}** — ${t.features.f5Desc}
- **${t.features.f6Title}** — ${t.features.f6Desc}

## ${t.usecases.title}

${t.usecases.lead}

- **${t.usecases.u1Title}** — ${t.usecases.u1Desc}
- **${t.usecases.u2Title}** — ${t.usecases.u2Desc}
- **${t.usecases.u3Title}** — ${t.usecases.u3Desc}

## ${t.pricing.title}

${t.pricing.lead} ${t.ui.bothPlansInclude}

### ${t.pricing.essentialTitle} — ${PRICING.essential.monthly} or ${PRICING.essential.annual}

${t.pricing.essentialDesc} Annual billing: ${t.ui.justPriceAnnualEssential.toLowerCase()}.

${essentialFeatures.map((f) => `- ${f}`).join("\n")}

### ${t.pricing.proTitle} (${t.pricing.mostPopular}) — ${PRICING.pro.monthly} or ${PRICING.pro.annual}

${t.pricing.proDesc} Annual billing: ${t.ui.justPriceAnnualPro.toLowerCase()}.

${proFeatures.map((f) => `- ${f}`).join("\n")}

### ${t.pricing.guaranteeTitle}

${t.pricing.guaranteeDesc}

## ${t.ui.whyFamiliesChoose}

${testimonials.map(([quote, by, role]) => `> ${quote}\n> — ${by}, ${role}`).join("\n\n")}

## ${t.faq.title}

${faqs.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n")}

## Links

- [Sign up](https://app.icancall.co/signup)
- [Log in](https://app.icancall.co/login)
- [For Seniors](https://icancall.co/seniors)
- [For Parents](https://icancall.co/parents)
- [For Caregivers](https://icancall.co/caregivers)
- [Comparison Chart](https://icancall.co/comparison-chart)
- [Privacy Policy](https://icancall.co/privacy-policy)
- [Terms of Service](https://icancall.co/terms-of-service)

---

${t.footer.blurb}

${t.footer.allRights}
`;
}
