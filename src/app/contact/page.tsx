"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { HomepageTranslations } from "@/lib/translations";
import enTranslations from "@/lib/translations/en";

type Lang =
  | "en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko";

const VALID_LANGS: Lang[] = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];

/* ============ CONTACT BODY COPY ============ */
interface ContactDict {
  eyebrow: string;
  title: string;
  titleAccent: string;
  lead: string;
  formTitle: string;
  formSub: string;
  name: string;
  namePh: string;
  email: string;
  emailPh: string;
  help: string;
  helpPh: string;
  send: string;
  sending: string;
  privacy: string;
  successTitle: (name: string) => string;
  successBody: string;
  sendAnother: string;
  error: string;
}

const CONTACT_DICTS: Record<Lang, ContactDict> = {
  en: {
    eyebrow: "Contact",
    title: "Talk to a real person.",
    titleAccent: "We answer.",
    lead: "Real support, no phone tree — replies from a named person.",
    formTitle: "Send us a note",
    formSub: "We reply within one business day.",
    name: "Your name",
    namePh: "e.g. Maria Delgado",
    email: "Email",
    emailPh: "you@example.com",
    help: "How can we help?",
    helpPh: "Tell us a little about what you need — setup, moving a number, adding a family member…",
    send: "Send message",
    sending: "Sending…",
    privacy: "We only use your details to reply. No marketing lists.",
    successTitle: (name) => `Thanks, ${name || "there"} — message sent.`,
    successBody: "A real person will reply to your email within one business day.",
    sendAnother: "Send another",
    error: "Something went wrong. Please try again.",
  },
  es: {
    eyebrow: "Contacto",
    title: "Habla con una persona real.",
    titleAccent: "Respondemos.",
    lead: "Soporte real, sin menús telefónicos: te responde una persona con nombre.",
    formTitle: "Envíanos un mensaje",
    formSub: "Respondemos en un día hábil.",
    name: "Tu nombre",
    namePh: "p. ej. Maria Delgado",
    email: "Correo electrónico",
    emailPh: "tu@ejemplo.com",
    help: "¿Cómo podemos ayudarte?",
    helpPh: "Cuéntanos un poco qué necesitas: configuración, mover un número, añadir a un familiar…",
    send: "Enviar mensaje",
    sending: "Enviando…",
    privacy: "Solo usamos tus datos para responderte. Sin listas de marketing.",
    successTitle: (name) => `Gracias, ${name || "hola"} — mensaje enviado.`,
    successBody: "Una persona real responderá a tu correo en un día hábil.",
    sendAnother: "Enviar otro",
    error: "Algo salió mal. Inténtalo de nuevo.",
  },
  fr: {
    eyebrow: "Contact",
    title: "Parlez à une vraie personne.",
    titleAccent: "Nous répondons.",
    lead: "Un vrai support, sans serveur vocal — une personne identifiée vous répond.",
    formTitle: "Écrivez-nous",
    formSub: "Nous répondons sous un jour ouvré.",
    name: "Votre nom",
    namePh: "ex. Maria Delgado",
    email: "E-mail",
    emailPh: "vous@exemple.com",
    help: "Comment pouvons-nous aider ?",
    helpPh: "Dites-nous ce dont vous avez besoin : configuration, transfert d'un numéro, ajout d'un proche…",
    send: "Envoyer le message",
    sending: "Envoi…",
    privacy: "Nous utilisons vos coordonnées uniquement pour vous répondre. Aucune liste marketing.",
    successTitle: (name) => `Merci, ${name || "à vous"} — message envoyé.`,
    successBody: "Une vraie personne répondra à votre e-mail sous un jour ouvré.",
    sendAnother: "En envoyer un autre",
    error: "Une erreur est survenue. Veuillez réessayer.",
  },
  ja: {
    eyebrow: "お問い合わせ",
    title: "本物の担当者と話せます。",
    titleAccent: "必ず返信します。",
    lead: "自動音声なしの本物のサポート。名前のある担当者が返信します。",
    formTitle: "メッセージを送る",
    formSub: "1営業日以内に返信します。",
    name: "お名前",
    namePh: "例：山田 太郎",
    email: "メールアドレス",
    emailPh: "you@example.com",
    help: "どのようなご用件ですか？",
    helpPh: "ご要望を少しお聞かせください（初期設定、番号の移行、家族の追加など）",
    send: "メッセージを送信",
    sending: "送信中…",
    privacy: "いただいた情報は返信のみに使用します。マーケティング利用はありません。",
    successTitle: (name) => `${name || "ご連絡"}さん、ありがとうございます — 送信しました。`,
    successBody: "1営業日以内に担当者がメールで返信します。",
    sendAnother: "別のメッセージを送る",
    error: "問題が発生しました。もう一度お試しください。",
  },
  zh: {
    eyebrow: "联系我们",
    title: "与真人对话。",
    titleAccent: "我们会回复。",
    lead: "真正的支持，没有语音菜单——由具名的真人回复。",
    formTitle: "给我们留言",
    formSub: "我们会在一个工作日内回复。",
    name: "您的姓名",
    namePh: "例如：李明",
    email: "电子邮箱",
    emailPh: "you@example.com",
    help: "我们能帮您什么？",
    helpPh: "简单说说您的需求——设置、迁移号码、添加家人……",
    send: "发送消息",
    sending: "发送中…",
    privacy: "我们仅使用您的信息进行回复，绝不用于营销名单。",
    successTitle: (name) => `谢谢您，${name || "您"} — 消息已发送。`,
    successBody: "真人将在一个工作日内通过邮件回复您。",
    sendAnother: "再发一条",
    error: "出了点问题，请重试。",
  },
  ar: {
    eyebrow: "تواصل معنا",
    title: "تحدّث إلى شخص حقيقي.",
    titleAccent: "نحن نردّ.",
    lead: "دعم حقيقي بلا قوائم هاتفية — يردّ عليك شخص بالاسم.",
    formTitle: "أرسل لنا رسالة",
    formSub: "نردّ خلال يوم عمل واحد.",
    name: "اسمك",
    namePh: "مثال: ماريا دلغادو",
    email: "البريد الإلكتروني",
    emailPh: "you@example.com",
    help: "كيف يمكننا المساعدة؟",
    helpPh: "أخبرنا قليلاً بما تحتاجه — الإعداد، نقل رقم، إضافة أحد أفراد العائلة…",
    send: "إرسال الرسالة",
    sending: "جارٍ الإرسال…",
    privacy: "نستخدم بياناتك للردّ فقط. لا قوائم تسويقية.",
    successTitle: (name) => `شكراً، ${name || "لك"} — تم إرسال الرسالة.`,
    successBody: "سيردّ عليك شخص حقيقي عبر بريدك الإلكتروني خلال يوم عمل واحد.",
    sendAnother: "إرسال رسالة أخرى",
    error: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
  hi: {
    eyebrow: "संपर्क करें",
    title: "किसी असली व्यक्ति से बात करें।",
    titleAccent: "हम जवाब देते हैं।",
    lead: "असली सहायता, कोई फ़ोन मेन्यू नहीं — नाम वाले व्यक्ति से जवाब।",
    formTitle: "हमें संदेश भेजें",
    formSub: "हम एक कार्यदिवस के भीतर जवाब देते हैं।",
    name: "आपका नाम",
    namePh: "जैसे मारिया डेलगाडो",
    email: "ईमेल",
    emailPh: "you@example.com",
    help: "हम कैसे मदद कर सकते हैं?",
    helpPh: "थोड़ा बताएं कि आपको क्या चाहिए — सेटअप, नंबर बदलना, परिवार का सदस्य जोड़ना…",
    send: "संदेश भेजें",
    sending: "भेजा जा रहा है…",
    privacy: "हम आपकी जानकारी केवल जवाब देने के लिए उपयोग करते हैं। कोई मार्केटिंग सूची नहीं।",
    successTitle: (name) => `धन्यवाद, ${name || "आप"} — संदेश भेजा गया।`,
    successBody: "एक असली व्यक्ति एक कार्यदिवस के भीतर आपके ईमेल का जवाब देगा।",
    sendAnother: "एक और भेजें",
    error: "कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।",
  },
  pt: {
    eyebrow: "Contato",
    title: "Fale com uma pessoa de verdade.",
    titleAccent: "Nós respondemos.",
    lead: "Suporte real, sem menu telefônico — respostas de uma pessoa com nome.",
    formTitle: "Envie-nos uma mensagem",
    formSub: "Respondemos em até um dia útil.",
    name: "Seu nome",
    namePh: "ex.: Maria Delgado",
    email: "E-mail",
    emailPh: "voce@exemplo.com",
    help: "Como podemos ajudar?",
    helpPh: "Conte um pouco do que você precisa — configuração, mudar um número, adicionar um familiar…",
    send: "Enviar mensagem",
    sending: "Enviando…",
    privacy: "Usamos seus dados apenas para responder. Sem listas de marketing.",
    successTitle: (name) => `Obrigado, ${name || "você"} — mensagem enviada.`,
    successBody: "Uma pessoa de verdade responderá ao seu e-mail em até um dia útil.",
    sendAnother: "Enviar outra",
    error: "Algo deu errado. Tente novamente.",
  },
  de: {
    eyebrow: "Kontakt",
    title: "Sprich mit einem echten Menschen.",
    titleAccent: "Wir antworten.",
    lead: "Echter Support, kein Telefonmenü — Antworten von einer namentlich genannten Person.",
    formTitle: "Schreib uns",
    formSub: "Wir antworten innerhalb eines Werktags.",
    name: "Dein Name",
    namePh: "z. B. Maria Delgado",
    email: "E-Mail",
    emailPh: "du@beispiel.com",
    help: "Wie können wir helfen?",
    helpPh: "Sag uns kurz, was du brauchst — Einrichtung, Nummer umziehen, Familienmitglied hinzufügen…",
    send: "Nachricht senden",
    sending: "Senden…",
    privacy: "Wir verwenden deine Daten nur zur Antwort. Keine Marketinglisten.",
    successTitle: (name) => `Danke, ${name || "dir"} — Nachricht gesendet.`,
    successBody: "Eine echte Person antwortet innerhalb eines Werktags per E-Mail.",
    sendAnother: "Weitere senden",
    error: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
  it: {
    eyebrow: "Contatti",
    title: "Parla con una persona vera.",
    titleAccent: "Rispondiamo.",
    lead: "Supporto reale, nessun menu telefonico — risposte da una persona con nome e cognome.",
    formTitle: "Scrivici",
    formSub: "Rispondiamo entro un giorno lavorativo.",
    name: "Il tuo nome",
    namePh: "es. Maria Delgado",
    email: "Email",
    emailPh: "tu@esempio.com",
    help: "Come possiamo aiutarti?",
    helpPh: "Raccontaci di cosa hai bisogno — configurazione, spostare un numero, aggiungere un familiare…",
    send: "Invia messaggio",
    sending: "Invio…",
    privacy: "Usiamo i tuoi dati solo per risponderti. Nessuna lista marketing.",
    successTitle: (name) => `Grazie, ${name || "a te"} — messaggio inviato.`,
    successBody: "Una persona vera risponderà alla tua email entro un giorno lavorativo.",
    sendAnother: "Invia un altro",
    error: "Qualcosa è andato storto. Riprova.",
  },
  ko: {
    eyebrow: "문의하기",
    title: "실제 담당자와 대화하세요.",
    titleAccent: "답변드립니다.",
    lead: "자동 응답 메뉴 없는 진짜 지원 — 실명 담당자가 답변합니다.",
    formTitle: "메시지 보내기",
    formSub: "영업일 기준 하루 안에 답변드립니다.",
    name: "이름",
    namePh: "예: 홍길동",
    email: "이메일",
    emailPh: "you@example.com",
    help: "무엇을 도와드릴까요?",
    helpPh: "필요하신 내용을 알려 주세요 — 설정, 번호 이전, 가족 추가 등",
    send: "메시지 보내기",
    sending: "보내는 중…",
    privacy: "회신 목적으로만 정보를 사용하며 마케팅 목록에 추가하지 않습니다.",
    successTitle: (name) => `감사합니다, ${name || "고객"}님 — 메시지를 보냈습니다.`,
    successBody: "실제 담당자가 영업일 기준 하루 안에 이메일로 답변드립니다.",
    sendAnother: "다시 보내기",
    error: "문제가 발생했습니다. 다시 시도해 주세요.",
  },
};

/* ============ SHARED LOGO ============ */
function LogoMark({ height }: { height: number }) {
  return (
    <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: `${height}px`, width: "auto", display: "block" }}>
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
  );
}

/* ============ PAGE ============ */
export default function ContactPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [t, setT] = useState<HomepageTranslations>(enTranslations);
  const [scrolled, setScrolled] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sentName, setSentName] = useState("");

  const c = CONTACT_DICTS[lang];

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && (VALID_LANGS as string[]).includes(savedLang)) {
      setLang(savedLang as Lang);
    }
  }, []);

  useEffect(() => {
    import(`@/lib/translations/${lang}`).then((mod) => setT(mod.default));
  }, [lang]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const changeLanguage = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setErrorMsg("");
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data?.error || c.error);
        setStatus("idle");
        return;
      }
      setSentName(name.trim());
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setErrorMsg(c.error);
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen selection:bg-teal-500 selection:text-white overflow-x-hidden">
      {/* ============== HEADER ============== */}
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap header-inner">
          <Link className="brand" href="/" aria-label="iCanCall home">
            <LogoMark height={40} />
          </Link>
          <nav className="nav">
            <Link href="/#how">{t.nav.how}</Link>
            <Link href="/#features">{t.nav.features}</Link>
            <Link href="/#usecases">{t.nav.who}</Link>
            <Link href="/#pricing">{t.nav.pricing}</Link>
            <Link href="/#faq">{t.nav.faq}</Link>
          </nav>
          <div className="header-cta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a className="btn btn-text" href="/login" style={{ marginRight: 6 }}>{t.nav.login}</a>
            <Link className="btn btn-ghost" href="/#how">{t.nav.howWorksBtn}</Link>
            <Link className="btn btn-primary" href="/#pricing">{t.nav.selectPlanBtn}</Link>
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as Lang)}
              className="lang-select"
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--ink-soft)",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "0.86rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none",
                fontFamily: "var(--font)",
                marginLeft: 4,
              }}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ja">🇯🇵 JA</option>
              <option value="zh">🇨🇳 ZH</option>
              <option value="ar">🇸🇦 AR</option>
              <option value="hi">🇮🇳 HI</option>
              <option value="pt">🇵🇹 PT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="it">🇮🇹 IT</option>
              <option value="ko">🇰🇷 KO</option>
            </select>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap contact-grid">
            <div className="hero-copy">
              <span className="eyebrow">{c.eyebrow}</span>
              <h1>
                <span className="block mb-2">{c.title}</span>
                <span className="accent">{c.titleAccent}</span>
              </h1>
              <p className="lead">{c.lead}</p>
            </div>

            <div className="contact-card">
              {status === "sent" ? (
                <div className="contact-success">
                  <div className="contact-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 6" />
                    </svg>
                  </div>
                  <h2 className="contact-card-title">{c.successTitle(sentName)}</h2>
                  <p className="contact-card-sub">{c.successBody}</p>
                  <button type="button" className="btn btn-ghost" onClick={() => setStatus("idle")}>
                    {c.sendAnother}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <h2 className="contact-card-title">{c.formTitle}</h2>
                  <p className="contact-card-sub">{c.formSub}</p>

                  <label className="contact-field">
                    <span>{c.name}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={c.namePh}
                      required
                      autoComplete="name"
                    />
                  </label>

                  <label className="contact-field">
                    <span>{c.email}</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.emailPh}
                      required
                      autoComplete="email"
                    />
                  </label>

                  <label className="contact-field">
                    <span>{c.help}</span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={c.helpPh}
                      rows={5}
                      required
                    />
                  </label>

                  {errorMsg && <p className="contact-error">{errorMsg}</p>}

                  <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={status === "sending"}>
                    {status === "sending" ? c.sending : c.send}
                  </button>
                  <p className="contact-privacy">{c.privacy}</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <Link className="brand" href="/">
                <LogoMark height={32} />
              </Link>
              <p className="blurb">{t.footer.blurb}</p>
            </div>
            <div>
              <h5>{t.footer.product}</h5>
              <ul>
                <li><Link href="/#how">{t.nav.how}</Link></li>
                <li><Link href="/#features">{t.nav.features}</Link></li>
                <li><Link href="/#pricing">{t.nav.pricing}</Link></li>
                <li><Link href="/#faq">{t.nav.faq}</Link></li>
                <li><a href="/comparison-chart">{t.footer.comparisonChart}</a></li>
                <li><a href="/login">Login</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.who}</h5>
              <ul>
                <li><a href="/parents">{t.footer.parents}</a></li>
                <li><a href="/caregivers">{t.footer.caregivers}</a></li>
                <li><a href="/seniors">{t.footer.seniors}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.company}</h5>
              <ul>
                <li><Link href="/#about">{t.footer.about}</Link></li>
                <li><Link href="/#careers">{t.footer.careers}</Link></li>
                <li><a href="/contact">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.trust}</h5>
              <ul>
                <li><a href="/privacy-policy">{t.footer.privacy}</a></li>
                <li><Link href="/#security">{t.footer.security}</Link></li>
                <li><a href="/terms-of-service">{t.footer.terms}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t.footer.allRights}</span>
            <span>{t.footer.moments}</span>
            <a href="https://elevenlabs.io/startup-grants" target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
              <img src="https://eleven-public-cdn.elevenlabs.io/payloadcms/pwsc4vchsqt-ElevenLabsGrants.webp" alt="ElevenLabs" style={{ width: "120px", height: "auto" }} />
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(32px, 5vw, 72px);
          align-items: center;
        }
        .contact-grid .hero-copy h1 { font-size: clamp(2.2rem, 4vw, 3.4rem); }
        .contact-grid .hero-copy .accent { color: var(--accent); }
        .contact-grid .hero-copy .lead { max-width: 34ch; margin-top: 20px; }
        .contact-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: clamp(24px, 3vw, 38px);
          box-shadow: var(--shadow-lg);
        }
        .contact-card-title { font-size: 1.4rem; font-weight: 700; color: var(--ink); }
        .contact-card-sub { margin-top: 6px; margin-bottom: 22px; color: var(--ink-soft); font-size: 0.95rem; }
        .contact-field { display: block; margin-bottom: 16px; }
        .contact-field > span {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--ink-soft);
          margin-bottom: 7px;
        }
        .contact-field input,
        .contact-field textarea {
          width: 100%;
          font-family: var(--font);
          font-size: 0.98rem;
          color: var(--ink);
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 14px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .contact-field textarea { resize: vertical; min-height: 120px; line-height: 1.5; }
        .contact-field input::placeholder,
        .contact-field textarea::placeholder { color: var(--ink-faint); }
        .contact-field input:focus,
        .contact-field textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px oklch(0.58 0.115 232 / 0.12);
        }
        .contact-privacy { margin-top: 14px; font-size: 0.8rem; color: var(--ink-faint); text-align: center; }
        .contact-error {
          margin-bottom: 14px;
          font-size: 0.88rem;
          color: oklch(0.55 0.17 25);
          background: oklch(0.96 0.03 25);
          border: 1px solid oklch(0.88 0.06 25);
          border-radius: 10px;
          padding: 10px 12px;
        }
        .contact-success { text-align: center; padding: 12px 4px; }
        .contact-success-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 18px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--green);
        }
        .contact-success-icon svg { width: 28px; height: 28px; }
        .contact-success .btn { margin-top: 22px; }
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-grid .hero-copy .lead { max-width: none; }
        }
      `}</style>
    </div>
  );
}
