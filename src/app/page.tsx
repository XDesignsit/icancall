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
          <a className="brand" href="#top" aria-label="iCanCall home">
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
                <a className="btn btn-primary btn-lg" href="#pricing">{t.hero.getStarted}</a>
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
                </ul>
                <Link className="btn btn-ghost" href={`/onboarding?plan=essential&billing=${billingCycle}`}>{t.pricing.selectPlan}</Link>
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
                </ul>
                <Link className="btn btn-primary" href={`/onboarding?plan=pro&billing=${billingCycle}`}>{t.pricing.selectPlan}</Link>
              </div>
            </div>
          </div>
        </section>
 
        {/* ============== TESTIMONIALS SECTION ============== */}
        <section className="section" id="stories">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">{t.testimonials.stars}</span>
              <h2>{t.ui.callsThatConnected}</h2>
            </div>
            <div className="quotes">
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>{t.testimonials.t1Quote}</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.58 0.115 232)" }}>JM</span>
                  <span><b>Jenna M.</b><span>{t.ui.daughterCaregiver}</span></span>
                </figcaption>
              </figure>
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>{t.testimonials.t2Quote}</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.62 0.10 198)" }}>AT</span>
                  <span><b>Andre T.</b><span>{t.ui.dadOfTwo}</span></span>
                </figcaption>
              </figure>
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>{t.testimonials.t3Quote}</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.55 0.11 280)" }}>PR</span>
                  <span><b>Priya R.</b><span>{t.ui.specialAbilitiesParent}</span></span>
                </figcaption>
              </figure>
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
                <li><a href="#stories">{t.footer.stories}</a></li>
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

function initials(name: string) {
  return (name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}
