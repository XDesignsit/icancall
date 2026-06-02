"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
      state: simMode === "menu" ? "Place a call to hear the options" : "Press call to start routing"
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
            <span className="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
              </svg>
            </span>
            <span>i<b>Can</b>Call</span>
          </a>
          <nav className="nav">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#usecases">Who it's for</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="header-cta">
            <a className="btn btn-text" href="/login" style={{ marginRight: 6 }}>Login</a>
            <a className="btn btn-ghost" href="#how">See how it works</a>
            <a className="btn btn-primary" href="#pricing">Select a Plan</a>
          </div>
        </div>
      </header>

      <main id="top">

        {/* ============== HERO ============== */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Safety on autopilot</span>
              <h1><span className="block mb-2">One number.</span><span className="accent">Always answered.</span></h1>
              <p className="lead">When it matters most, the people you love should never reach a dead end. iCanCall routes a single, memorable number to up to six trusted contacts — until someone picks up.</p>
              <div className="hero-actions">
                <a className="btn btn-primary btn-lg" href="#pricing">Select a Plan</a>
                <a className="btn btn-ghost btn-lg" href="#how">How it works</a>
              </div>
              <div className="hero-note"><span className="dot"></span> No new hardware · Works with any phone · Set up in minutes</div>
            </div>

            {/* Animated Routing Auto Demo */}
            <div className={`demo ${demoContainerConnected ? "is-connected" : ""}`} id="demo" aria-label="Live call-routing demonstration">
              <div className="demo-head">
                <div className="demo-number">
                  <span className="ring">
                    <Ico.phone className="w-[21px] h-[21px] text-white" />
                  </span>
                  <span className="num">(415) 200-CARE<small>Mom's iCanCall number</small></span>
                </div>
                <span className="demo-status">
                  <span className="live" />
                  <span className="txt">{demoStatus}</span>
                </span>
              </div>
              <p className="demo-caption">Routing through trusted contacts, in order, until answered</p>
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
                        {isRinging ? "Ringing\u2026" : isConnected ? "Connected \u2713" : isMissed ? "No answer" : "Standing by"}
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
            <span className="trust-label">Built for the moments that matter</span>
            <div className="trust-stats">
              <div className="stat"><b>1</b><span>number to remember</span></div>
              <div className="stat"><b>6</b><span>contacts per number</span></div>
              <div className="stat"><b>&lt;3s</b><span>to start routing</span></div>
              <div className="stat"><b>99.99%</b><span>uptime, always on</span></div>
            </div>
          </div>
        </section>

        {/* ============== HOW IT WORKS ============== */}
        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">How it works</span>
              <h2>Set it once. Trust it forever.</h2>
              <p className="lead">Three simple steps stand between you and complete peace of mind.</p>
            </div>
            <div className="steps">
              <div className="step reveal in">
                <div className="idx">1</div>
                <h3>Claim your number</h3>
                <p>Pick a single, easy-to-remember iCanCall number. Share it once — on a bracelet, a fridge, a school form — and never juggle a list of numbers again.</p>
                <svg className="step-arrow" width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 12h54m0 0-7-7m7 7-7 7"></path></svg>
              </div>
              <div className="step reveal in">
                <div className="idx">2</div>
                <h3>Add your circle</h3>
                <p>Designate up to six trusted contacts and set the order they should be reached. Family, neighbors, caregivers, doctors — your circle, your priority.</p>
                <svg className="step-arrow" width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 12h54m0 0-7-7m7 7-7 7"></path></svg>
              </div>
              <div className="step reveal in">
                <div className="idx">3</div>
                <h3>Choose how to connect</h3>
                <p>Pick your routing in the dashboard: let iCanCall <b>cascade</b> through the circle until someone answers, or greet callers with a simple <b>menu</b> to reach the right person directly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== INTERACTIVE CIRCLE BUILDER + SIMULATOR ============== */}
        <section className="section tint-band" id="try">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">Interactive demo</span>
              <h2>Build your circle. Place a call.</h2>
              <p className="lead">Add the people you trust, then choose how callers reach them: let iCanCall <b>cascade</b> through the circle until someone answers, or hand callers a <b>menu</b> to pick exactly who to dial. Try both below.</p>
            </div>

            <div className="mode-toggle reveal in">
              <span className="mode-label">Routing mode</span>
              <div className="seg" role="tablist" aria-label="Routing mode">
                <button className={`seg-btn ${simMode === "cascade" ? "active" : ""}`} type="button" onClick={() => !simCalling && setSimMode("cascade")}>Call cascade</button>
                <button className={`seg-btn ${simMode === "menu" ? "active" : ""}`} type="button" onClick={() => !simCalling && setSimMode("menu")}>Caller menu</button>
              </div>
              <span className="mode-note">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><rect x="4" y="10" width="16" height="10" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path></svg>
                Set by the account owner in the dashboard
              </span>
            </div>

            <div className="builder reveal in">
              {/* Circle Editor panel */}
              <div className="builder-panel">
                <div className="builder-head">
                  <h3>Your circle</h3>
                  <span className="count">{contacts.length}/6 contacts</span>
                </div>
                
                <div className="circle-list">
                  {!contacts.length ? (
                    <div className="circle-empty">Add up to six trusted contacts to build your circle.</div>
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
                            <span className="lbl">{c.available ? "Available" : "Busy"}</span>
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
                  <input className="input" placeholder="Name" maxLength={22} value={addName} onChange={(e) => setAddName(e.target.value)} required />
                  <input className="input" placeholder="Relationship" maxLength={22} value={addRel} onChange={(e) => setAddRel(e.target.value)} />
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
                      <div className="menu-title">Thanks for calling. Choose who to reach:</div>
                      {contacts.map((c, i) => (
                        <button key={c.id} type="button" className="sim-opt" onClick={() => handleSelectMenuOption(i)}>
                          <span className="digit">{i + 1}</span>
                          <span className="opt-who"><b>Press {i + 1} &mdash; {c.name}</b><small>{c.rel}</small></span>
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
                  Place a call
                </button>
                
                <p className="sim-hint">
                  {simMode === "menu"
                    ? "Callers pick who to reach. Flip a contact to “Busy” to send them to voicemail."
                    : "Toggle contacts to “Busy” to see the cascade skip ahead."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== FEATURES GRID ============== */}
        <section className="section tint-band" id="features">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">Why families choose iCanCall</span>
              <h2>Thoughtful by design.<br />Dependable by default.</h2>
            </div>
            <div className="features">
              <div className="feature reveal in">
                <div className="ic"><Ico.shield className="w-[23px] h-[23px]" /></div>
                <h3>Two ways to connect</h3>
                <p>Cascade through your circle until someone answers, or hand callers a menu to pick exactly who to reach. Switchable anytime in the dashboard.</p>
              </div>
              <div className="feature reveal in">
                <div className="ic"><Ico.phone className="w-[23px] h-[23px]" /></div>
                <h3>One number, any phone</h3>
                <p>No app required for callers. Works from any landline or mobile, anywhere — exactly as a phone number should.</p>
              </div>
              <div className="feature reveal in">
                <div className="ic"><Ico.user className="w-[23px] h-[23px]" /></div>
                <h3>Up to six contacts</h3>
                <p>Build a circle of family, neighbors, caregivers and doctors. Reorder anyone, anytime, in seconds.</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <h3>Time-aware rules</h3>
                <p>Route differently by time of day. Reach the night caregiver after hours, the family doctor during the week — automatically.</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <path d="M4 5h16v11H7l-3 3V5Z" />
                    <path d="M8 9h8M8 12h5" />
                  </svg>
                </div>
                <h3>Instant alerts</h3>
                <p>Every contact gets a text the moment a call comes through — so your whole circle knows the second something happens.</p>
              </div>
              <div className="feature reveal in">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[23px] h-[23px]">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <h3>Private &amp; protected</h3>
                <p>Personal numbers stay hidden behind your single iCanCall line. Encrypted end to end, and never sold.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============== USE CASES ============== */}
        <section className="section" id="usecases">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">Who it's for</span>
              <h2>Peace of mind for every family.</h2>
              <p className="lead">Whoever you're protecting, iCanCall makes sure they're only ever one call from help.</p>
            </div>
            <div className="usecases">
              <article className="usecase reveal in">
                <div className="ph"><span>photo · aging parent</span></div>
                <div className="body">
                  <h3>Aging parents</h3>
                  <p>One number on the fridge connects Mom or Dad to the whole family — and their care team — without memorizing a single contact.</p>
                </div>
              </article>
              <article className="usecase reveal in">
                <div className="ph"><span>photo · child calling home</span></div>
                <div className="body">
                  <h3>Young children</h3>
                  <p>Kids learn one number. Whether they reach you, a grandparent, or a trusted neighbor, someone they know always answers.</p>
                </div>
              </article>
              <article className="usecase reveal in">
                <div className="ph"><span>photo · special-abilities care</span></div>
                <div className="body">
                  <h3>Special abilities &amp; caregivers</h3>
                  <p>For loved ones who can't navigate a contact list, a single number routes straight to the right caregiver, every time.</p>
                </div>
              </article>
            </div>
          </div>
        </section>
        {/* ============== PRICING TABLE ============== */}
        <section className="section tint-band" id="pricing">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">Simple, honest pricing</span>
              <h2>Safety shouldn't be complicated.</h2>
              <p className="lead">Both plans include cascade routing, the caller menu, and 24/7 reliability. Cancel anytime.</p>
            </div>
 
            <div className="bill-toggle center-toggle reveal in">
              <button className={billingCycle === "monthly" ? "active" : ""} onClick={() => setBillingCycle("monthly")}>Monthly</button>
              <button className={billingCycle === "annual" ? "active" : ""} onClick={() => setBillingCycle("annual")}>Annual <em>Save 17%</em></button>
            </div>
 
            <div className="pricing">
              {/* Essential Card */}
              <div className="plan reveal in">
                <h3>Essential</h3>
                <p className="desc">One number for one loved one.</p>
                <div className="price">
                  <b className="amt">{billingCycle === "annual" ? "$129" : "$12.99"}</b>
                  <span className="per">{billingCycle === "annual" ? "/ year" : "/ month"}</span>
                </div>
                <p className="price-yr">{billingCycle === "annual" ? "Just $10.75/mo, billed annually" : "Billed monthly · cancel anytime"}</p>
                <ul>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 1 number included</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 3 routable trusted contacts</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Cascade routing + Caller Menu</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 30 voice minutes</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Email notifications</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Bilingual greeting options</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Works on any phone — no app needed</li>
                </ul>
                <Link className="btn btn-ghost" href={`/onboarding?plan=essential&billing=${billingCycle}`}>Select Essential</Link>
              </div>
 
              {/* Pro Card */}
              <div className="plan featured reveal in">
                <span className="tag">Most popular</span>
                <h3>Pro</h3>
                <p className="desc">Full protection for the whole circle.</p>
                <div className="price">
                  <b className="amt">{billingCycle === "annual" ? "$199" : "$19.99"}</b>
                  <span className="per">{billingCycle === "annual" ? "/ year" : "/ month"}</span>
                </div>
                <p className="price-yr">{billingCycle === "annual" ? "Just $16.58/mo, billed annually" : "Billed monthly · cancel anytime"}</p>
                <ul>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 2 dedicated phone numbers</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 6 routable trusted contacts</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Cascade routing + Caller Menu</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> 60 minutes included</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Real-time call alerts</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Bilingual greeting options</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Admin dashboard</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> SMS &amp; email notifications</li>
                  <li><Ico.check className="w-[19px] h-[19px]" /> Works on any phone — no app needed</li>
                </ul>
                <Link className="btn btn-primary" href={`/onboarding?plan=pro&billing=${billingCycle}`}>Select Pro</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============== TESTIMONIALS SECTION ============== */}
        <section className="section" id="stories">
          <div className="wrap">
            <div className="section-head reveal in">
              <span className="eyebrow">Stories from families</span>
              <h2>The calls that got through.</h2>
            </div>
            <div className="quotes">
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>"My father fell last winter and dialed his iCanCall number. It reached me, then my sister, then his neighbor — who was three doors down. He had help in minutes."</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.58 0.115 232)" }}>JM</span>
                  <span><b>Jenna M.</b><span>Daughter &amp; caregiver</span></span>
                </figcaption>
              </figure>
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>"My seven-year-old only has to remember one number. Whether it finds me at work or her grandma at home, she always reaches someone who loves her."</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.62 0.10 198)" }}>AT</span>
                  <span><b>Andre T.</b><span>Dad of two</span></span>
                </figcaption>
              </figure>
              <figure className="quote reveal in">
                <div className="stars">★★★★★</div>
                <p>"For our son, a contact list was impossible. Now one button, one number, and the right caregiver answers — every single time. It changed everything for us."</p>
                <figcaption className="by">
                  <span className="avatar" style={{ background: "oklch(0.55 0.11 280)" }}>PR</span>
                  <span><b>Priya R.</b><span>Special-abilities parent</span></span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ============== FAQ SECTION ============== */}
        <section className="section tint-band" id="faq">
          <div className="wrap">
            <div className="section-head center reveal in">
              <span className="eyebrow">Questions, answered</span>
              <h2>Everything you might ask.</h2>
            </div>
 
            <div className="faq reveal in">
              {[
                {
                  q: "Do my contacts need to install an app?",
                  a: "No. iCanCall works with any phone — landline or mobile. Callers simply dial your one number, and your contacts answer on whatever phone they already use. No apps, no new hardware."
                },
                {
                  q: "What happens if nobody answers?",
                  a: "iCanCall rings each contact in your chosen order until someone picks up. If the full circle is unreachable, the caller can leave a voicemail that's instantly transcribed and texted to every contact, so no message is ever lost."
                },
                {
                  q: "Cascade or caller menu — what's the difference?",
                  a: "You choose how callers connect, right from your dashboard. Call cascade rings your contacts one after another until someone answers — ideal for emergencies, when reaching anyone is what matters. Caller menu greets callers and lets them choose who to reach (\"press 1 for Mom, press 2 for the nurse\") — ideal when the right person depends on the situation. Switch modes anytime."
                },
                {
                  q: "Can I change the contacts or their order?",
                  a: "Anytime, in seconds. Add, remove, or reorder up to six contacts from your dashboard. Changes take effect on the very next call."
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
              <h2>The people you love are one number away.</h2>
              <p>Give your family the certainty of always getting through. Set up iCanCall today and put safety on autopilot.</p>
              <div className="actions">
                <a className="btn btn-primary btn-lg" href="#pricing">Select a Plan</a>
                <a className="btn btn-ghost btn-lg" href="#how" style={{ color: "#fff", borderColor: "oklch(1 0 0 / 0.5)" }}>See how it works</a>
              </div>
              <p className="fine">Set up in minutes · No setup fees · Cancel anytime</p>
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
                <span className="mark">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
                  </svg>
                </span>
                <span>i<b>Can</b>Call</span>
              </a>
              <p className="blurb">One memorable number that always connects to the people who matter most. Safety on autopilot.</p>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li><a href="#how">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="/login">Login</a></li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#stories">Stories</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5>Trust</h5>
              <ul>
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; {new Date().getFullYear()} iCanCall, Inc. All rights reserved.</span>
            <span>Made for the moments that matter.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function initials(name: string) {
  return (name || "").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}
