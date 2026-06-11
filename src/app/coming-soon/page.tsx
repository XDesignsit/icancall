"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { translations } from "@/lib/translations";

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
  user: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="8" r="4"/>
      <path d="M5 21a7 7 0 0 1 14 0"/>
    </svg>
  ),
  save: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 4h11l3 3v13H5z"/>
      <path d="M9 4v5h6"/>
      <circle cx="12" cy="14" r="2.5"/>
    </svg>
  ),
  chat: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 5h16v11H7l-3 3V5Z"/>
      <path d="M8 10h8M8 13h5"/>
    </svg>
  ),
  alert: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v5M12 16h.01"/>
    </svg>
  )
};

export default function ComingSoon() {
  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as any;
    const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
    if (validLangs.includes(savedLang)) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const changeLanguage = (newLang: "en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const t = translations[lang];

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Form state
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [formDone, setFormDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [consentInvalid, setConsentInvalid] = useState(false);

  // Demo animation state
  const [demoStatus, setDemoStatus] = useState("Incoming call");
  const [demoConnected, setDemoConnected] = useState(false);
  const [contactsState, setContactsState] = useState([
    { name: "You", type: "Mobile", state: "Standing by", ringClass: "", bg: "oklch(0.58 0.115 232)" },
    { name: "Your partner", type: "Mobile", state: "Standing by", ringClass: "", bg: "oklch(0.62 0.10 198)" },
    { name: "A grandparent", type: "Family", state: "Standing by", ringClass: "", bg: "oklch(0.55 0.11 280)" },
    { name: "A trusted neighbor", type: "Backup", state: "Standing by", ringClass: "", bg: "oklch(0.6 0.12 30)" }
  ]);

  // Demo animation loop
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDemoStatus("Connected");
      setDemoConnected(true);
      setContactsState(prev => {
        const next = [...prev];
        next[1] = { ...next[1], state: "Connected ✓", ringClass: "is-connected" };
        return next;
      });
      return;
    }

    let isMounted = true;
    const answerPlan = [1, 0, 2, 1, 3];
    let planIdx = 0;

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const run = async () => {
      while (isMounted) {
        // Reset
        setDemoConnected(false);
        setDemoStatus("Incoming call");
        setContactsState([
          { name: "You", type: "Mobile", state: "Standing by", ringClass: "", bg: "oklch(0.58 0.115 232)" },
          { name: "Your partner", type: "Mobile", state: "Standing by", ringClass: "", bg: "oklch(0.62 0.10 198)" },
          { name: "A grandparent", type: "Family", state: "Standing by", ringClass: "", bg: "oklch(0.55 0.11 280)" },
          { name: "A trusted neighbor", type: "Backup", state: "Standing by", ringClass: "", bg: "oklch(0.6 0.12 30)" }
        ]);

        const answerAt = answerPlan[planIdx % answerPlan.length];
        planIdx++;

        await sleep(1100);
        if (!isMounted) break;
        setDemoStatus("Routing…");

        for (let i = 0; i < 4; i++) {
          if (!isMounted) break;
          // Set ringing
          setContactsState(prev => {
            const next = [...prev];
            next[i] = { ...next[i], state: "Ringing…", ringClass: "is-ringing" };
            return next;
          });
          await sleep(1500);
          if (!isMounted) break;

          if (i === answerAt) {
            setContactsState(prev => {
              const next = [...prev];
              next[i] = { ...next[i], state: "Connected ✓", ringClass: "is-connected" };
              return next;
            });
            setDemoStatus("Connected");
            setDemoConnected(true);
            break;
          } else {
            setContactsState(prev => {
              const next = [...prev];
              next[i] = { ...next[i], state: "No answer", ringClass: "is-missed" };
              return next;
            });
            await sleep(360);
          }
        }
        await sleep(2600);
      }
    };

    run();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailInvalid(false);
    setPhoneInvalid(false);
    setConsentInvalid(false);
    setShowError(false);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());
    const phoneOk = phoneInput.replace(/\D/g, '').length >= 10;
    const consentOk = smsConsent;

    const problems = [];
    if (!emailOk) { setEmailInvalid(true); problems.push("a valid email"); }
    if (!phoneOk) { setPhoneInvalid(true); problems.push("a valid mobile number"); }
    if (!consentOk) { setConsentInvalid(true); problems.push("SMS consent"); }

    if (problems.length) {
      setErrorMsg("Please add " + problems.join(", ") + " to continue.");
      setShowError(true);
      return;
    }

    try {
      const entry = { email: emailInput.trim(), phone: phoneInput.trim(), sms: true, at: new Date().toISOString() };
      const list = JSON.parse(localStorage.getItem('ic_waitlist') || '[]');
      list.push(entry);
      localStorage.setItem('ic_waitlist', JSON.stringify(list));
    } catch (_) {}

    setFormDone(true);
  };

  return (
    <div className="min-h-screen selection:bg-teal-500 selection:text-white overflow-x-hidden">
      
      {/* Styles local to the Waitlist Page */}
      <style dangerouslySetInnerHTML={{ __html: `
        .soon-badge {
          display: inline-flex; align-items: center; gap: 9px;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
          color: var(--blue-deep);
          background: var(--surface); border: 1px solid var(--line);
          padding: 8px 15px 8px 12px; border-radius: 999px;
          box-shadow: var(--shadow-sm);
          margin-bottom: 24px;
        }
        .soon-badge .pip {
          width: 8px; height: 8px; border-radius: 50%; flex: none;
          background: var(--green);
          box-shadow: 0 0 0 4px oklch(0.70 0.13 158 / 0.18);
        }
        .header.soon .header-inner { justify-content: space-between; }
        .header .soon-note {
          font-size: 0.86rem; color: var(--ink-faint); font-weight: 500;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .header .soon-note .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 4px oklch(0.70 0.13 158 / 0.18); }
        @media (max-width: 620px) { .header .soon-note span.txt { display: none; } }
        .soon-hero { padding-bottom: clamp(64px, 8vw, 104px); }
        .soon-hero .lead { max-width: 34ch; }
        .waitlist { margin-top: 32px; max-width: 440px; }
        .wl-fields { display: flex; flex-direction: column; gap: 11px; }
        .wl-field { position: relative; }
        .wl-field label {
          display: block; font-size: 0.8rem; font-weight: 600;
          color: var(--ink-soft); margin-bottom: 6px; letter-spacing: 0.01em;
        }
        .wl-field input {
          width: 100%; font-family: var(--font); font-size: 1rem;
          padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--r-md);
          background: var(--surface); color: var(--ink); outline: none;
          transition: border-color .16s, box-shadow .16s;
        }
        .wl-field input::placeholder { color: var(--ink-faint); }
        .wl-field input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px oklch(0.58 0.115 232 / 0.13); }
        .wl-field input.invalid { border-color: oklch(0.6 0.18 25); box-shadow: 0 0 0 3px oklch(0.6 0.18 25 / 0.12); }
        .wl-row { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; }
        @media (max-width: 480px) { .wl-row { grid-template-columns: 1fr; } }
        .wl-consent { display: flex; gap: 11px; align-items: flex-start; margin-top: 16px; cursor: pointer; user-select: none; }
        .wl-consent input { position: absolute; opacity: 0; width: 0; height: 0; }
        .wl-consent .box {
          flex: none; width: 22px; height: 22px; border-radius: 7px; margin-top: 1px;
          border: 1.5px solid var(--line); background: var(--surface);
          display: grid; place-items: center;
          transition: background .16s, border-color .16s;
        }
        .wl-consent .box svg { width: 14px; height: 14px; stroke: #fff; opacity: 0; transform: scale(0.6); transition: opacity .16s, transform .16s; }
        .wl-consent input:checked + .box { background: var(--blue); border-color: var(--blue); }
        .wl-consent input:checked + .box svg { opacity: 1; transform: scale(1); }
        .wl-consent.invalid .box { border-color: oklch(0.6 0.18 25); box-shadow: 0 0 0 3px oklch(0.6 0.18 25 / 0.12); }
        .wl-consent .ctxt { font-size: 0.86rem; color: var(--ink-soft); line-height: 1.45; text-align: left; }
        .wl-consent .ctxt b { color: var(--ink); font-weight: 600; }
        .waitlist .btn-submit { width: 100%; margin-top: 18px; }
        .wl-fine { margin-top: 14px; font-size: 0.82rem; color: var(--ink-faint); line-height: 1.5; text-align: left; }
        .wl-error {
          margin-top: 12px; font-size: 0.86rem; font-weight: 500;
          color: oklch(0.52 0.18 25); display: none; align-items: center; gap: 7px;
        }
        .wl-error.show { display: flex; }
        .wl-success {
          display: none; flex-direction: column; gap: 6px;
          margin-top: 32px; max-width: 460px;
          padding: 28px 28px 30px; border-radius: var(--r-lg);
          background: var(--surface); border: 1px solid oklch(0.84 0.07 158);
          box-shadow: var(--shadow-md);
        }
        .waitlist.done { display: none; }
        .wl-success.show { display: flex; }
        .wl-success .tick {
          width: 50px; height: 50px; border-radius: 14px; margin-bottom: 8px;
          background: linear-gradient(150deg, var(--green), oklch(0.62 0.12 175));
          display: grid; place-items: center; box-shadow: 0 8px 20px oklch(0.70 0.13 158 / 0.32);
        }
        .wl-success .tick svg { width: 26px; height: 26px; stroke: #fff; }
        .wl-success h3 { font-size: 1.35rem; }
        .wl-success p { color: var(--ink-soft); font-size: 0.98rem; text-align: left; }
        .wl-success .em { color: var(--blue-deep); font-weight: 600; }
        .reserve { padding-bottom: 24px; }
        .reserve .demo-caption { margin-top: 4px; }
        .reserve .save-row {
          display: flex; align-items: center; gap: 12px; margin-top: 16px;
          padding: 13px 15px; border-radius: var(--r-md);
          border: 1px dashed var(--line); background: var(--bg);
        }
        .reserve .save-row .badge {
          width: 38px; height: 38px; border-radius: 11px; flex: none;
          background: var(--tint); color: var(--blue-deep);
          display: grid; place-items: center;
        }
        .reserve .save-row .badge svg { width: 19px; height: 19px; }
        .reserve .save-row .txt b { display: block; font-size: 0.95rem; font-weight: 600; text-align: left; }
        .reserve .save-row .txt span { font-size: 0.82rem; color: var(--ink-faint); display: block; text-align: left; }
        .expect { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 52px; }
        .expect-card {
          padding: 28px 26px; border-radius: var(--r-lg);
          background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-sm);
        }
        .expect-card .ic {
          width: 46px; height: 46px; border-radius: 13px; margin-bottom: 18px;
          background: var(--tint); color: var(--blue-deep); display: grid; place-items: center;
        }
        .expect-card .ic svg { width: 23px; height: 23px; }
        .expect-card h3 { font-size: 1.14rem; margin-bottom: 8px; text-align: left; }
        .expect-card p { color: var(--ink-soft); font-size: 0.96rem; text-align: left; }
        @media (max-width: 820px) { .expect { grid-template-columns: 1fr; } }
      ` }} />

      {/* ============== HEADER ============== */}
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap header-inner">
          <a className="brand" href="/" aria-label="iCanCall home">
            <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "40px", width: "auto", display: "block" }}>
              <style>{`
                .logo-main .cls-1 { fill: #1c2530; }
                .logo-main .cls-2 { fill: #4083ae; }
                .logo-main .cls-3 { fill: #fff; }
              `}</style>
              <g>
                <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
              </g>
              <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246,25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
            </svg>
          </a>
          <nav className="nav">
            <Link href="/#how">{t.nav.how}</Link>
            <Link href="/#features">{t.nav.features}</Link>
            <Link href="/#usecases">{t.nav.who}</Link>
            <Link href="/#pricing">{t.nav.pricing}</Link>
            <Link href="/#faq">{t.nav.faq}</Link>
          </nav>
          <div className="header-cta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link className="btn btn-text" href="/login" style={{ marginRight: 6 }}>{t.nav.login}</Link>
            <Link className="btn btn-primary" href="/#pricing">{t.nav.selectPlanBtn}</Link>
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as any)}
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
                marginLeft: 4
              }}
            >
              <option value="en">🇺🇸 EN</option>
              <option value="es">🇪🇸 ES</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ja">🇯🇵 JA</option>
              <option value="zh">🇨🇳 ZH</option>
              <option value="ar">🇸🇦 AR</option>
              <option value="hi">🇮🇳 HI</option>
              <option value="pt">🇧🇷 PT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="it">🇮🇹 IT</option>
              <option value="ko">🇰🇷 KO</option>
            </select>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ============== HERO / WAITLIST ============== */}
        <section className="hero soon-hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="soon-badge">
                <span className="pip"></span>
                {t.waitlist?.launchingSoon || "Launching soon · Private early access"}
              </span>
              <h1>
                {t.waitlist?.beFirstInLine || "Be first"}<br />
                <span className="accent">{t.waitlist?.beFirstInLineAccent || "in line."}</span>
              </h1>
              <p className="lead">
                {t.waitlist?.heroLead || "iCanCall gives the people you love one memorable number that's always answered — routing to up to six trusted contacts until someone picks up. We're putting the finishing touches on it. Join the waitlist and you'll be first through the door."}
              </p>

              {/* Waitlist form */}
              <form className={`waitlist ${formDone ? "done" : ""}`} onSubmit={handleSubmit} noValidate>
                <div className="wl-fields">
                  <div className="wl-row">
                    <div className="wl-field">
                      <label htmlFor="wl-email">{t.waitlist?.emailLabel || "Email"}</label>
                      <input
                        id="wl-email"
                        type="email"
                        className={emailInvalid ? "invalid" : ""}
                        placeholder={t.waitlist?.emailPlaceholder || "you@email.com"}
                        value={emailInput}
                        onChange={(e) => { setEmailInput(e.target.value); setEmailInvalid(false); }}
                        required
                      />
                    </div>
                    <div className="wl-field">
                      <label htmlFor="wl-phone">{t.waitlist?.phoneLabel || "Mobile number"}</label>
                      <input
                        id="wl-phone"
                        type="tel"
                        className={phoneInvalid ? "invalid" : ""}
                        placeholder={t.waitlist?.phonePlaceholder || "(555) 123-4567"}
                        value={phoneInput}
                        onChange={(e) => { setPhoneInput(e.target.value); setPhoneInvalid(false); }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <label className={`wl-consent ${consentInvalid ? "invalid" : ""}`} id="wl-consent">
                  <input
                    type="checkbox"
                    id="wl-sms"
                    checked={smsConsent}
                    onChange={(e) => { setSmsConsent(e.target.checked); setConsentInvalid(false); }}
                    required
                  />
                  <span className="box">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 6" />
                    </svg>
                  </span>
                  <span className="ctxt">
                    <b>{t.waitlist?.smsConsentB || "Text me launch updates."}</b>{" "}
                    {t.waitlist?.smsConsentText || "I agree to receive occasional SMS messages from iCanCall about early access and launch. Msg & data rates may apply; reply STOP to opt out anytime."}
                  </span>
                </label>

                <button className="btn btn-primary btn-lg btn-submit" type="submit">
                  {t.waitlist?.joinBtn || "Join the waitlist"}
                </button>

                <p className={`wl-error ${showError ? "show" : ""}`} id="wl-error">
                  <Ico.alert style={{ width: 15, height: 15 }} />
                  <span className="msg">{errorMsg}</span>
                </p>
                <p className="wl-fine">
                  {t.waitlist?.noSpamFine || "No spam, ever. We'll only reach out about your early-access invite — and you can unsubscribe in one tap."}
                </p>
              </form>

              {/* Success state */}
              <div className={`wl-success ${formDone ? "show" : ""}`} id="wl-success" role="status" aria-live="polite">
                <span className="tick">
                  <Ico.check style={{ width: 26, height: 26 }} />
                </span>
                <h3>{t.waitlist?.successTitle || "You're on the list."}</h3>
                <p>
                  {(t.waitlist?.successBody || "We saved your spot under email_here. The moment iCanCall goes live, you'll get your early-access invite and first pick of a memorable number.").replace("email_here", emailInput)}
                </p>
              </div>
            </div>

            {/* Reserve card */}
            <div className={`demo reserve ${demoConnected ? "is-connected" : ""}`} id="demo" aria-label="iCanCall routing preview">
              <div className="demo-head">
                <div className="demo-number">
                  <span className="ring">
                    <Ico.phone style={{ width: 21, height: 21, stroke: "#fff" }} />
                  </span>
                  <span className="num">
                    (415) 200-CARE
                    <small>{t.waitlist?.demoSub || "One number, always answered"}</small>
                  </span>
                </div>
                <span className="demo-status">
                  <span className="live"></span>
                  <span className="txt">{demoStatus}</span>
                </span>
              </div>
              <p className="demo-caption">
                {t.waitlist?.demoBody || "A preview of what's coming — one number that finds a person, in order, until someone answers"}
              </p>
              <div className="chain">
                {contactsState.map((c, i) => (
                  <div key={i} className={`contact ${c.ringClass}`}>
                    <span className="order">{i + 1}</span>
                    <span className="avatar" style={{ background: c.bg }}>
                      {c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                    <span className="who">
                      <b>{c.name}</b>
                      <span>{c.type}</span>
                    </span>
                    <span className="state">{c.state}</span>
                  </div>
                ))}
              </div>
              <div className="save-row">
                <span className="badge">
                  <Ico.save style={{ width: 19, height: 19 }} />
                </span>
                <span className="txt">
                  <b>{t.waitlist?.reserveTitle || "Reserve early, choose first"}</b>
                  <span>{t.waitlist?.reserveText || "Waitlist members get first pick of memorable numbers at launch"}</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============== WHAT TO EXPECT ============== */}
        <section className="section tint-band" id="expect">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">{t.waitlist?.expectTitle || "What to expect"}</span>
              <h2>
                {t.waitlist?.expectSub || "A spot on the list comes with a few good things."}
              </h2>
              <p className="lead">
                {t.waitlist?.expectLead || "No commitment today — just the perks of being early when iCanCall opens its doors."}
              </p>
            </div>
            <div className="expect">
              <div className="expect-card">
                <div className="ic"><Ico.phone style={{ width: 23, height: 23 }} /></div>
                <h3>{t.waitlist?.expectCardTitle1 || "First pick of numbers"}</h3>
                <p>
                  {t.waitlist?.expectCardText1 || "Memorable numbers go fast. Waitlist members choose theirs before doors open to everyone else."}
                </p>
              </div>
              <div className="expect-card">
                <div className="ic"><Ico.user style={{ width: 23, height: 23 }} /></div>
                <h3>{t.waitlist?.expectCardTitle2 || "Founding-member rate"}</h3>
                <p>
                  {t.waitlist?.expectCardText2 || "Lock in launch pricing that stays yours for good — our thank-you for believing in this early."}
                </p>
              </div>
              <div className="expect-card">
                <div className="ic"><Ico.chat style={{ width: 23, height: 23 }} /></div>
                <h3>{t.waitlist?.expectCardTitle3 || "A say in what we build"}</h3>
                <p>
                  {t.waitlist?.expectCardText3 || "Early members shape the roadmap. We'll ask what matters most to your family — and listen."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============== FOOTER ============== */}
      <footer className="footer">
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <a className="brand" href="#top">
                <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "32px", width: "auto", display: "block" }}>
                  <g>
                    <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                    <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
                  </g>
                  <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
                </svg>
              </a>
              <p className="blurb">{t.footer.blurb}</p>
            </div>
            <div>
              <h5>{t.footer.product}</h5>
              <ul>
                <li><Link href="/#how">{t.nav.how}</Link></li>
                <li><Link href="/#features">{t.nav.features}</Link></li>
                <li><Link href="/#pricing">{t.nav.pricing}</Link></li>
                <li><Link href="/#faq">{t.nav.faq}</Link></li>
                <li><Link href="/comparison-chart">{t.footer.comparisonChart}</Link></li>
                <li><Link href="/login">Login</Link></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.who}</h5>
              <ul>
                <li><Link href="/parents">{t.footer.parents}</Link></li>
                <li><Link href="/caregivers">{t.footer.caregivers}</Link></li>
                <li><Link href="/seniors">{t.footer.seniors}</Link></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.company}</h5>
              <ul>
                <li><a href="#">{t.footer.about}</a></li>
                <li><a href="#">{t.footer.careers}</a></li>
                <li><a href="#">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.trust}</h5>
              <ul>
                <li><a href="#">{t.footer.privacy}</a></li>
                <li><a href="#">{t.footer.security}</a></li>
                <li><a href="#">{t.footer.terms}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>{t.footer.allRights}</span>
            <span>{t.footer.moments}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
