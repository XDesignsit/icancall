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
      <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "32px", width: "auto", display: "block" }}>
          <style>{`
            .logo-main .cls-1 { fill: #1c2530; }
            .logo-main .cls-2 { fill: #4083ae; }
            .logo-main .cls-3 { fill: #fff; }
          `}</style>
          <g>
            <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
            <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
          </g>
          <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
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
