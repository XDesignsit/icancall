"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { translations } from "@/lib/translations";
import Turnstile from "@/components/Turnstile";

/* ============ TYPES ============ */
type Plan = "essential" | "pro";
type BillingCycle = "monthly" | "yearly";

interface AccountData {
  name: string;
  email: string;
  password?: string;
  captchaToken?: string;
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

/* ============ TRANSLATION MANUALLY MAPPED DICTIONARIES ============ */
const SIGNIN_PROMPTS: Record<string, { text: string; link: string }> = {
  en: { text: "Already have an account?", link: "Sign in" },
  es: { text: "¿Ya tienes una cuenta?", link: "Iniciar sesión" },
  fr: { text: "Vous avez déjà un compte ?", link: "Se connecter" },
  ja: { text: "すでにアカウントをお持ちですか？", link: "ログイン" },
  zh: { text: "已经有账号？", link: "登录" },
  ar: { text: "هل لديك حساب بالفعل؟", link: "تسجيل الدخول" },
  hi: { text: "क्या आपके पास पहले से एक खाता है?", link: "लॉगिन करें" },
  pt: { text: "Já tem uma conta?", link: "Entrar" },
  de: { text: "Bereits ein Konto?", link: "Anmelden" },
  it: { text: "Hai già un account?", link: "Accedi" },
  ko: { text: "이미 계정이 있으신가요?", link: "로그인" },
};

const STRENGTH_LABELS: Record<string, string> = {
  en: "Password strength:",
  es: "Seguridad de la contraseña:",
  fr: "Force du mot de passe :",
  ja: "パスワード強度:",
  zh: "密码强度：",
  ar: "قوة كلمة المرور:",
  hi: "पासवर्ड की ताकत:",
  pt: "Força da senha:",
  de: "Passwortstärke:",
  it: "Forza della password:",
  ko: "비밀번호 수준:"
};

const DISCLAIMERS: Record<string, { prefix: string; privacy: string; and: string; terms: string; suffix: string }> = {
  en: {
    prefix: "For more information, see our",
    privacy: "Privacy Policy",
    and: "and",
    terms: "Terms of Service",
    suffix: "."
  },
  es: {
    prefix: "Para más información, consulte nuestra",
    privacy: "Política de Privacidad",
    and: "y",
    terms: "Términos de Servicio",
    suffix: "."
  },
  fr: {
    prefix: "Pour plus d'informations, consultez notre",
    privacy: "Politique de Confidentialité",
    and: "et",
    terms: "Conditions d'Utilisation",
    suffix: "."
  },
  ja: {
    prefix: "詳細については、",
    privacy: "プライバシーポリシー",
    and: "と",
    terms: "利用規約",
    suffix: "を参照してください。"
  },
  zh: {
    prefix: "欲了解更多信息，请参阅我们的",
    privacy: "隐私政策",
    and: "和",
    terms: "服务条款",
    suffix: "。"
  },
  ar: {
    prefix: "لمزيد من المعلومات، راجع",
    privacy: "سياسة الخصوصية",
    and: "و",
    terms: "شروط الخدمة",
    suffix: "."
  },
  hi: {
    prefix: "अधिक जानकारी के लिए, हमारी",
    privacy: "गोपनीयता नीति",
    and: "और",
    terms: "सेवा की शर्तें",
    suffix: " देखें।"
  },
  pt: {
    prefix: "Para mais informações, consulte nossos",
    privacy: "Política de Privacidade",
    and: "e",
    terms: "Termos de Serviço",
    suffix: "."
  },
  de: {
    prefix: "Weitere Informationen finden Sie in unserer",
    privacy: "Datenschutzerklärung",
    and: "und",
    terms: "Nutzungsbedingungen",
    suffix: "."
  },
  it: {
    prefix: "Per maggiori informazioni, consulta la nostra",
    privacy: "Informativa sulla Privacy",
    and: "e",
    terms: "Termini di Servizio",
    suffix: "."
  },
  ko: {
    prefix: "자세한 내용은 ",
    privacy: "개인정보 처리방침",
    and: " 및 ",
    terms: "서비스 약관",
    suffix: "을 참조하십시오."
  }
};

const SPELLS_DICT: Record<string, string> = {
  en: "Spells {word}",
  es: "Deletrea {word}",
  fr: "Écrit {word}",
  ja: "「{word}」を表します",
  zh: "拼作 {word}",
  ar: "تهجئة {word}",
  hi: "स्पेल {word}",
  pt: "Soletra {word}",
  de: "Bedeutet {word}",
  it: "Compone {word}",
  ko: "「{word}」을(를) 나타냅니다"
};

const MEMORABLE_LABELS: Record<string, Record<string, string>> = {
  en: { "Repeating": "Repeating", "Sequence": "Sequence", "Mirror": "Mirror", "Easy recall": "Easy recall" },
  es: { "Repeating": "Repetido", "Sequence": "Secuencia", "Mirror": "Espejo", "Easy recall": "Fácil de recordar" },
  fr: { "Repeating": "Répété", "Sequence": "Séquence", "Mirror": "Miroir", "Easy recall": "Rappel facile" },
  ja: { "Repeating": "繰り返し", "Sequence": "連番", "Mirror": "ミラー", "Easy recall": "覚えやすい" },
  zh: { "Repeating": "重复", "Sequence": "顺序", "Mirror": "镜像", "Easy recall": "易记" },
  ar: { "Repeating": "مكرر", "Sequence": "تسلسل", "Mirror": "مرآة", "Easy recall": "سهل التذكر" },
  hi: { "Repeating": "दोहराया", "Sequence": "अनुक्रम", "Mirror": "दर्पण", "Easy recall": "याद रखना आसान" },
  pt: { "Repeating": "Repetido", "Sequence": "Sequência", "Mirror": "Espelho", "Easy recall": "Fácil recall" },
  de: { "Repeating": "Wiederholend", "Sequence": "Sequenz", "Mirror": "Spiegel", "Easy recall": "Einfach zu merken" },
  it: { "Repeating": "Ripetuto", "Sequence": "Sequenza", "Mirror": "Specchio", "Easy recall": "Facile da ricordare" },
  ko: { "Repeating": "반복", "Sequence": "일련번호", "Mirror": "대칭", "Easy recall": "기억하기 쉬움" }
};

const MORE_NUMBERS: Record<string, string> = {
  en: "+{count} more · ",
  es: "+{count} más · ",
  fr: "+{count} de plus · ",
  ja: "他+{count}個 · ",
  zh: "另有 +{count} 个 · ",
  ar: "+{count} إضافي · ",
  hi: "+{count} और · ",
  pt: "+{count} mais · ",
  de: "+{count} weitere · ",
  it: "+{count} in più · ",
  ko: "+{count}개 추가 · "
};

const PAYMENT_BANNER_SUB: Record<string, string> = {
  en: "Set up in minutes · Cancel anytime from your dashboard.",
  es: "Configuración en minutos · Cancele en cualquier momento desde su panel.",
  fr: "Configuration en quelques minutes · Annulez à tout moment depuis votre tableau de bord.",
  ja: "数分でセットアップ完了 · ダッシュボードからいつでもキャンセル可能。",
  zh: "几分钟内完成设置 · 随时在控制台取消。",
  ar: "الإعداد في دقائق · يمكنك الإلغاء في أي وقت من لوحة التحكم الخاصة بك.",
  hi: "मिनटों में सेटअप · अपने डैशबोर्ड से कभी भी रद्द करें।",
  pt: "Configure em minutos · Cancele a qualquer momento no seu painel.",
  de: "In wenigen Minuten eingerichtet · Jederzeit über Ihr Dashboard kündbar.",
  it: "Configurazione in pochi minuti · Annulla in qualsiasi momento dalla tua dashboard.",
  ko: "몇 분 만에 설정 완료 · 대시보드에서 언제든지 취소 가능."
};

/* ============ INTERNAL COMPONENTS ============ */
function BrandMark({ dark, lang }: { dark?: boolean; lang: string }) {
  return (
    <Link href={lang ? `/?lang=${lang}` : "/"} className={"obrand" + (dark ? " on-dark" : "")}>
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
    </Link>
  );
}

function VSteps({ stepIndex, t }: { stepIndex: number; t: any }) {
  const steps = [
    { key: "account", label: t.onboarding.stepAccount },
    { key: "plan",    label: t.onboarding.stepPlan },
    { key: "number",  label: t.onboarding.stepNumber },
    { key: "payment", label: t.onboarding.stepPayment },
  ];
  return (
    <div className="vsteps">
      {steps.map((s, i) => {
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

function HSteps({ stepIndex, t }: { stepIndex: number; t: any }) {
  const steps = [
    { key: "account", label: t.onboarding.stepAccount },
    { key: "plan",    label: t.onboarding.stepPlan },
    { key: "number",  label: t.onboarding.stepNumber },
    { key: "payment", label: t.onboarding.stepPayment },
  ];
  return (
    <div className="hsteps">
      {steps.map((s, i) => (
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

function Rail({ stepIndex, t, lang }: { stepIndex: number; t: any; lang: string }) {
  return (
    <aside className="rail">
      <div className="rail-head"><BrandMark dark lang={lang} /></div>
      <div className="rail-lede">
        <h2>{t.onboarding.oneNumber}<br /><span className="accent-line">{t.onboarding.alwaysAnswered}</span></h2>
        <p>{t.onboarding.railSubtitle}</p>
        <VSteps stepIndex={stepIndex} t={t} />
      </div>
      <div className="rail-foot">
        <Ico.lock className="w-[16px] h-[16px] opacity-85" /> {t.onboarding.railFooter}
      </div>
    </aside>
  );
}

function Shell({ layout, stepIndex, hideChrome, lang, t, children }: { layout: string; stepIndex: number; hideChrome: boolean; lang: string; t: any; children: React.ReactNode }) {
  const split = layout === "split" && !hideChrome;
  const prompt = SIGNIN_PROMPTS[lang] || SIGNIN_PROMPTS.en;
  return (
    <div className={"shell " + (split ? "split" : "centered")}>
      {split && <Rail stepIndex={stepIndex} t={t} lang={lang} />}
      <div className="content">
        <div className="content-top">
          <BrandMark lang={lang} />
          <div className="signin">{prompt.text} <Link href={`/login?lang=${lang}`}>{prompt.link}</Link></div>
        </div>
        {!hideChrome && <HSteps stepIndex={stepIndex} t={t} />}
        <div className="content-body">{children}</div>
      </div>
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled, backLabel, t }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; backLabel?: string; t: any }) {
  return (
    <div className="step-nav">
      {onBack && <button className="btn-text" onClick={onBack}><Ico.arrowL className="w-[17px] h-[17px]" /> {backLabel || t.onboarding.btnBack}</button>}
      <span className="spacer" />
      <button className="btn btn-primary btn-lg" disabled={nextDisabled} onClick={onNext}>
        {nextLabel || t.onboarding.btnContinue} <Ico.arrowR className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

/* ============ STEP 1 — Plan ============ */
function PlanStep({ data, set, onNext, onBack, t, lang }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack?: () => void; t: any; lang: string }) {
  const { plan, billing } = data;

  const essentialFeats = [
    t.pricing.eFeat1,
    t.pricing.eFeat2,
    t.pricing.eFeat3,
    t.pricing.eFeat4,
    t.pricing.eFeat5,
  ].filter(Boolean);

  const proFeats = [
    t.pricing.pFeat1,
    t.pricing.pFeat2,
    t.pricing.pFeat3,
    t.pricing.pFeat4,
    t.pricing.pFeat5,
  ].filter(Boolean);

  return (
    <div className="panel">
      <span className="step-eyebrow">{t.onboarding.step2Eyebrow}</span>
      <h1>{t.onboarding.step2Title}</h1>
      <p className="sub">{t.onboarding.step2Subtitle}</p>

      <div className="bill-toggle">
        <button className={billing === "monthly" ? "active" : ""} onClick={() => set({ billing: "monthly" })}>{t.onboarding.monthly}</button>
        <button className={billing === "yearly" ? "active" : ""} onClick={() => set({ billing: "yearly" })}>
          {t.onboarding.annual} <em>{t.onboarding.save17}</em>
        </button>
      </div>

      <div className="plan-cards">
        {PLANS.map((p) => {
          const price = billing === "yearly" ? p.annual : p.monthly;
          const sel = plan === p.id;
          const planName = p.id === "pro" ? t.pricing.proTitle : t.pricing.essentialTitle;
          const planDesc = p.id === "pro" ? t.pricing.proDesc : t.pricing.essentialDesc;
          const planTag = p.id === "pro" ? t.pricing.mostPopular : null;
          const planFeats = p.id === "pro" ? proFeats : essentialFeats;
          const perSuffix = billing === "yearly" ? t.ui.perYear : t.ui.perMonth;
          const noteText = p.id === "pro" ? t.ui.justPriceAnnualPro : t.ui.justPriceAnnualEssential;

          return (
            <button key={p.id} className={"plan-card" + (sel ? " sel" : "")} onClick={() => set({ plan: p.id })}>
              <span className="radio" />
              <span className="pname">{planName}{planTag && <span className="ptag">{planTag}</span>}</span>
              <span className="pprice">
                <b>{price.label}</b>
                <span>{perSuffix}</span>
                {billing === "yearly" && <span className="yearly">{noteText}</span>}
              </span>
              <span className="pdesc">{planDesc}</span>
              <ul className="plan-feats">
                {planFeats.map((f, i) => (
                  <li key={i}>
                    <Ico.check className="w-[15px] h-[15px] text-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="trust-row"><Ico.shield className="w-[17px] h-[17px]" /> {t.onboarding.trustRow}</div>
      <StepNav onBack={onBack} onNext={onNext} t={t} />
    </div>
  );
}

/* ============ STEP 2 — Account ============ */
function AccountStep({ data, set, onNext, onBack, t, lang }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack?: () => void; t: any; lang: string }) {
  const a = data.account;
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsTouched, setSmsTouched] = useState(false);
  const strength = passwordStrength(a.password || "");

  const STRENGTH = [
    { label: "", color: "transparent", w: "0%" },
    { label: t.onboarding.pwdWeak, color: "var(--rose)", w: "25%" },
    { label: t.onboarding.pwdMedium, color: "oklch(0.72 0.14 75)", w: "55%" },
    { label: t.onboarding.pwdMedium, color: "oklch(0.70 0.13 140)", w: "80%" },
    { label: t.onboarding.pwdStrong, color: "var(--green)", w: "100%" },
  ];
  const s = STRENGTH[strength];

  const captchaErrors: Record<string, string> = {
    en: "Please complete the security check.",
    es: "Por favor, complete la comprobación de seguridad.",
    fr: "Veuillez effectuer le contrôle de sécurité.",
    ja: "セキュリティチェックを完了してください。",
    zh: "请完成安全检查。",
    ar: "يرجى إكمال فحص الأمان.",
    hi: "कृपया सुरक्षा जांच पूरी करें।",
    pt: "Por favor, conclua a verificação de segurança.",
    de: "Bitte füllen Sie die Sicherheitsprüfung aus.",
    it: "Si prega di completare il controllo di sicurezza.",
    ko: "보안 검사를 완료하십시오."
  };
  const errCaptchaText = captchaErrors[lang] || captchaErrors.en;
  const isGoogle = a.password === "google_oauth_bypass";
  // CAPTCHA check is optional/bypassed on the signup page since the flow ends in a paid credit card checkout (zero spam bot risk)
  const captchaBypass = true;

  const errs = {
    name: a.name.trim().length < 2 ? t.onboarding.errName : "",
    email: !validEmail(a.email) ? t.onboarding.errEmail : "",
    password: (a.password || "").length < 8 ? t.onboarding.errPassword : "",
    sms: "",
    captcha: (!captchaBypass && !a.captchaToken) ? errCaptchaText : "",
  };
  const valid = !errs.name && !errs.email && !errs.password && !errs.captcha;
  const upd = (k: string, v: string) => set({ account: { ...a, [k]: v } });
  const show = (k: "name" | "email" | "password" | "sms" | "captcha") => {
    if (k === "sms") return smsTouched && errs.sms;
    if (k === "captcha") return touched.captcha && errs.captcha;
    return touched[k] && errs[k];
  };

  const submit = () => {
    if (valid) onNext();
    else {
      setTouched({ name: true, email: true, password: true, captcha: true });
      setSmsTouched(true);
    }
  };


  const strengthLabel = STRENGTH_LABELS[lang] || STRENGTH_LABELS.en;
  const discObj = DISCLAIMERS[lang] || DISCLAIMERS.en;

  return (
    <div className="panel">
      <span className="step-eyebrow">{t.onboarding.step1Eyebrow}</span>
      <h1>{t.onboarding.step1Title}</h1>
      <p className="sub">{t.onboarding.step1Subtitle}</p>

      <button className="btn btn-google btn-block" style={{ marginTop: 22 }} onClick={() => {
        window.location.href = `/api/auth/google?next=${encodeURIComponent("/signup?google=true")}`;
      }}>
        <Ico.google className="w-[19px] h-[19px]" /> {t.onboarding.btnGoogle}
      </button>
      <div className="auth-divider">{t.onboarding.dividerOr}</div>

      <div className="field">
        <label>{t.onboarding.labelName}</label>
        <div className="input-icon">
          <Ico.user className="ico" />
          <input className={"input" + (show("name") ? " error" : "")} placeholder={t.onboarding.placeholderName}
            value={a.name} onChange={(e) => upd("name", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
        </div>
        <div className={"field-err" + (show("name") ? " show" : "")}>{errs.name}</div>
      </div>

      <div className="field">
        <label>{t.onboarding.labelEmail}</label>
        <div className="input-icon">
          <Ico.mail className="ico" />
          <input className={"input" + (show("email") ? " error" : "")} type="email" placeholder={t.onboarding.placeholderEmail}
            value={a.email} onChange={(e) => upd("email", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))} />
        </div>
        <div className={"field-err" + (show("email") ? " show" : "")}>{errs.email}</div>
      </div>

      <div className="field">
        <label>{t.onboarding.labelPassword}</label>
        <div className="input-icon">
          <Ico.lock className="ico" />
          <input className={"input" + (show("password") ? " error" : "")} type="password" placeholder={t.onboarding.placeholderPassword}
            value={a.password || ""} onChange={(e) => upd("password", e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))} />
        </div>
        {a.password && (
          <>
            <div className="pw-meter"><i style={{ width: s.w, background: s.color }} /></div>
            <div className="pw-note">{strengthLabel} {s.label || "—"}</div>
          </>
        )}
        <div className={"field-err" + (show("password") ? " show" : "")}>{errs.password}</div>
      </div>

      <div className="field" style={{ marginTop: 24, marginBottom: 8 }}>
        <label style={{ display: "flex", gap: 10, cursor: "pointer", alignItems: "flex-start", fontSize: "0.85rem", fontWeight: "normal", color: "var(--ink-soft)" }}>
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => {
              setSmsConsent(e.target.checked);
              setSmsTouched(true);
            }}
            style={{ width: "16px", height: "16px", flexShrink: 0, marginTop: 3, cursor: "pointer" }}
          />
          <span>
            {t.onboarding.smsText}{" "}
            {discObj.prefix}{" "}
            <Link href={`/privacy-policy?lang=${lang}`} style={{ textDecoration: "underline", color: "var(--blue)" }} target="_blank">
              {discObj.privacy}
            </Link>{" "}
            {discObj.and}{" "}
            <Link href={`/terms-of-service?lang=${lang}`} style={{ textDecoration: "underline", color: "var(--blue)" }} target="_blank">
              {discObj.terms}
            </Link>
            {discObj.suffix}
          </span>
        </label>
        <div className={"field-err" + (show("sms") ? " show" : "")} style={{ marginLeft: 26, marginTop: 4 }}>{errs.sms}</div>
      </div>

      {!isGoogle && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, marginBottom: 20 }}>
          <Turnstile
            onVerify={(token) => set({ account: { ...a, captchaToken: token } })}
            onError={() => set({ account: { ...a, captchaToken: undefined } })}
            onExpire={() => set({ account: { ...a, captchaToken: undefined } })}
          />
          <div className={"field-err" + (show("captcha") ? " show" : "")} style={{ marginTop: 8 }}>{errs.captcha}</div>
        </div>
      )}

      <StepNav 
        onBack={onBack} 
        onNext={submit} 
        nextDisabled={
          (touched.name && !!errs.name) || 
          (touched.email && !!errs.email) || 
          (touched.password && !!errs.password)
        } 
        t={t} 
      />
    </div>
  );
}

/* ============ STEP 3 — Number ============ */
function NumberStep({ data, set, onNext, onBack, t, lang }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void; t: any; lang: string }) {
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

  const getTranslatedMemo = (memo: string | null) => {
    if (!memo) return null;
    if (memo.startsWith("Spells ")) {
      const word = memo.replace("Spells ", "");
      const template = SPELLS_DICT[lang] || SPELLS_DICT.en;
      return template.replace("{word}", word);
    }
    const dict = MEMORABLE_LABELS[lang] || MEMORABLE_LABELS.en;
    return dict[memo] || memo;
  };

  const planNameTrans = data.plan === "pro" ? t.pricing.proTitle : t.pricing.essentialTitle;
  const statusTemplate = need > 1 ? t.onboarding.statusText : t.onboarding.statusTextSingle;
  const statusTextStr = statusTemplate
    .replace("{planName}", planNameTrans)
    .replace("{need}", String(need))
    .replace("{selected}", String(selected.length));

  return (
    <div className="panel wide">
      <span className="step-eyebrow">{t.onboarding.step3Eyebrow}</span>
      <h1>{need > 1 ? t.onboarding.chooseMultiple : t.onboarding.chooseSingle}</h1>
      <p className="sub">{t.onboarding.step3Subtitle}</p>

      <div className="num-need">
        <Ico.phone className="w-[18px] h-[18px] text-indigo-500" />
        <span dangerouslySetInnerHTML={{ __html: statusTextStr }} />
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
          <span className="prefix">{t.onboarding.labelAreaCode}</span>
          <input className="input" inputMode="numeric" maxLength={3} placeholder="415"
            value={area}
            onChange={(e) => setArea(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onKeyDown={(e) => e.key === "Enter" && search()} />
        </div>
        <button className="btn btn-ghost" onClick={search} disabled={area.replace(/\D/g, "").length !== 3}>
          <Ico.search className="w-[18px] h-[18px]" /> {t.onboarding.btnSearch}
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
          <Ico.refresh className="w-[15px] h-[15px]" /> {t.onboarding.refreshBtn}
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
            const memoLabelTrans = getTranslatedMemo(n.memorable);
            return (
              <button key={n.id} className={"num-opt" + (sel ? " sel" : "") + (disabled ? " disabled" : "")} onClick={() => toggle(n)}>
                <span className="tick">{sel && <Ico.check className="w-[13px] h-[13px]" />}</span>
                <span className="nlabel">
                  <span className="nnum">{n.number}</span>
                  {memoLabelTrans && <span className="memorable">{memoLabelTrans}</span>}
                  {!memoLabelTrans && <span className="nmeta">{t.onboarding.metaLocal}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="num-empty">
          <Ico.search className="w-[30px] h-[30px] mx-auto mb-2" />
          <div>{t.onboarding.errNoNumbers}</div>
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} nextDisabled={selected.length !== need} t={t} />
    </div>
  );
}

/* ============ SECURE CHECKOUT MODAL OVERLAY ============ */
interface CheckoutModalProps {
  isOpen: boolean;
  checkoutUrl: string;
  onClose: () => void;
  t: any;
}

function CheckoutModal({ isOpen, checkoutUrl, onClose, t }: CheckoutModalProps) {
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
            <span className="font-semibold text-slate-800 text-sm">{t.onboarding.checkoutSecure}</span>
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
            <p className="mt-4 text-xs text-slate-500 font-medium">{t.onboarding.checkoutSecuring}</p>
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
function PaymentStep({ data, set, onNext, onBack, t, lang }: { data: OnboardingData; set: (patch: Partial<OnboardingData>) => void; onNext: () => void; onBack: () => void; t: any; lang: string }) {
  const plan = planById(data.plan);
  const price = data.billing === "yearly" ? plan.annual : plan.monthly;
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const handleStartPayment = () => {
    // Generate checkout URL with plan query details and language code
    const url = `/signup/creem-checkout?plan=${data.plan}&billing=${data.billing}&lang=${lang}`;
    setCheckoutUrl(url);
    setModalOpen(true);
  };

  // Listen to iframe success messages
  useEffect(() => {
    const handleMsg = async (e: MessageEvent) => {
      if (e.data && e.data.type === "CREEM_PAYMENT_SUCCESS") {
        try {
          // Register the caregiver and seed selected phone numbers in Supabase
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.account.email,
              password: data.account.password,
              name: data.account.name,
              numbers: data.numbers,
              captchaToken: data.account.captchaToken,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            console.error("Failed to register caregiver:", errData.error);
          }
        } catch (err) {
          console.error("Error during Supabase signup registration:", err);
        }

        setTimeout(() => {
          setModalOpen(false);
          onNext(); // Advance to Success step
        }, 800);
      }
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [onNext, data]);

  const translatedPlanName = data.plan === "pro" ? t.pricing.proTitle : t.pricing.essentialTitle;
  const billingName = data.billing === "yearly" ? t.onboarding.annual : t.onboarding.monthly;
  const orderPlanStr = t.onboarding.orderPlan
    .replace("{planName}", translatedPlanName)
    .replace("{billingName}", billingName);

  const orderNumberStr = plan.numbers > 1
    ? t.onboarding.orderNumberPlural.replace("{count}", String(plan.numbers))
    : t.onboarding.orderNumberSingle;

  const perSuffix = data.billing === "yearly" ? t.ui.perYear : t.ui.perMonth;
  const billedPeriodTrans = data.billing === "yearly" ? t.onboarding.billedYearly : t.onboarding.billedMonthly;
  const bannerSubStr = PAYMENT_BANNER_SUB[lang] || PAYMENT_BANNER_SUB.en;

  return (
    <div className="panel">
      <span className="step-eyebrow">{t.onboarding.step4Eyebrow}</span>
      <h1>{t.onboarding.step4Title}</h1>
      <p className="sub">{t.onboarding.step4Subtitle}</p>

      <div className="trial-banner">
        <span className="ti"><Ico.check className="w-[19px] h-[19px] text-white" /></span>
        <div>
          <b>{price.label}{perSuffix}, billed {billedPeriodTrans}</b>
          <p>{bannerSubStr}</p>
        </div>
      </div>

      <div className="order-sum mt-6">
        <div className="os-row">
          <span>{orderPlanStr}</span>
          <b>{price.label}{perSuffix}</b>
        </div>
        <div className="os-row">
          <span>{orderNumberStr}</span>
          <span>{t.onboarding.included}</span>
        </div>
        <div className="os-row total">
          <span>{t.onboarding.dueToday}</span>
          <span>{price.label}</span>
        </div>
      </div>

      <div className="trust-row mt-6">
        <Ico.lock className="w-[17px] h-[17px] text-teal-600" />
        {t.onboarding.orderSecured}
      </div>

      <div className="step-nav mt-8">
        <button className="btn btn-ghost" onClick={onBack}>{t.onboarding.btnBack}</button>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={handleStartPayment}>
          <Ico.lock className="w-[17px] h-[17px] text-white mr-1.5" />
          {t.onboarding.btnPay}
        </button>
      </div>

      <CheckoutModal 
        isOpen={modalOpen} 
        checkoutUrl={checkoutUrl} 
        onClose={() => setModalOpen(false)} 
        t={t}
      />
    </div>
  );
}

/* ============ STEP 5 — Success ============ */
function SuccessStep({ data, t, lang }: { data: OnboardingData; t: any; lang: string }) {
  const plan = planById(data.plan);
  const contactCap = plan.id === "pro" ? 6 : 3;
  const shown = Math.min(contactCap, 4);
  const ownerFirst = (data.account.name || "You").trim().split(/\s+/)[0];

  const translatedPlanName = data.plan === "pro" ? t.pricing.proTitle : t.pricing.essentialTitle;

  const successTitleStr = t.onboarding.successTitle.replace("{name}", ownerFirst);
  const successSubStr = (plan.numbers > 1 ? t.onboarding.successSubtitlePlural : t.onboarding.successSubtitle)
    .replace("{planName}", translatedPlanName);

  const moreStr = data.numbers.length > 1
    ? (MORE_NUMBERS[lang] || MORE_NUMBERS.en).replace("{count}", String(data.numbers.length - 1))
    : "";
  const readyStr = `${moreStr}${t.onboarding.ncStatusReady}`;

  const circleLabelStr = t.onboarding.circleLabel.replace("{count}", String(contactCap));
  const moreSlotsStr = t.onboarding.moreSlots.replace("{count}", String(contactCap - shown));
  const confirmationStr = t.onboarding.confirmationSent.replace("{email}", data.account.email || "your email");

  return (
    <div className="panel">
      <div className="success-wrap">
        <div className="success-mark"><Ico.check className="w-[40px] h-[40px] text-white" /></div>
        <h1>{successTitleStr}</h1>
        <p className="sub">{successSubStr}</p>

        <div className="next-card">
          <div className="nc-head">
            <span className="num-badge">{data.numbers[0] ? data.numbers[0].number : "(415) 555-0100"}</span>
            <span className="nc-ttl">
              <span style={{ whiteSpace: "nowrap" }}>
                {data.numbers.length > 1 ? t.onboarding.ncNumberPlural : t.onboarding.ncNumberSingle}
              </span>
              <span>{readyStr}</span>
            </span>
          </div>

          <div className="circle-preview">
            <div className="cp-label">{circleLabelStr}</div>
            <div className="cp-slots">
              <div className="cp-slot filled">
                <span className="ava" style={{ background: "var(--blue)" }}>{initials(data.account.name)}</span>
                <span className="cp-who"><b>{data.account.name || "You"}</b><span>{t.onboarding.ownerLabel}</span></span>
                <span className="cp-order">{t.onboarding.added}</span>
              </div>
              {Array.from({ length: shown - 1 }).map((_, i) => (
                <div key={i} className="cp-slot">
                  <span className="ava empty"><Ico.plus className="w-[18px] h-[18px] text-zinc-400" /></span>
                  <span className="cp-who"><b>{t.onboarding.addContact}</b><span>{t.onboarding.addContactDesc}</span></span>
                  <span className="cp-order">#{i + 2}</span>
                </div>
              ))}
              {contactCap > shown && <div className="pw-note" style={{ textAlign: "center" }}>{moreSlotsStr}</div>}
            </div>
          </div>
        </div>

        <div className="success-actions">
          <Link className="btn btn-primary btn-lg btn-block" href={`/dashboard?lang=${lang}`}>
            {t.onboarding.btnDashboard} <Ico.arrowR className="w-[18px] h-[18px]" />
          </Link>
          <span className="sa-note">{confirmationStr}</span>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN ONBOARDING PROCESS ============ */
function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Onboarding Page Language State Hook
  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");

  useEffect(() => {
    const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
    const paramLang = searchParams.get("lang");
    if (paramLang && validLangs.includes(paramLang)) {
      setLang(paramLang as any);
      localStorage.setItem("lang", paramLang);
    } else {
      const savedLang = localStorage.getItem("lang") as any;
      if (validLangs.includes(savedLang)) {
        setLang(savedLang);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = translations[lang];

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

  // If redirected back from Google OAuth, fetch caregiver profile details and auto-advance
  useEffect(() => {
    const isGoogle = searchParams.get("google") === "true";
    if (isGoogle) {
      async function loadGoogleProfile() {
        try {
          const res = await fetch("/api/caregiver/profile");
          if (res.ok) {
            const result = await res.json();
            if (result.profile) {
              setData((d) => ({
                ...d,
                account: {
                  name: result.profile.name || "Google User",
                  email: result.profile.email || "",
                  password: "google_oauth_bypass", // Bypass password constraint in step-1 validation
                },
              }));
              setStep(1); // Auto-advance to step 2 (Plan selection)
            }
          }
        } catch (err) {
          console.error("Failed to load Google profile in onboarding:", err);
        }
      }
      loadGoogleProfile();
    }
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
    <Shell layout="split" stepIndex={Math.min(step, 3)} hideChrome={success} lang={lang} t={t}>
      {step === 0 && <AccountStep data={data} set={set} onNext={next} t={t} lang={lang} />}
      {step === 1 && <PlanStep data={data} set={set} onNext={next} onBack={back} t={t} lang={lang} />}
      {step === 2 && <NumberStep data={data} set={set} onNext={next} onBack={back} t={t} lang={lang} />}
      {step === 3 && <PaymentStep data={data} set={set} onNext={next} onBack={back} t={t} lang={lang} />}
      {step === 4 && <SuccessStep data={data} t={t} lang={lang} />}
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
