"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { translations } from "@/lib/translations";

/* ============ TYPES ============ */
interface Contact {
  id: number;
  name: string;
  rel: string;
  available: boolean;
}

interface SimulatedCallConfig {
  av: string;
  avColor?: string;
  name: string;
  state: string;
  cls?: string;
}

/* ============ CONFIG ============ */
const PALETTE = [
  "oklch(0.58 0.115 232)", "oklch(0.62 0.10 198)", "oklch(0.55 0.11 280)",
  "oklch(0.60 0.12 30)", "oklch(0.58 0.12 145)", "oklch(0.55 0.12 330)"
];

const VANITY_WORDS = [
  { word: "CARE", digits: "2273" },
  { word: "HOME", digits: "4663" },
  { word: "HELP", digits: "4357" },
  { word: "SAFE", digits: "7233" },
  { word: "CALL", digits: "2255" },
  { word: "LOVE", digits: "5683" },
  { word: "FAMILY", digits: "3264" },
];

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
  shield: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"/>
      <path d="m9 12 2 2 4-4"/>
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
  plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  chevronUp: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m18 15-6-6-6 6"/>
    </svg>
  ),
  chevronDown: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  trash: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  ),
  lock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </svg>
  )
};

export default function Home() {
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Live Auto Routing Demo state
  const [demoStatus, setDemoStatus] = useState("Incoming call");
  const [demoStateIndex, setDemoStateIndex] = useState(-1); // -1 = standby, 0-3 = ringing/connected index
  const [demoRinging, setDemoRinging] = useState<number | null>(null);
  const [demoConnected, setDemoConnected] = useState<number | null>(null);
  const [demoMissed, setDemoMissed] = useState<number[]>([]);
  const [demoContainerConnected, setDemoContainerConnected] = useState(false);

  // Circle builder simulator state
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, name: "Sarah R.", rel: "Daughter", available: false },
    { id: 2, name: "David M.", rel: "Son", available: true },
    { id: 3, name: "Lena N.", rel: "Neighbor", available: true },
  ]);
  const [addName, setAddName] = useState("");
  const [addRel, setAddRel] = useState("");
  
  const [simMode, setSimMode] = useState<"cascade" | "menu">("cascade");
  const [simCalling, setSimCalling] = useState(false);
  const [simScreen, setSimScreen] = useState<SimulatedCallConfig>({
    av: "—",
    name: "Ready",
    state: "Press call to start routing"
  });
  const [simDots, setSimDots] = useState<string[]>([]);
  const [simRingingRow, setSimRingingRow] = useState<number | null>(null);
  const [simConnectedRow, setSimConnectedRow] = useState<number | null>(null);
  const [simMissedRows, setSimMissedRows] = useState<number[]>([]);
  const [simMenuChoice, setSimMenuChoice] = useState<number | null>(null);

  // Initials and color helpers
  const getInitials = (n: string) => initials(n);
  const getColor = (i: number) => PALETTE[i % PALETTE.length];

  // Header scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // FAQ toggle handler
  const toggleFaq = (i: number) => {
    setOpenFaq(prev => (prev === i ? null : i));
  };

  // Live Auto Routing demo interval loop
  useEffect(() => {
    const answerPlan = [1, 0, 2, 1, 3];
    let planIdx = 0;
    let timer: NodeJS.Timeout;

    const runDemoLoop = async () => {
      while (true) {
        // Reset states
        setDemoStatus("Incoming call");
        setDemoRinging(null);
        setDemoConnected(null);
        setDemoMissed([]);
        setDemoContainerConnected(false);
        
        const answerAt = answerPlan[planIdx % answerPlan.length];
        planIdx++;

        await new Promise(r => setTimeout(r, 1100));
        setDemoStatus("Routing\u2026");

        for (let i = 0; i < 4; i++) {
          setDemoRinging(i);
          await new Promise(r => setTimeout(r, 1500));

          if (i === answerAt) {
            setDemoRinging(null);
            setDemoConnected(i);
            setDemoStatus("Connected");
            setDemoContainerConnected(true);
            break;
          } else {
            setDemoRinging(null);
            setDemoMissed(prev => [...prev, i]);
            await new Promise(r => setTimeout(r, 360));
          }
        }
        await new Promise(r => setTimeout(r, 2600));
      }
    };

    runDemoLoop();
  }, []);

  // Circle builder handlers
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (contacts.length >= 6 || !addName.trim()) return;
    setContacts(prev => [...prev, {
      id: Math.max(...prev.map(c => c.id), 0) + 1,
      name: addName.trim(),
      rel: addRel.trim(),
      available: true
    }]);
    setAddName("");
    setAddRel("");
  };

  const handleRemoveContact = (id: number) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleAvail = (id: number) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, available: !c.available } : c));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setContacts(prev => {
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  };

  const handleMoveDown = (idx: number) => {
    if (idx === contacts.length - 1) return;
    setContacts(prev => {
      const copy = [...prev];
      [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
      return copy;
    });
  };

  // Run the circle builder interactive phone simulation call
  const handlePlaceCall = async () => {
    if (simCalling) return;
    if (!contacts.length) {
      setSimScreen({
        av: "!",
        name: "No contacts",
        state: "Add someone to your circle first",
        cls: "voicemail"
      });
      return;
    }

    setSimCalling(true);
    setSimRingingRow(null);
    setSimConnectedRow(null);
    setSimMissedRows([]);

    if (simMode === "menu") {
      // Menu Mode Simulation
      setSimScreen({ av: "\u260e", name: "Welcome", state: "Listen for the menu\u2026" });
      setSimDots([]);
      await new Promise(r => setTimeout(r, 1100));
      
      // Render menu options on phone screen
      setSimScreen({ av: "\u2630", name: "Select an option", state: "", cls: "menu-mode" });
    } else {
      // Cascade Mode Simulation
      setSimDots(Array(contacts.length).fill("standingby"));
      setSimScreen({ av: "\u2022", name: "Connecting\u2026", state: "Placing your call" });
      await new Promise(r => setTimeout(r, 900));

      let connectedIdx = -1;
      for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        setSimDots(prev => {
          const copy = [...prev];
          copy[i] = "active";
          return copy;
        });
        setSimRingingRow(c.id);
        setSimScreen({
          av: getInitials(c.name),
          avColor: getColor(i),
          name: c.name,
          state: `Ringing ${c.rel || "contact"}\u2026`,
          cls: "ringing-state"
        });
        await new Promise(r => setTimeout(r, 1500));

        if (c.available) {
          setSimRingingRow(null);
          setSimConnectedRow(c.id);
          setSimScreen({
            av: getInitials(c.name),
            avColor: getColor(i),
            name: c.name,
            state: "\u2713 Connected \u2014 say hello!",
            cls: "connected"
          });
          connectedIdx = i;
          break;
        } else {
          setSimRingingRow(null);
          setSimMissedRows(prev => [...prev, c.id]);
          setSimDots(prev => {
            const copy = [...prev];
            copy[i] = "done";
            return copy;
          });
          setSimScreen({
            av: getInitials(c.name),
            avColor: getColor(i),
            name: c.name,
            state: "No answer \u2014 trying next\u2026",
            cls: "ringing-state"
          });
          await new Promise(r => setTimeout(r, 550));
        }
      }

      if (connectedIdx === -1) {
        setSimScreen({
          av: "\u2709",
          name: "Voicemail",
          state: "Message sent \u2014 whole circle alerted",
          cls: "voicemail"
        });
      }
      await new Promise(r => setTimeout(r, 2600));
      resetSimScreen();
      setSimCalling(false);
      setSimRingingRow(null);
      setSimConnectedRow(null);
      setSimMissedRows([]);
    }
  };

  // Menu option selection
  const handleSelectMenuOption = async (idx: number) => {
    const c = contacts[idx];
    setSimRingingRow(c.id);
    setSimScreen({
      av: getInitials(c.name),
      avColor: getColor(idx),
      name: c.name,
      state: `Connecting you to ${c.rel || c.name}\u2026`,
      cls: "ringing-state"
    });
    await new Promise(r => setTimeout(r, 1600));

    if (c.available) {
      setSimRingingRow(null);
      setSimConnectedRow(c.id);
      setSimScreen({
        av: getInitials(c.name),
        avColor: getColor(idx),
        name: c.name,
        state: "\u2713 Connected \u2014 say hello!",
        cls: "connected"
      });
    } else {
      setSimRingingRow(null);
      setSimMissedRows([c.id]);
      setSimScreen({
        av: "\u2709",
        name: `${c.name} is busy`,
        state: "Voicemail sent \u2014 they’ve been alerted",
        cls: "voicemail"
      });
    }
    await new Promise(r => setTimeout(r, 2400));
    resetSimScreen();
    setSimCalling(false);
    setSimRingingRow(null);
    setSimConnectedRow(null);
    setSimMissedRows([]);
  };

  const resetSimScreen = () => {
    setSimScreen({
      av: simMode === "menu" ? "\u2630" : "—",
      name: simMode === "menu" ? "Caller menu" : "Ready",
      state: simMode === "menu" ? "{t.demo.startSim} to hear the options" : "Press call to start routing"
    });
    setSimDots([]);
  };

  useEffect(() => {
    resetSimScreen();
  }, [simMode]); // eslint-disable-line

  return (
    <div className="min-h-screen selection:bg-teal-500 selection:text-white overflow-x-hidden">
      
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
            <a href="#how">{t.nav.how}</a>
            <a href="#features">{t.nav.features}</a>
            <a href="#usecases">{t.nav.who}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="#faq">{t.nav.faq}</a>
          </nav>
          <div className="header-cta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a className="btn btn-text" href="/login" style={{ marginRight: 6 }}>{t.nav.login}</a>
            <a className="btn btn-ghost" href="#how">{t.nav.howWorksBtn}</a>
            <a className="btn btn-primary" href="#pricing">{t.nav.selectPlanBtn}</a>
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as any)}
              className="lang-select"
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--ink-soft)',
                padding: '6px 10px',
                borderRadius: '20px',
                fontSize: '0.86rem',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font)',
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
              <option value="pt">🇵🇹 PT</option>
              <option value="de">🇩🇪 DE</option>
              <option value="it">🇮🇹 IT</option>
              <option value="ko">🇰🇷 KO</option>
            </select>
          </div>
        </div>
      </header>

      <main id="top">

        {/* ============== HERO ============== */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">{t.hero.eyebrow}</span>
              <h1><span className="block mb-2">{t.hero.titleAccent}.</span><span className="accent">{t.hero.titleRest}</span></h1>
              <p className="lead">{t.hero.lead}</p>
              <div className="hero-actions">
                <div className="hero-cta-wrapper">
                  <a className="btn btn-primary btn-lg" href="#pricing">{t.hero.getStarted}</a>
                  <span className="hero-trust-line">{t.hero.trustLine}</span>
                </div>
                <a className="btn btn-ghost btn-lg" href="#how">{t.hero.seeHow}</a>
              </div>
              <div className="hero-note"><span className="dot"></span> {t.ui.noHardware}</div>
            </div>

            {/* Animated Routing Auto Demo */}
            <div className={`demo ${demoContainerConnected ? "is-connected" : ""}`} id="demo" aria-label="Live call-routing demonstration">
              <div className="demo-head">
                <div className="demo-number">
                  <span className="ring">
                    <Ico.phone className="w-[21px] h-[21px] text-white" />
                  </span>
                  <span className="num">(415) 200-CARE<small>{t.ui.momNumber}</small></span>
                </div>
                <span className="demo-status">
                  <span className="live" />
                  <span className="txt">{demoStatus === "Incoming call" ? t.demo.incomingCall : demoStatus === "Connected" ? t.demo.connected : demoStatus === "Voicemail" ? t.demo.voicemail : t.demo.activeCall}</span>
                </span>
              </div>
              <p className="demo-caption">{t.ui.routingExplanation}</p>
              <div className="chain">
                {[
                  { initials: "SR", name: "Sarah R.", rel: "Daughter", color: "oklch(0.58 0.115 232)" },
                  { initials: "DM", name: "David M.", rel: "Son", color: "oklch(0.62 0.10 198)" },
                  { initials: "LN", name: "Lena N.", rel: "Neighbor", color: "oklch(0.55 0.11 280)" },
                  { initials: "DP", name: "Dr. Patel", rel: "Care team", color: "oklch(0.6 0.12 30)" }
                ].map((c, i) => {
                  const isRinging = demoRinging === i;
                  const isConnected = demoConnected === i;
                  const isMissed = demoMissed.includes(i);
                  return (
                    <div key={i} className={`contact ${isRinging ? "is-ringing" : ""} ${isConnected ? "is-connected" : ""} ${isMissed ? "is-missed" : ""}`}>
                      <span className="order">{i + 1}</span>
                      <span className="avatar" style={{ background: c.color }}>{c.initials}</span>
                      <span className="who"><b>{c.name}</b><span>{c.rel}</span></span>
                      <span className="state">
                        {isRinging ? (t.demo.simScreenRinging) : isConnected ? (t.demo.simScreenConnected + " ✓") : isMissed ? (t.ui.noAnswer) : (t.ui.standingBy)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ============== TRUST STRIP ============== */}
        <section className="trust">
          <div className="wrap trust-inner">
            <span className="trust-label">{t.ui.builtForMoments}</span>
            <div className="trust-stats">
              <div className="stat"><b>1</b><span>{t.ui.numberToRemember}</span></div>
              <div className="stat"><b>6</b><span>{t.ui.contactsPerNumber}</span></div>
              <div className="stat"><b>&lt;3s</b><span>{t.ui.toStartRouting}</span></div>
              <div className="stat"><b>99.99%</b><span>{t.ui.uptimeAlwaysOn}</span></div>
            </div>
          </div>
        </section>

        {/* ============== HOW IT WORKS ============== */}
        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">How it works</span>
              <h2>{t.ui.setOnceTrustForever}</h2>
              <p className="lead">{t.steps.lead}</p>
            </div>
            <div className="steps">
              <div className="step reveal in">
                <div className="idx">1</div>
                <h3>{t.steps.step1Title}</h3>
                <p>{t.steps.step1Desc}</p>
                <svg className="step-arrow" width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 12h54m0 0-7-7m7 7-7 7"></path></svg>
              </div>
              <div className="step reveal in">
                <div className="idx">2</div>
                <h3>{t.steps.step2Title}</h3>
                <p>{t.steps.step2Desc}</p>
                <svg className="step-arrow" width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 12h54m0 0-7-7m7 7-7 7"></path></svg>
              </div>
              <div className="step reveal in">
                <div className="idx">3</div>
                <h3>{t.steps.step3Title}</h3>
                <p>{t.steps.step3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== INTERACTIVE CIRCLE BUILDER + SIMULATOR ============== */}
        <section className="section tint-band" id="try">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">{t.demo.eyebrow}</span>
              <h2>{t.demo.title}</h2>
              <p className="lead">{t.demo.lead}</p>
            </div>

            <div className="mode-toggle reveal in">
              <span className="mode-label">{t.demo.routingMode}</span>
              <div className="seg" role="tablist" aria-label="Routing mode">
                <button className={`seg-btn ${simMode === "cascade" ? "active" : ""}`} type="button" onClick={() => !simCalling && setSimMode("cascade")}>{t.demo.btnCascade}</button>
                <button className={`seg-btn ${simMode === "menu" ? "active" : ""}`} type="button" onClick={() => !simCalling && setSimMode("menu")}>{t.demo.btnMenu}</button>
              </div>
              <span className="mode-note">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><rect x="4" y="10" width="16" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
                {t.ui.setByOwner}
              </span>
            </div>

            <div className="builder reveal in">
              {/* Circle Editor panel */}
              <div className="builder-panel">
                <div className="builder-head">
                  <h3>{t.ui.yourCircle}</h3>
                  <span className="count">{contacts.length}/6 {t.ui.contacts}</span>
                </div>
                
                <div className="circle-list">
                  {!contacts.length ? (
                    <div className="circle-empty">{t.demo.addContact}</div>
                  ) : (
                    contacts.map((c, i) => {
                      const isRinging = simRingingRow === c.id;
                      const isConnected = simConnectedRow === c.id;
                      const isMissed = simMissedRows.includes(c.id);

                      return (
                        <div key={c.id} className={`circle-row ${isRinging ? "is-ringing" : ""} ${isConnected ? "is-connected" : ""} ${isMissed ? "is-missed" : ""}`}>
                          <span className="avatar" style={{ background: getColor(i) }}>{getInitials(c.name)}</span>
                          <span className="who"><b>{c.name}</b><span>{c.rel}</span></span>
                          
                          <button
                            type="button"
                            disabled={simCalling}
                            className={`avail ${c.available ? "on" : ""}`}
                            onClick={() => handleToggleAvail(c.id)}
                            aria-pressed={c.available}
                          >
                            <span className="track" />
                            <span className="lbl">{c.available ? t.demo.available : t.demo.offline}</span>
                          </button>

                          <span className="row-tools">
                            <button className="icon-btn" disabled={simCalling || i === 0} onClick={() => handleMoveUp(i)} title="Move up">
                              <Ico.chevronUp className="w-[15px] h-[15px]" />
                            </button>
                            <button className="icon-btn" disabled={simCalling || i === contacts.length - 1} onClick={() => handleMoveDown(i)} title="Move down">
                              <Ico.chevronDown className="w-[15px] h-[15px]" />
                            </button>
                            <button className="icon-btn danger" disabled={simCalling} onClick={() => handleRemoveContact(c.id)} title="Remove">
                              <Ico.trash className="w-[15px] h-[15px]" />
                            </button>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleAddContact} className="add-form" autoComplete="off">
                  <input className="input" placeholder={t.ui.name} maxLength={22} value={addName} onChange={(e) => setAddName(e.target.value)} required />
                  <input className="input" placeholder={t.ui.relationship} maxLength={22} value={addRel} onChange={(e) => setAddRel(e.target.value)} />
                  <button className="btn btn-primary add-btn" type="submit" disabled={contacts.length >= 6} title="Add contact">
                    <Ico.plus className="w-[18px] h-[18px] text-white" />
                  </button>
                </form>
              </div>

              {/* Simulator phone screen panel */}
              <div className="sim-panel">
                <div className={`sim-screen ${simScreen.cls || ""}`}>
                  <span className="num-line">(415) 200-CARE</span>
                  
                  {simScreen.cls === "menu-mode" ? (
                    <div className="sim-menu">
                      <div className="menu-title">{t.ui.thanksChoose}</div>
                      {contacts.map((c, i) => (
                        <button key={c.id} type="button" className="sim-opt" onClick={() => handleSelectMenuOption(i)}>
                          <span className="digit">{i + 1}</span>
                          <span className="opt-who"><b>{t.ui.press} {i + 1} &mdash; {c.name}</b><small>{c.rel}</small></span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className={`sim-avatar ${simScreen.cls === "ringing-state" ? "ringing" : ""}`} style={{ background: simScreen.avColor || "oklch(1 0 0 / 0.16)" }}>
                        {simScreen.av}
                      </div>
                      <div className="sim-name">{simScreen.name}</div>
                      <div className="sim-state">{simScreen.state}</div>
                      <div className="sim-dots">
                        {simDots.map((dot, i) => (
                          <i key={i} className={dot === "active" ? "active" : dot === "done" ? "done" : ""} />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button className="btn btn-primary" onClick={handlePlaceCall} disabled={simCalling}>
                  <Ico.phone className="w-[18px] h-[18px] text-white mr-1.5" />
                  {t.demo.startSim}
                </button>
                
                <p className="sim-hint">
                  {simMode === "menu"
                    ? t.ui.simExplanationMenuExtra
                    : t.ui.simExplanationCascadeExtra}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== FEATURES GRID ============== */}
        <section className="section tint-band" id="features">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">{t.ui.whyFamiliesChoose}</span>
              <h2>{t.ui.thoughtfulByDesign}<br />{t.ui.dependableByDefault}</h2>
            </div>
            <div className="features">
              <div className="feature reveal in">
                <div className="ic"><Ico.shield className="w-[23px] h-[23px]" /></div>
                <h3>{t.features.f1Title}</h3>
                <p>{t.features.f1Desc}</p>
              </div>
              <div className="feature reveal in">
                <div className="ic"><Ico.phone className="w-[23px] h-[23px]" /></div>
                <h3>{t.features.f2Title}</h3>
                <p>{t.features.f2Desc}</p>
              </div>
              <div className="feature reveal in">
                <div className="ic"><Ico.user className="w-[23px] h-[23px]" /></div>
                <h3>{t.features.f3Title}</h3>
                <p>{t.features.f3Desc}</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <h3>{t.features.f4Title}</h3>
                <p>{t.features.f4Desc}</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <path d="M4 5h16v11H7l-3 3V5Z" />
                    <path d="M8 9h8M8 12h5" />
                  </svg>
                </div>
                <h3>{t.features.f5Title}</h3>
                <p>{t.features.f5Desc}</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <h3>{t.features.f6Title}</h3>
                <p>{t.features.f6Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== USE CASES ============== */}
        <section className="section" id="usecases">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">Who it's for</span>
              <h2>{t.usecases.title}</h2>
              <p className="lead">{t.usecases.lead}</p>
            </div>
            <div className="usecases">
              <article className="usecase reveal in">
                <div className="ph"><span>photo · aging parent</span></div>
                <div className="body">
                  <h3>{t.usecases.u1Title}</h3>
                  <p>{t.usecases.u1Desc}</p>
                </div>
              </article>
              <article className="usecase reveal in">
                <div className="ph"><span>photo · child calling home</span></div>
                <div className="body">
                  <h3>{t.usecases.u2Title}</h3>
                  <p>{t.usecases.u2Desc}</p>
                </div>
              </article>
              <article className="usecase reveal in">
                <div className="ph"><span>photo · special-abilities care</span></div>
                <div className="body">
                  <h3>{t.usecases.u3Title}</h3>
                  <p>{t.usecases.u3Desc}</p>
                </div>
              </article>
            </div>
          </div>
        </section>
               <section className="section tint-band" id="pricing">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">{t.pricing.title}</span>
              <h2>{t.pricing.lead}</h2>
              <p className="lead">{t.ui.bothPlansInclude}</p>
            </div>
 
            <div className="bill-toggle center-toggle reveal in">
              <button className={billingCycle === "monthly" ? "active" : ""} onClick={() => setBillingCycle("monthly")}>{t.pricing.monthly}</button>
              <button className={billingCycle === "annual" ? "active" : ""} onClick={() => setBillingCycle("annual")}>{t.pricing.annual} <em>{t.ui.save17}</em></button>
            </div>
 
            <div className="pricing">
              {/* Essential Card */}
              <div className="plan reveal in">
                <h3>{t.pricing.essentialTitle}</h3>
                <p className="desc">{t.pricing.essentialDesc}</p>
                <div className="price">
                  <b className="amt">{billingCycle === "annual" ? "$149" : "$14.99"}</b>
                  <span className="per">{billingCycle === "annual" ? t.ui.perYear : t.ui.perMonth}</span>
                </div>
                <p className="price-yr">{billingCycle === "annual" ? t.ui.justPriceAnnualEssential : t.ui.billedMonthlyCancelAnytime}</p>
                <ul>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat1}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat2}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat3}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 30 {t.ui.voiceMinutes}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat4}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat5}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.ui.worksOnAnyPhoneNoApp}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.shortGuarantee}</li>
                </ul>
                <Link className="btn btn-ghost" href={`/onboarding?plan=essential&billing=${billingCycle}&lang=${lang}`}>{t.pricing.selectPlan}</Link>
              </div>
 
              {/* Pro Card */}
              <div className="plan featured reveal in">
                <span className="tag">{t.pricing.mostPopular}</span>
                <h3>{t.pricing.proTitle}</h3>
                <p className="desc">{t.pricing.proDesc}</p>
                <div className="price">
                  <b className="amt">{billingCycle === "annual" ? "$249" : "$24.99"}</b>
                  <span className="per">{billingCycle === "annual" ? t.ui.perYear : t.ui.perMonth}</span>
                </div>
                <p className="price-yr">{billingCycle === "annual" ? t.ui.justPriceAnnualPro : t.ui.billedMonthlyCancelAnytime}</p>
                <ul>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.pFeat1}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.pFeat2}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat3}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 60 {t.ui.minutesIncluded}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.pFeat3}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.eFeat5}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.pFeat4}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.pFeat5}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.ui.worksOnAnyPhoneNoApp}</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> {t.pricing.shortGuarantee}</li>
                </ul>
                <Link className="btn btn-primary" href={`/onboarding?plan=pro&billing=${billingCycle}&lang=${lang}`}>{t.pricing.selectPlan}</Link>
              </div>
            </div>

            <div className="pricing-guarantee reveal in">
              <div className="pricing-guarantee-icon">
                <Ico.shield className="w-[22px] h-[22px]" />
              </div>
              <h4>{t.pricing.guaranteeTitle}</h4>
              <p>{t.pricing.guaranteeDesc}</p>
            </div>

            <div 
              style={{ 
                textAlign: "center", 
                marginTop: "40px", 
                fontSize: "0.95rem", 
                color: "oklch(0.50 0.02 240)",
              }} 
              className="reveal in"
            >
              Organizations & Teams —{" "}
              <a 
                href="mailto:support@icancall.co" 
                style={{ 
                  color: "oklch(0.45 0.13 242)", 
                  fontWeight: 600, 
                  textDecoration: "underline",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                contact us
              </a>
            </div>
          </div>
        </section>

 
        {/* ============== FAQ SECTION ============== */}
        <section className="section tint-band" id="faq">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">{t.faq.title}</span>
              <h2>{t.ui.everythingYouMightAsk}</h2>
            </div>
 
            <div className="faq reveal in">
              {[
                {
                  q: t.faq.q1,
                  a: t.faq.a1
                },
                {
                  q: t.faq.q2,
                  a: t.faq.a2
                },
                {
                  q: t.faq.q3,
                  a: t.faq.a3
                },
                {
                  q: t.faq.q4,
                  a: t.faq.a4
                },
                {
                  q: t.faq.q5,
                  a: t.faq.a5
                },
                {
                  q: t.faq.q6,
                  a: t.faq.a6
                },
                {
                  q: "Is my family's information private?",
                  a: "Always. Personal numbers stay hidden behind your single iCanCall line, all routing is encrypted, and we never sell your data."
                },
                {
                  q: "How quickly can I get set up?",
                  a: "Most families are protected in under five minutes: claim a number, add your contacts, and you're live. No technician visit and no equipment required."
                }
              ].map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={`faq-item ${isOpen ? "open" : ""}`}>
                    <button className="faq-q" onClick={() => toggleFaq(i)}>
                      <span>{faq.q}</span>
                      <span className="pm">{isOpen ? "✕" : "＋"}</span>
                    </button>
                    <div className="faq-a" style={{ maxHeight: isOpen ? "350px" : "0" }}>
                      <p>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============== FINAL CTA CARD ============== */}
        <section className="section cta-band" id="cta">
          <div className="wrap">
            <div className="cta-card reveal in">
              <h2>{t.cta.title}</h2>
              <p>{t.cta.desc}</p>
              <div className="actions">
                <a className="btn btn-primary btn-lg" href="#pricing">{t.cta.btn}</a>
                <a className="btn btn-ghost btn-lg" href="#how" style={{ color: "#fff", borderColor: "oklch(1 0 0 / 0.5)" }}>See how it works</a>
              </div>
              <p className="fine">{t.cta.fine}</p>
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
              </a>
              <p className="blurb">{t.footer.blurb}</p>
            </div>
            <div>
              <h5>{t.footer.product}</h5>
              <ul>
                <li><a href="#how">{t.nav.how}</a></li>
                <li><a href="#features">{t.nav.features}</a></li>
                <li><a href="#pricing">{t.nav.pricing}</a></li>
                <li><a href="#faq">{t.nav.faq}</a></li>
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
                <li><a href="#">{t.footer.about}</a></li>
                <li><a href="#">{t.footer.careers}</a></li>

                <li><a href="#">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h5>{t.footer.trust}</h5>
              <ul>
                <li><a href="/privacy-policy">{t.footer.privacy}</a></li>
                <li><a href="#">{t.footer.security}</a></li>
                <li><a href="/terms-of-service">{t.footer.terms}</a></li>
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

function initials(name: string) {
  return (name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}
