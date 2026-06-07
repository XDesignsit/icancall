"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/* ============ TYPES ============ */
type Plan = "essential" | "pro";
type BillingCycle = "monthly" | "yearly";

interface AccountData {
  name: string;
  email: string;
  password?: string;
}

interface NumberData {
  id: string;
  number: string;
  area: string;
  memorable: string | null;
}

interface PaymentData {
  name: string;
  card: string;
  exp: string;
  cvc: string;
}

interface OnboardingData {
  plan: Plan;
  billing: BillingCycle;
  account: AccountData;
  numbers: NumberData[];
  payment: PaymentData;
}

/* ============ CONFIG & CONFIG HELPERS ============ */
const PLANS = [
  {
    id: "essential" as Plan,
    name: "Essential",
    tag: null,
    desc: "One number for one loved one.",
    numbers: 1,
    monthly: { amt: 14.99, label: "$14.99", per: "/mo", note: "Billed monthly" },
    annual:  { amt: 149,   label: "$149",   per: "/yr", note: "$12.42/mo, billed yearly" },
    feats: ["1 phone number", "3 trusted contacts", "Cascade + Caller Menu", "30 voice minutes"],
  },
  {
    id: "pro" as Plan,
    name: "Pro",
    tag: "Most popular",
    desc: "Full protection for the whole circle.",
    numbers: 2,
    monthly: { amt: 24.99, label: "$24.99", per: "/mo", note: "Billed monthly" },
    annual:  { amt: 249,   label: "$249",   per: "/yr", note: "$20.75/mo, billed yearly" },
    feats: ["2 phone numbers", "6 trusted contacts", "Cascade + Caller Menu", "60 minutes + alerts"],
  },
];

const planById = (id: Plan) => PLANS.find((p) => p.id === id) || PLANS[0];

const AREA_SUGGESTIONS = [
  { code: "415", city: "San Francisco" },
  { code: "212", city: "New York" },
  { code: "312", city: "Chicago" },
  { code: "305", city: "Miami" },
  { code: "206", city: "Seattle" },
  { code: "617", city: "Boston" },
];

const VANITY_WORDS = [
  { word: "CARE", digits: "2273" },
  { word: "HOME", digits: "4663" },
  { word: "HELP", digits: "4357" },
  { word: "SAFE", digits: "7233" },
  { word: "CALL", digits: "2255" },
  { word: "LOVE", digits: "5683" },
  { word: "FAMI", digits: "3264" },
];

const STEPS = [
  { key: "plan",    label: "Plan" },
  { key: "account", label: "Account" },
  { key: "number",  label: "Number" },
  { key: "payment", label: "Payment" },
];

const STRENGTH = [
  { label: "", color: "transparent", w: "0%" },
  { label: "Weak", color: "var(--rose)", w: "25%" },
  { label: "Fair", color: "oklch(0.72 0.14 75)", w: "55%" },
  { label: "Good", color: "oklch(0.70 0.13 140)", w: "80%" },
  { label: "Strong", color: "var(--green)", w: "100%" },
];

function pad(n: number, len: number) { return String(n).padStart(len, "0"); }

function memorableLabel(prefix: string, line: string) {
  if (line[0] === line[1] && line[1] === line[2] && line[2] === line[3]) return "Repeating";
  if (line === "1234" || line === "4321" || line === "2345") return "Sequence";
  if (line[0] === line[3] && line[1] === line[2]) return "Mirror";
  if (prefix === line.slice(0, 3)) return "Easy recall";
  return null;
}

let _numSeed = Math.floor(Math.random() * 9000);

function fetchNumbers(areaCode: string, count = 6): NumberData[] {
  const ac = areaCode.replace(/\D/g, "").slice(0, 3) || "415";
  const out: NumberData[] = [];
  const usedVanity = new Set();
  for (let i = 0; i < count; i++) {
    _numSeed = (_numSeed * 1103515245 + 12345) & 0x7fffffff;
    const r = _numSeed;
    let prefix = "";
    let line = "";
    let vanity = null;

    if (r % 3 === 0) {
      const v = VANITY_WORDS[(r >> 4) % VANITY_WORDS.length];
      if (!usedVanity.has(v.word)) {
        usedVanity.add(v.word);
        prefix = pad(200 + ((r >> 8) % 700), 3);
        line = v.digits;
        vanity = v.word;
      }
    }
    if (!line) {
      prefix = pad(200 + ((r >> 6) % 700), 3);
      line = pad((r >> 10) % 10000, 4);
    }

    const formatted = `(${ac}) ${prefix}-${line}`;
    const memo = vanity ? `Spells ${vanity}` : memorableLabel(prefix, line);
    out.push({
      id: `${ac}-${prefix}-${line}-${i}`,
      number: formatted,
      area: ac,
      memorable: memo,
    });
  }
  return out;
}

const initials = (name: string) =>
  (name || "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

function passwordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || "").trim());

/* ============ ICONS ============ */
const Ico = {
  phone: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z"/>
    </svg>
  ),
  check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m5 12 5 5L20 6"/>
    </svg>
  ),
  arrowR: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14m0 0-6-6m6 6-6 6"/>
    </svg>
  ),
  arrowL: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 12H5m0 0 6-6m-6 6 6 6"/>
    </svg>
  ),
  shield: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </svg>
  ),
  mail: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="m4 7 8 6 8-6"/>
    </svg>
  ),
  user: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20a8 8 0 0 1 16 0"/>
    </svg>
  ),
  refresh: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v5h-5"/>
    </svg>
  ),
  search: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7"/>
      <path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  x: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 6l12 12M18 6 6 18"/>
    </svg>
  ),
  plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  google: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...p}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  ),
};

/* ============ INTERNAL COMPONENTS ============ */
function BrandMark({ dark }: { dark?: boolean }) {
  return (
    <div className={"obrand" + (dark ? " on-dark" : "")}>
      <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 154.5652" style={{ height: "32px", width: "auto", display: "block" }}>
          <style>{`
            .logo-main .cls-1 { fill: #1c2530; }
            .logo-main .cls-2 { fill: #4083ae; }
          `}</style>
          <g>
            <path className="cls-1" d="M278.7879,47.1856c-2.504,0-4.6863-.8794-6.5415-2.6434-1.857-1.7623-2.7828-3.9892-2.7828-6.6809,0-2.6899.9258-4.9169,2.7828-6.6809,1.8552-1.7623,4.0375-2.6452,6.5415-2.6452,2.5058,0,4.6863.8829,6.5433,2.6452,1.8552,1.7641,2.7828,3.991,2.7828,6.6809,0,2.6917-.9276,4.9186-2.7828,6.6809-1.857,1.7641-4.0375,2.6434-6.5433,2.6434ZM278.7879,127.219c-2.5987,0-4.6166-.8347-6.0536-2.5058-1.4406-1.6693-2.1573-3.9875-2.1573-6.958v-51.0828c0-3.0616.7167-5.4048,2.1573-7.0294,1.437-1.6211,3.4548-2.4343,6.0536-2.4343,2.5969,0,4.6398.8132,6.1251,2.4343,1.4835,1.6247,2.227,3.9678,2.227,7.0294v51.0828c0,2.9705-.7203,5.2886-2.1573,6.958-1.4406,1.6711-3.5031,2.5058-6.1948,2.5058Z"/>
            <path className="cls-2" d="M351.4434,127.6372c-10.209.2788-18.9543-1.6711-26.2375-5.8463-7.285-4.1751-12.8739-9.9517-16.772-17.3296-3.8963-7.3762-5.8463-15.7032-5.8463-24.9829,0-6.8668,1.1135-13.2242,3.3405-19.0687,2.227-5.8463,5.428-10.9275,9.6049-15.2421,4.1751-4.3145,9.3011-7.655,15.3797-10.0214,6.0768-2.3664,12.9204-3.5496,20.5307-3.5496,6.7721,0,12.4575,1.1135,17.0508,3.3405,4.5916,2.227,8.327,4.6881,11.2046,7.378,1.6693,1.5782,2.7131,3.2011,3.1313,4.8704.4164,1.6711.3485,3.2261-.2091,4.6631-.5576,1.4406-1.4852,2.5755-2.7846,3.4102s-2.8525,1.1832-4.6613,1.0438c-1.8105-.1394-3.689-.9491-5.6371-2.4361-1.58-1.2046-3.2708-2.2949-5.0813-3.2708-1.8087-.9741-3.8749-1.739-6.193-2.2967-2.3217-.5558-5.0598-.8347-8.2126-.8347-4.6416,0-8.7935.8347-12.4575,2.5058-3.6657,1.6693-6.7506,3.991-9.2564,6.9597-2.504,2.9705-4.4075,6.3807-5.7068,10.2305-1.2994,3.8516-1.9482,7.9571-1.9482,12.3181,0,6.311,1.16,11.8998,3.4799,16.772,2.3181,4.8704,5.6586,8.6773,10.0214,11.4137,4.361,2.7381,9.6496,4.1054,15.8676,4.1054,3.5246,0,7.2386-.5094,11.1349-1.5317,3.8981-1.0188,7.1903-2.6899,9.882-5.0098,1.7623-1.5764,3.4799-2.4361,5.151-2.5755,1.6693-.1394,3.1313.2091,4.3842,1.0438,1.2529.8347,2.1787,1.9732,2.7828,3.4102.6023,1.4406.7882,3.017.5576,4.7328-.2323,1.7176-1.092,3.319-2.5755,4.8025-2.1358,2.227-4.8954,4.1537-8.2823,5.7748-3.3869,1.6247-6.983,2.8776-10.7863,3.7587-3.8052.8811-7.4244,1.3673-10.856,1.462Z"/>
            <path className="cls-2" d="M417.9774,127.6372c-4.9204,0-9.117-1.0223-12.5969-3.0634-3.4799-2.0393-6.1483-4.7524-8.0035-8.1411-1.857-3.3869-2.7828-7.1206-2.7828-11.2046,0-3.8034,1.1582-7.26,3.4781-10.3699,2.3199-3.1081,5.3601-5.5889,9.117-7.4459,3.7587-1.8552,7.9106-2.8543,12.4575-2.9937,4.5451-.1394,9.0473.8597,13.5013,2.9937l6.4021,3.0616v9.3261l-6.8185-2.924c-3.714-1.5764-7.008-2.3664-9.8838-2.3664s-5.3119.5112-7.3065,1.5317c-1.9964,1.0223-3.5031,2.3664-4.5237,4.0357-1.0223,1.6711-1.5317,3.3887-1.5317,5.151,0,3.0616,1.067,5.5674,3.2011,7.5156s5.1027,2.9222,8.9079,2.9222c2.2288,0,4.3163-.3932,6.2645-1.1832,1.9482-.7864,3.6407-1.8999,5.0795-3.3405,1.4388-1.437,2.5523-3.1528,3.3405-5.1492.7882-1.9946,1.1832-4.1966,1.1832-6.6112v-16.7023c0-4.6398-1.1367-8.05-3.4102-10.2305-2.2734-2.1787-5.5907-3.2708-9.9517-3.2708-.9276,0-2.0876.1859-3.4799.5558-1.3905.3718-2.9919.9741-4.8007,1.8105-1.8105.8347-3.7372,1.9964-5.7765,3.4799-1.6711,1.2064-3.2261,1.7623-4.6631,1.6693-1.4406-.0912-2.6684-.5791-3.689-1.462-1.0223-.8794-1.7176-1.9696-2.0876-3.2708-.3718-1.2976-.3253-2.6649.1394-4.1054.4629-1.437,1.437-2.7149,2.9222-3.8284,2.5058-1.9482,5.1027-3.4781,7.7944-4.5916s5.2904-1.9017,7.7944-2.3664c2.5058-.4647,4.6398-.697,6.4039-.697,6.6809,0,12.1787,1.0438,16.4932,3.1313,4.3145,2.0894,7.5388,5.2439,9.6729,9.4655,2.134,4.2234,3.2028,9.5817,3.2028,16.0767v34.3787c0,2.4146-.697,4.3396-2.0894,5.7765-1.3905,1.437-3.3869,2.1573-5.9839,2.1573-1.7641,0-3.2493-.3021-4.4539-.9044-1.2082-.6023-2.1358-1.5067-2.7846-2.7149-.6506-1.2046-.9741-2.5969-.9741-4.1751v-5.0116h1.1135c-.6506,3.2493-1.9035,5.8248-3.7587,7.7265-1.857,1.9017-4.1984,3.2708-7.0277,4.1054-2.8329.8347-6.1948,1.2529-10.0911,1.2529Z"/>
            <path className="cls-2" d="M479.6356,127.3584c-2.7846,0-4.9883-.765-6.6112-2.2967-1.6247-1.5317-2.4361-3.7337-2.4361-6.6112v-52.6127c0-2.8758.8114-5.0563,2.4361-6.5415,1.6229-1.4835,3.7801-2.227,6.4718-2.227,2.6899,0,4.7077.7435,6.0554,2.227,1.344,1.4852,2.0179,3.6657,2.0179,6.5415v9.4637l-1.5317-3.4799c2.0411-4.9169,5.2207-8.6505,9.5352-11.2046,4.3145-2.5505,9.2082-3.8266,14.6844-3.8266,5.4727,0,9.9731,1.0223,13.5013,3.0616,3.5246,2.0429,6.1698,5.1278,7.9338,9.2564,1.7605,4.1304,2.6434,9.3494,2.6434,15.6585v33.6834c0,2.8776-.7435,5.0795-2.227,6.6112-1.4852,1.5317-3.6193,2.2967-6.4021,2.2967-2.7846,0-4.9419-.765-6.4718-2.2967-1.5317-1.5317-2.2967-3.7337-2.2967-6.6112v-32.8488c0-5.2886-.9991-9.1385-2.9937-11.5513-1.9964-2.4129-5.0795-3.6193-9.2546-3.6193-5.1045,0-9.1653,1.5996-12.1804,4.8007-3.0152,3.2028-4.5237,7.4477-4.5237,12.7363v30.4824c0,2.8776-.6738,5.0795-2.0179,6.6112-1.3458,1.5317-3.4566,2.2967-6.3324,2.2967Z"/>
            <path className="cls-1" d="M599.3363,127.6372c-10.209.2788-18.9543-1.6711-26.2375-5.8463-7.285-4.1751-12.8739-9.9517-16.772-17.3296-3.8963-7.3762-5.8463-15.7032-5.8463-24.9829,0-6.8668,1.1135-13.2242,3.3405-19.0687,2.227-5.8463,5.428-10.9275,9.6049-15.2421,4.1751-4.3145,9.3011-7.655,15.3797-10.0214,6.0768-2.3664,12.9204-3.5496,20.5307-3.5496,6.7721,0,12.4575,1.1135,17.0508,3.3405,4.5916,2.227,8.327,4.6881,11.2046,7.378,1.6693,1.5782,2.7131,3.2011,3.1313,4.8704.4164,1.6711.3485,3.2261-.2091,4.6631-.5576,1.4406-1.4852,2.5755-2.7846,3.4102s-2.8525,1.1832-4.6613,1.0438c-1.8105-.1394-3.689-.9491-5.6371-2.4361-1.58-1.2046-3.2708-2.2949-5.0813-3.2708-1.8087-.9741-3.8749-1.739-6.193-2.2967-2.3217-.5558-5.0598-.8347-8.2126-.8347-4.6416,0-8.7935.8347-12.4575,2.5058-3.6657,1.6693-6.7506,3.991-9.2564,6.9597-2.504,2.9705-4.4075,6.3807-5.7068,10.2305-1.2994,3.8516-1.9482,7.9571-1.9482,12.3181,0,6.311,1.16,11.8998,3.4799,16.772,2.3181,4.8704,5.6586,8.6773,10.0214,11.4137,4.361,2.7381,9.6496,4.1054,15.8676,4.1054,3.5246,0,7.2386-.5094,11.1349-1.5317,3.8981-1.0188,7.1903-2.6899,9.882-5.0098,1.7623-1.5764,3.4799-2.4361,5.151-2.5755,1.6693-.1394,3.1313.2091,4.3842,1.0438,1.2529.8347,2.1787,1.9732,2.7828,3.4102.6023,1.4406.7882,3.017.5576,4.7328-.2323,1.7176-1.092,3.319-2.5755,4.8025-2.1358,2.227-4.8954,4.1537-8.2823,5.7748-3.3869,1.6247-6.983,2.8776-10.7863,3.7587-3.8052.8811-7.4244,1.3673-10.856,1.462Z"/>
            <path className="cls-1" d="M665.8685,127.6372c-4.9204,0-9.117-1.0223-12.5969-3.0634-3.4799-2.0393-6.1483-4.7524-8.0035-8.1411-1.857-3.3869-2.7828-7.1206-2.7828-11.2046,0-3.8034,1.1582-7.26,3.4781-10.3699,2.3199-3.1081,5.3601-5.5889,9.117-7.4459,3.7587-1.8552,7.9106-2.8543,12.4575-2.9937,4.5451-.1394,9.0473.8597,13.5013,2.9937l6.4021,3.0616v9.3261l-6.8185-2.924c-3.714-1.5764-7.008-2.3664-9.8838-2.3664s-5.3119.5112-7.3065,1.5317c-1.9964,1.0223-3.5031,2.3664-4.5237,4.0357-1.0223,1.6711-1.5317,3.3887-1.5317,5.151,0,3.0616,1.067,5.5674,3.2011,7.5156s5.1027,2.9222,8.9079,2.9222c2.2288,0,4.3163-.3932,6.2645-1.1832,1.9482-.7864,3.6407-1.8999,5.0795-3.3405,1.4388-1.437,2.5523-3.1528,3.3405-5.1492.7882-1.9946,1.1832-4.1966,1.1832-6.6112v-16.7023c0-4.6398-1.1367-8.05-3.4102-10.2305-2.2734-2.1787-5.5907-3.2708-9.9517-3.2708-.9276,0-2.0876.1859-3.4799.5558-1.3905.3718-2.9919.9741-4.8007,1.8105-1.8105.8347-3.7372,1.9964-5.7765,3.4799-1.6711,1.2064-3.2261,1.7623-4.6631,1.6693-1.4406-.0912-2.6684-.5791-3.689-1.462-1.0223-.8794-1.7176-1.9696-2.0876-3.2708-.3718-1.2976-.3253-2.6649.1394-4.1054.4629-1.437,1.437-2.7149,2.9222-3.8284,2.5058-1.9482,5.1027-3.4781,7.7944-4.5916s5.2904-1.9017,7.7944-2.3664c2.5058-.4647,4.6398-.697,6.4039-.697,6.6809,0,12.1787,1.0438,16.4932,3.1313,4.3145,2.0894,7.5388,5.2439,9.6729,9.4655,2.134,4.2234,3.2028,9.5817,3.2028,16.0767v34.3787c0,2.4146-.697,4.3396-2.0894,5.7765-1.3905,1.437-3.3869,2.1573-5.9839,2.1573-1.7641,0-3.2493-.3021-4.4539-.9044-1.2082-.6023-2.1358-1.5067-2.7846-2.7149-.6506-1.2046-.9741-2.5969-.9741-4.1751v-5.0116h1.1135c-.6506,3.2493-1.9035,5.8248-3.7587,7.7265-1.857,1.9017-4.1984,3.2708-7.0277,4.1054-2.8329.8347-6.1948,1.2529-10.0911,1.2529Z"/>
            <path className="cls-1" d="M744.0914,119.2852c0,1.2082-.2091,2.2967-.6256,3.2708-.4182.9741-1.0223,1.8338-1.8105,2.5755-.7882.7435-1.6944,1.2976-2.7131,1.6711-1.0223.3682-2.1823.5558-3.4799.5558-3.0616,0-5.6622-.3718-7.7944-1.1135-2.1358-.7417-3.8516-1.739-5.151-2.9919s-2.2967-2.6917-2.9919-4.3145-1.1617-3.3869-1.3923-5.2904c-.2323-1.8999-.3467-3.7801-.3467-5.6371V41.3411c0-2.8758.672-5.1724,2.0179-6.89,1.344-1.7158,3.4102-2.5755,6.193-2.5755,2.7846,0,4.8722.8597,6.2645,2.5755,1.3905,1.7176,2.0876,4.0143,2.0876,6.89v66.5304c0,1.2082.0214,2.2055.0697,2.9937.0447.7882.3235,1.3691.8347,1.739.5094.3718,1.3673.5576,2.5755.5576,1.4835,0,2.6899.3253,3.6175.9741.9276.6506,1.6014,1.4602,2.0196,2.4361.4164.9741.6256,1.8785.6256,2.7131Z"/>
            <path className="cls-1" d="M780,119.2852c0,1.2082-.2091,2.2967-.6256,3.2708-.4182.9741-1.0223,1.8338-1.8105,2.5755-.7882.7435-1.6944,1.2976-2.7131,1.6711-1.0223.3682-2.1823.5558-3.4799.5558-3.0616,0-5.6622-.3718-7.7944-1.1135-2.1358-.7417-3.8516-1.739-5.151-2.9919s-2.2967-2.6917-2.9919-4.3145-1.1617-3.3869-1.3923-5.2904c-.2323-1.8999-.3467-3.7801-.3467-5.6371V41.3411c0-2.8758.672-5.1724,2.0179-6.89,1.344-1.7158,3.4102-2.5755,6.193-2.5755,2.7846,0,4.8722.8597,6.2645,2.5755,1.3905,1.7176,2.0876,4.0143,2.0876,6.89v66.5304c0,1.2082.0214,2.2055.0697,2.9937.0447.7882.3235,1.3691.8347,1.739.5094.3718,1.3673.5576,2.5755.5576,1.4835,0,2.6899.3253,3.6175.9741.9276.6506,1.6014,1.4602,2.0196,2.4361.4164.9741.6256,1.8785.6256,2.7131Z"/>
          </g>
          <g>
            <path className="cls-1" d="M212.1483,66.9858l-.1196-.1795c-8.6726-12.9312-19.965-27.1303-32.7526-32.2381-1.4474-.6819-1.9379-1.3877-.6938-2.7274,1.3757-1.4115,3.1341-3.0982,4.0792-4.9644,5.8374-10.2397-2.261-23.6134-14.0197-22.9914-12.3331.2033-19.2713,14.8451-12.0221,24.6063,1.1603,1.8781,4.103,3.7562,4.5577,4.8806.2512.6579-.0718,1.0885-.7538,1.6149-6.3998,3.3374-11.7111,9.3545-17.728,13.7446-6.9619,5.1797-13.5292.1555-20.4314-3.6245-2.7394-1.3039-3.8518-2.3446-1.6629-5.2754,5.73-7.895-.3588-19.7257-10.3233-19.1396-7.1893.1675-12.6561,7.0218-11.424,14.0078.1914,1.244.5861,2.4642,1.1603,3.5767,1.0647,2.2609,3.3615,3.9834,3.3255,5.2753-.0958,1.6987-2.6795,2.548-4.7011,4.2705-7.345,5.706-13.3499,16.0892-23.1949,8.6846-1.3516-.8612-2.8109-1.8302-4.1748-2.6676-1.2919-.9091-2.4044-1.3517-2.5598-2.7394-.0599-1.3038,1.9377-3.1819,2.524-5.5146,2.2369-6.9022-4.5098-14.1034-11.5915-12.1656-5.3471,1.1484-8.6487,7.2013-6.9022,12.3809.5384,2.2609,3.0504,4.5816,3.505,5.73.4546,1.0048-.6938,1.7704-1.543,2.3326-16.4123,11.2923-33.614,51.5212-34.6904,78.4722-.1676,6.316,1.4594,20.3597,10.4071,17.9792,7.9907-3.9355,12.5963-13.0148,19.6778-18.7328,5.5147-5.1318,12.6681-7.3807,18.9123-2.0096,5.5743,4.115,11.0531,12.9312,19.0198,10.0243,6.3879-2.4164,10.9814-10.1799,17.2018-12.7518,12.7157-4.7849,20.1204,17.2735,32.9678,11.8666,11.6512-5.4069,20.3597-22.9675,36.7719-14.9767,11.9145,5.2395,22.0584,18.3979,33.8292,25.1565,6.1725,3.4571,13.7326,1.8542,18.1108-3.8877,14.7971-22.9435-3.5767-58.7225-14.7615-78.0176ZM152.3971,89.738c-4.4858-9.9406,3.3854-21.9866,14.3187-21.8191h.2272c8.9-.0718,16.3645,8.0146,15.5151,16.9026-1.3398,16.2687-23.6134,19.8573-30.0611,4.9165ZM96.2824,88.8408c-1.0049-7.0936,5.0121-13.8882,12.1415-13.8045h.2272c8.1942-.1316,14.4145,8.6846,11.5675,16.3763-4.2106,12.2852-22.441,10.3354-23.9363-2.5718ZM59.6898,104.8223c-12.6799-1.2202-12.0938-19.5582.6101-20.0248h.2392c13.6132.622,12.8235,20.5631-.8493,20.0248Z"/>
            <path className="cls-2" d="M186.0468,54.5331c-16.3404-14.6537-26.0656-5.395-38.3987,7.0696-5.036,4.8567-11.0531,7.3089-17.3811,3.5408-7.4644-4.5218-15.7542-12.8116-25.0847-8.0506-7.0338,3.3375-13.2303,13.0508-19.5703,16.3285-8.4213,4.2825-14.2349-6.2562-21.2567-8.7444-13.8762-4.8806-26.8313,26.2451-29.104,37.5135-1.0049,4.9882-2.7274,17.9793,5.1079,17.4409,6.603-1.3996,12.0219-8.0984,19.0797-8.6368,8.3855-1.5909,14.5699,6.663,21.4602,8.5889,10.2996,2.3326,15.9457-14.5939,28.4342-14.4743,8.6367-.4546,14.6418,7.2731,21.3645,11.4957,8.9239,5.5146,16.46-3.6006,24.4149-8.0027,21.5081-13.4336,43.6022,15.9457,51.2701-3.9715l.0837-.2512c4.5697-19.4386-8.5768-37.7408-20.4195-49.8466ZM59.6898,104.8223c-12.6799-1.2202-12.0938-19.5582.6101-20.0248h.2392c13.6132.622,12.8235,20.5631-.8493,20.0248ZM120.2187,91.4126c-4.2106,12.2852-22.441,10.3354-23.9363-2.5718-1.0049-7.0936,5.0121-13.8882,12.1415-13.8045h.2272c8.1942-.1316,14.4145,8.6846,11.5675,16.3763ZM182.4581,84.8214c-1.3398,16.2687-23.6134,19.8573-30.0611,4.9165-4.4858-9.9406,3.3854-21.9866,14.3187-21.8191h.2272c8.9-.0718,16.3645,8.0146,15.5151,16.9026Z"/>
          </g>
        </svg>
    </div>
  );
}

function VSteps({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="vsteps">
      {STEPS.map((s, i) => {
        const cls = i < stepIndex ? "done" : i === stepIndex ? "active" : "";
        return (
          <div key={s.key} className={"vstep " + cls}>
            <span className="vnum">{i < stepIndex ? <Ico.check className="w-[15px] h-[15px]" /> : i + 1}</span>
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function HSteps({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="hsteps">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <span className={"hstep-bar" + (i <= stepIndex ? " filled" : "")} />}
          <div className={"hstep " + (i < stepIndex ? "done" : i === stepIndex ? "active" : "")}>
            <span className="hnum">{i < stepIndex ? <Ico.check className="w-[15px] h-[15px]" /> : i + 1}</span>
            <span className="hlbl">{s.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function Rail({ stepIndex }: { stepIndex: number }) {
  return (
    <aside className="rail">
      <div className="rail-head"><BrandMark dark /></div>
      <div className="rail-lede">
        <h2>One number.<br /><span className="accent-line">Always answered.</span></h2>
        <p>You're minutes away from giving your family the certainty of always getting through.</p>
        <VSteps stepIndex={stepIndex} />
      </div>
      <div className="rail-foot">
        <Ico.lock className="w-[16px] h-[16px] opacity-85" /> Encrypted end to end · Switch plans or cancel anytime
      </div>
    </aside>
  );
}

function Shell({ layout, stepIndex, hideChrome, children }: { layout: string; stepIndex: number; hideChrome: boolean; children: React.ReactNode }) {
  const split = layout === "split" && !hideChrome;
  return (
    <div className={"shell " + (split ? "split" : "centered")}>
      {split && <Rail stepIndex={stepIndex} />}
      <div className="content">
        <div className="content-top">
          <BrandMark />
          <div className="signin">Already have an account? <Link href="/login">Sign in</Link></div>
        </div>
        {!hideChrome && <HSteps stepIndex={stepIndex} />}
        <div className="content-body">{children}</div>
      </div>
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled, backLabel }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; backLabel?: string }) {
  return (
    <div className="step-nav">
      {onBack && <button className="btn-text" onClick={onBack}><Ico.arrowL className="w-[17px] h-[17px]" /> {backLabel || "Back"}</button>}
      <span className="spacer" />
      <button className="btn btn-primary btn-lg" disabled={nextDisabled} onClick={onNext}>
        {nextLabel || "Continue"} <Ico.arrowR className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

/* ============ STEP 1 — Plan ============ */
function PlanStep({ data, set, onNext }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void }) {
  const { plan, billing } = data;
  return (
    <div className="panel">
      <span className="step-eyebrow">Step 1 of 4 · Choose a plan</span>
      <h1>Pick the plan that fits your family.</h1>
      <p className="sub">Both plans include cascade routing, the caller menu, and 24/7 reliability. Switch or cancel anytime.</p>

      <div className="bill-toggle">
        <button className={billing === "monthly" ? "active" : ""} onClick={() => set({ billing: "monthly" })}>Monthly</button>
        <button className={billing === "yearly" ? "active" : ""} onClick={() => set({ billing: "yearly" })}>Annual <em>Save 17%</em></button>
      </div>

      <div className="plan-cards">
        {PLANS.map((p) => {
          const price = billing === "yearly" ? p.annual : p.monthly;
          const sel = plan === p.id;
          return (
            <button key={p.id} className={"plan-card" + (sel ? " sel" : "")} onClick={() => set({ plan: p.id })}>
              <span className="radio" />
              <span className="pname">{p.name}{p.tag && <span className="ptag">{p.tag}</span>}</span>
              <span className="pprice">
                <b>{price.label}</b>
                <span>{price.per}</span>
                {billing === "yearly" && <span className="yearly">{price.note}</span>}
              </span>
              <span className="pdesc">{p.desc}</span>
              <ul className="plan-feats">
                {p.feats.map((f, i) => (
                  <li key={i}>
                    <Ico.check className="w-[15px] h-[15px] text-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="trust-row"><Ico.shield className="w-[17px] h-[17px]" /> No setup fees · Switch plans or cancel anytime</div>
      <StepNav onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

/* ============ STEP 2 — Account ============ */
function AccountStep({ data, set, onNext, onBack }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const a = data.account;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const strength = passwordStrength(a.password || "");
  const s = STRENGTH[strength];

  const errs = {
    name: a.name.trim().length < 2 ? "Please enter your name" : "",
    email: !validEmail(a.email) ? "Enter a valid email address" : "",
    password: (a.password || "").length < 8 ? "Use at least 8 characters" : "",
  };
  const valid = !errs.name && !errs.email && !errs.password;
  const upd = (k: string, v: string) => set({ account: { ...a, [k]: v } });
  const show = (k: "name" | "email" | "password") => touched[k] && errs[k];

  const submit = () => {
    if (valid) onNext();
    else setTouched({ name: true, email: true, password: true });
  };

  return (
    <div className="panel">
      <span className="step-eyebrow">Step 2 of 4 · Your account</span>
      <h1>Let's set up your account.</h1>
      <p className="sub">This is the account that manages the number and trusted circle. Your family doesn't need an account.</p>

      <button className="btn btn-google btn-block" style={{ marginTop: 22 }} onClick={onNext}>
        <Ico.google className="w-[19px] h-[19px]" /> Continue with Google
      </button>
      <div className="auth-divider">or sign up with email</div>

      <div className="field">
        <label>Full name</label>
        <div className="input-icon">
          <Ico.user className="ico" />
          <input className={"input" + (show("name") ? " error" : "")} placeholder="Maria Delgado"
            value={a.name} onChange={(e) => upd("name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
        </div>
        <div className={"field-err" + (show("name") ? " show" : "")}>{errs.name}</div>
      </div>

      <div className="field">
        <label>Email address</label>
        <div className="input-icon">
          <Ico.mail className="ico" />
          <input className={"input" + (show("email") ? " error" : "")} type="email" placeholder="you@example.com"
            value={a.email} onChange={(e) => upd("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
        </div>
        <div className={"field-err" + (show("email") ? " show" : "")}>{errs.email}</div>
      </div>

      <div className="field">
        <label>Create a password</label>
        <div className="input-icon">
          <Ico.lock className="ico" />
          <input className={"input" + (show("password") ? " error" : "")} type="password" placeholder="At least 8 characters"
            value={a.password || ""} onChange={(e) => upd("password", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))} />
        </div>
        {a.password && (
          <>
            <div className="pw-meter"><i style={{ width: s.w, background: s.color }} /></div>
            <div className="pw-note">Password strength: {s.label || "—"}</div>
          </>
        )}
        <div className={"field-err" + (show("password") ? " show" : "")}>{errs.password}</div>
      </div>

      <StepNav onBack={onBack} onNext={submit} nextLabel="Continue" />
    </div>
  );
}

/* ============ STEP 3 — Number ============ */
function NumberStep({ data, set, onNext, onBack }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const need = planById(data.plan).numbers;
  const selected = data.numbers;
  const [area, setArea] = useState("415");
  const [results, setResults] = useState<NumberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin] = useState(false);

  const load = (ac: string) => {
    setLoading(true);
    setSpin(true);
    setTimeout(() => {
      setResults(fetchNumbers(ac, 6));
      setLoading(false);
      setTimeout(() => setSpin(false), 120);
    }, 650);
  };

  useEffect(() => { load(area); }, []); // eslint-disable-line

  const isSel = (n: NumberData) => selected.some((x) => x.number === n.number);
  const full = selected.length >= need;

  const toggle = (n: NumberData) => {
    if (isSel(n)) set({ numbers: selected.filter((x) => x.number !== n.number) });
    else if (!full) set({ numbers: [...selected, n] });
  };
  const remove = (n: NumberData) => set({ numbers: selected.filter((x) => x.number !== n.number) });

  const search = () => { const ac = area.replace(/\D/g, "").slice(0, 3); if (ac.length === 3) load(ac); };

  return (
    <div className="panel wide">
      <span className="step-eyebrow">Step 3 of 4 · Your number</span>
      <h1>{need > 1 ? `Choose your ${need} numbers.` : "Choose your number."}</h1>
      <p className="sub">Numbers are provided through our carrier network. Search any area code to find one that's local — or memorable.</p>

      <div className="num-need">
        <Ico.phone className="w-[18px] h-[18px] text-indigo-500" />
        <span>Your <b>{planById(data.plan).name}</b> plan includes <b>{need} number{need > 1 ? "s" : ""}</b>. You've selected <b>{selected.length} of {need}</b>.</span>
      </div>

      {selected.length > 0 && (
        <div className="selected-nums">
          {selected.map((n) => (
            <span key={n.number} className="num-chip">
              {n.number}
              <button className="x" onClick={() => remove(n)} aria-label="Remove"><Ico.x className="w-[13px] h-[13px]" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="search-bar">
        <div className="area-wrap">
          <span className="prefix">Area code</span>
          <input className="input" inputMode="numeric" maxLength={3} placeholder="415"
            value={area}
            onChange={(e) => setArea(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onKeyDown={(e) => e.key === "Enter" && search()} />
        </div>
        <button className="btn btn-ghost" onClick={search} disabled={area.replace(/\D/g, "").length !== 3}>
          <Ico.search className="w-[18px] h-[18px]" /> Search
        </button>
      </div>
      <div className="area-suggest">
        {AREA_SUGGESTIONS.map((a) => (
          <button key={a.code} className="area-pill" onClick={() => { setArea(a.code); load(a.code); }}>
            {a.code} · {a.city}
          </button>
        ))}
      </div>

      <div className="results-head">
        <span className="rh-title">Available in <b>({area || "—"})</b></span>
        <button className={"refresh-btn" + (spin ? " spin" : "")} onClick={() => load(area)} disabled={loading}>
          <Ico.refresh className="w-[15px] h-[15px]" /> Show more
        </button>
      </div>

      {loading ? (
        <div className="results-loading">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      ) : results.length ? (
        <div className="num-grid">
          {results.map((n) => {
            const sel = isSel(n);
            const disabled = !sel && full;
            return (
              <button key={n.id} className={"num-opt" + (sel ? " sel" : "") + (disabled ? " disabled" : "")} onClick={() => toggle(n)}>
                <span className="tick">{sel && <Ico.check className="w-[13px] h-[13px]" />}</span>
                <span className="nlabel">
                  <span className="nnum">{n.number}</span>
                  {n.memorable && <span className="memorable">{n.memorable}</span>}
                  {!n.memorable && <span className="nmeta">Local number</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="num-empty"><Ico.search className="w-[30px] h-[30px] mx-auto mb-2" /><div>No numbers found for that area code. Try another.</div></div>
      )}

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" nextDisabled={selected.length !== need} />
    </div>
  );
}

/* ============ SECURE CHECKOUT MODAL OVERLAY ============ */
interface CheckoutModalProps {
  isOpen: boolean;
  checkoutUrl: string;
  onClose: () => void;
}

function CheckoutModal({ isOpen, checkoutUrl, onClose }: CheckoutModalProps) {
  const [loading, setLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div 
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all h-[640px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981] text-white font-bold text-xs">✓</span>
            <span className="font-semibold text-slate-800 text-sm">Secure Payment</span>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Loading channel spinner */}
        {loading && (
          <div className="absolute inset-x-0 bottom-0 top-[53px] flex flex-col items-center justify-center bg-white z-20">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#10b981] border-t-transparent" />
            <p className="mt-4 text-xs text-slate-500 font-medium">Securing payment channel...</p>
          </div>
        )}

        {/* Iframe */}
        <iframe
          src={checkoutUrl}
          className="w-full flex-1 border-none"
          onLoad={() => setLoading(false)}
          allow="payment"
        />
      </div>
    </div>
  );
}

/* ============ STEP 4 — Payment ============ */
function PaymentStep({ data, set, onNext, onBack }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void }) {
  const plan = planById(data.plan);
  const price = data.billing === "yearly" ? plan.annual : plan.monthly;
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const handleStartPayment = () => {
    // Generate checkout URL with plan query details
    const url = `/onboarding/creem-checkout?plan=${data.plan}&billing=${data.billing}`;
    setCheckoutUrl(url);
    setModalOpen(true);
  };

  // Listen to iframe success messages
  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "CREEM_PAYMENT_SUCCESS") {
        setTimeout(() => {
          setModalOpen(false);
          onNext(); // Advance to Success step
        }, 800);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [onNext]);

  return (
    <div className="panel">
      <span className="step-eyebrow">Step 4 of 4 · Confirm</span>
      <h1>Confirm your subscription</h1>
      <p className="sub">Review your plan details to proceed to secure checkout.</p>

      <div className="trial-banner">
        <span className="ti"><Ico.check className="w-[19px] h-[19px] text-white" /></span>
        <div>
          <b>{price.label}{price.per}, billed {data.billing === "yearly" ? "yearly" : "monthly"}</b>
          <p>Set up in minutes · Cancel anytime from your dashboard.</p>
        </div>
      </div>

      <div className="order-sum mt-6">
        <div className="os-row">
          <span>{plan.name} plan &middot; {data.billing === "yearly" ? "Annual" : "Monthly"}</span>
          <b>{price.label}{price.per}</b>
        </div>
        <div className="os-row">
          <span>{plan.numbers} phone number{plan.numbers > 1 ? "s" : ""}</span>
          <span>Included</span>
        </div>
        <div className="os-row total">
          <span>Due today</span>
          <span>{price.label}</span>
        </div>
      </div>

      <div className="trust-row mt-6">
        <Ico.lock className="w-[17px] h-[17px] text-teal-600" />
        Secured with bank-level encryption. Checkout will open in a secure window.
      </div>

      <div className="step-nav mt-8">
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={handleStartPayment}>
          <Ico.lock className="w-[17px] h-[17px] text-white mr-1.5" />
          Complete setup &amp; pay
        </button>
      </div>

      <CheckoutModal 
        isOpen={modalOpen} 
        checkoutUrl={checkoutUrl} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}

/* ============ STEP 5 — Success ============ */
function SuccessStep({ data }: { data: OnboardingData }) {
  const plan = planById(data.plan);
  const contactCap = plan.id === "pro" ? 6 : 3;
  const shown = Math.min(contactCap, 4);
  const ownerFirst = (data.account.name || "You").trim().split(/\s+/)[0];

  return (
    <div className="panel">
      <div className="success-wrap">
        <div className="success-mark"><Ico.check className="w-[40px] h-[40px] text-white" /></div>
        <h1>You're all set, {ownerFirst}!</h1>
        <p className="sub">Your {plan.name} plan is active and your {plan.numbers > 1 ? "numbers are" : "number is"} live. One last thing: build your trusted circle so calls always reach someone.</p>

        <div className="next-card">
          <div className="nc-head">
            <span className="num-badge">{data.numbers[0] ? data.numbers[0].number : "(415) 555-0100"}</span>
            <span className="nc-ttl"><span style={{ whiteSpace: "nowrap" }}>{data.numbers.length > 1 ? "Your iCanCall numbers" : "Your iCanCall number"}</span><span>{data.numbers.length > 1 ? `+${data.numbers.length - 1} more · ` : ""}Ready to receive calls</span></span>
          </div>

          <div className="circle-preview">
            <div className="cp-label">Set up your circle · up to {contactCap} contacts</div>
            <div className="cp-slots">
              <div className="cp-slot filled">
                <span className="ava" style={{ background: "var(--blue)" }}>{initials(data.account.name)}</span>
                <span className="cp-who"><b>{data.account.name || "You"}</b><span>Account owner · you</span></span>
                <span className="cp-order">Added</span>
              </div>
              {Array.from({ length: shown - 1 }).map((_, i) => (
                <div key={i} className="cp-slot">
                  <span className="ava empty"><Ico.plus className="w-[18px] h-[18px] text-zinc-400" /></span>
                  <span className="cp-who"><b>Add a trusted contact</b><span>Family, neighbor, caregiver or doctor</span></span>
                  <span className="cp-order">#{i + 2}</span>
                </div>
              ))}
              {contactCap > shown && <div className="pw-note" style={{ textAlign: "center" }}>+ {contactCap - shown} more slots in your dashboard</div>}
            </div>
          </div>
        </div>

        <div className="success-actions">
          <Link className="btn btn-primary btn-lg btn-block" href="/dashboard">Go to dashboard <Ico.arrowR className="w-[18px] h-[18px]" /></Link>
          <span className="sa-note">A confirmation has been sent to {data.account.email || "your email"}.</span>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN ONBOARDING PROCESS ============ */
function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tweak State Simulation (split layout)
  const [step, setStep] = useState(0); // 0..4
  const [data, setData] = useState<OnboardingData>({
    plan: "essential",
    billing: "monthly",
    account: { name: "", email: "", password: "" },
    numbers: [],
    payment: { name: "", card: "", exp: "", cvc: "" },
  });

  const set = (patch: Partial<OnboardingData>) => setData((d) => ({ ...d, ...patch }));

  // Read initial plan and billing from search params
  useEffect(() => {
    const planParam = searchParams.get("plan");
    const billingParam = searchParams.get("billing");
    
    set({
      plan: planParam === "pro" ? "pro" : "essential",
      billing: billingParam === "annual" ? "yearly" : "monthly"
    });
  }, [searchParams]);

  // Adjust selected numbers cap when plan shifts
  useEffect(() => {
    const cap = planById(data.plan).numbers;
    if (data.numbers.length > cap) {
      set({ numbers: data.numbers.slice(0, cap) });
    }
  }, [data.plan]); // eslint-disable-line

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const success = step === 4;

  return (
    <Shell layout="split" stepIndex={Math.min(step, 3)} hideChrome={success}>
      {step === 0 && <PlanStep data={data} set={set} onNext={next} />}
      {step === 1 && <AccountStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 2 && <NumberStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 3 && <PaymentStep data={data} set={set} onNext={next} onBack={back} />}
      {step === 4 && <SuccessStep data={data} />}
    </Shell>
  );
}

export default function OnboardingWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center font-bold text-sm">Loading onboarding wizard...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}
