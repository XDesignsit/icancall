// The billing card's subtitle and the minutes meter's tail. The dates are the
// real ones (see renewalDates in src/lib/minutesCycle.ts); with none to show,
// the text simply leaves the date out.

import { formatEndDate } from "./cancelStrings";

interface RenewalStrings {
  billedMonthly: string;
  billedAnnually: string;
  /** {date} = when the plan renews (or the minutes reset). */
  renewsOn: string;
}

const STRINGS: Record<string, RenewalStrings> = {
  en: { billedMonthly: "Billed monthly", billedAnnually: "Billed annually", renewsOn: "renews {date}" },
  es: { billedMonthly: "Facturado mensualmente", billedAnnually: "Facturado anualmente", renewsOn: "renueva el {date}" },
  fr: { billedMonthly: "Facturé mensuellement", billedAnnually: "Facturé annuellement", renewsOn: "se renouvelle le {date}" },
  ja: { billedMonthly: "月額課金", billedAnnually: "年次請求", renewsOn: "{date}に更新" },
  zh: { billedMonthly: "按月计费", billedAnnually: "按年计费", renewsOn: "于 {date}续期" },
  ar: { billedMonthly: "فوترة شهرية", billedAnnually: "مفوتر سنوياً", renewsOn: "يتجدد في {date}" },
  hi: { billedMonthly: "मासिक बिल भेजा जाता है", billedAnnually: "सालाना बिलिंग", renewsOn: "{date} को नवीनीकृत होगा" },
  pt: { billedMonthly: "Cobrado mensalmente", billedAnnually: "Cobrado anualmente", renewsOn: "renova em {date}" },
  de: { billedMonthly: "Monatlich abgerechnet", billedAnnually: "Jährliche Abrechnung", renewsOn: "verlängert sich am {date}" },
  it: { billedMonthly: "Fatturato mensilmente", billedAnnually: "Fatturato annualmente", renewsOn: "si rinnova il {date}" },
  ko: { billedMonthly: "매월 결제됨", billedAnnually: "연간 결제", renewsOn: "{date}에 갱신 예정" },
};

const strings = (lang: string): RenewalStrings => STRINGS[lang] || STRINGS.en;

/** "renews {date}" in the account's language, or "" when there is no date. */
export function renewsOnText(lang: string, iso: string | null | undefined): string {
  const date = formatEndDate(iso, lang);
  return date ? strings(lang).renewsOn.replace("{date}", date) : "";
}

/** The billing card's subtitle: how the plan is billed and, when known, when it renews. */
export function billingSubtitle(lang: string, cycle: "monthly" | "yearly", renewsAt: string | null | undefined): string {
  const s = strings(lang);
  const renews = renewsOnText(lang, renewsAt);
  return `${cycle === "yearly" ? s.billedAnnually : s.billedMonthly}${renews ? ` · ${renews}` : ""}`;
}
