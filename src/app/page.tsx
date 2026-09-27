import type { Metadata, Viewport } from "next";
import enTranslations from "@/lib/translations/en";
import enHome from "@/lib/translations/home/en";
import { ADDON_PRICING, PLAN_PRICING } from "@/lib/pricing";
import HomePage from "./_home/HomePage";
import { fill } from "@/lib/translations/home/format";

export const metadata: Metadata = {
  title: enHome.meta.title,
  description: enHome.meta.description,
};

export const viewport: Viewport = {
  themeColor: "#f9fdff",
  viewportFit: "cover",
};

/* ============ STRUCTURED DATA ============ */
// Canonical English regardless of the visitor's language toggle.
const SITE_URL = "https://www.icancall.co";
const p = enTranslations.pricing;
const offer = (name: string, description: string, price: number, cycle: string) => ({
  "@type": "Offer",
  name: `${name} (${cycle})`,
  price,
  priceCurrency: "USD",
  description,
});
const JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "iCanCall",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon.svg`,
      email: "support@icancall.co",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "iCanCall",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      name: "iCanCall",
      serviceType: "Family phone call routing service",
      description: enHome.hero.lead,
      provider: { "@id": `${SITE_URL}/#organization` },
      offers: [
        offer(p.essentialTitle, p.essentialDesc, PLAN_PRICING.essential.monthlyAmount, "monthly"),
        offer(p.essentialTitle, p.essentialDesc, PLAN_PRICING.essential.annualAmount, "annual"),
        offer(p.proTitle, p.proDesc, PLAN_PRICING.pro.monthlyAmount, "monthly"),
        offer(p.proTitle, p.proDesc, PLAN_PRICING.pro.annualAmount, "annual"),
        offer(p.careteamTitle, p.careteamDesc, PLAN_PRICING.careteam.monthlyAmount, "monthly"),
        offer(p.careteamTitle, p.careteamDesc, PLAN_PRICING.careteam.annualAmount, "annual"),
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: enHome.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: fill(item.a, { numberPrice: ADDON_PRICING.extraNumberLabel }),
        },
      })),
    },
  ],
}).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <HomePage />
    </>
  );
}
