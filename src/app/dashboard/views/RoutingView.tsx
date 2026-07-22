"use client";

import React, { useState, useEffect, useRef } from "react";

import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { type DashboardTranslations } from "@/lib/dashboardTranslations";
import { type PlanId } from "@/lib/planConfig";
import { getLocalizedLineLabel, getLocalizedPersonName, getLocalizedRelationship } from "../_data";
import { Icon } from "../_icons";
import { Badge, initials } from "../_primitives";
import { type Contact, type CoverageSlot, type Line } from "../_types";


/* Call Simulator */
function TestCall({ line, d, lang }: { line: Line; d: DashboardTranslations; lang: string }) {
  const [screen, setScreen] = useState({
    cls: "",
    av: "—",
    avColor: null as string | null,
    name: d.sim.ready,
    state: d.sim.runTest,
    ring: false,
  });
  const [dots, setDots] = useState(0);
  const [activeDots, setActiveDots] = useState<Record<number, string>>({});
  const [menu, setMenu] = useState<Contact[] | null>(null);
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);
  const resolveMenu = useRef<((idx: number | null) => void) | null>(null);

  const contacts = line.contacts;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  useEffect(() => {
    reset();
    // `lang` is included so the idle screen re-localizes when the language
    // selector changes (line.id/line.mode alone don't change on that event).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, line.mode, lang]);

  function reset() {
    cancelled.current = true;
    setMenu(null);
    setDots(0);
    setActiveDots({});
    setRunning(false);
    setScreen({
      cls: "",
      av: line.mode === "schedule" ? "🕒" : line.mode === "menu" ? "☰" : "—",
      avColor: null,
      name: line.mode === "schedule" ? d.overview.timeSchedule : line.mode === "menu" ? d.overview.callerMenu : line.mode === "simultaneous" ? d.routing.simultaneous : d.sim.ready,
      state:
        line.mode === "schedule"
          ? d.routing.scheduleDesc
          : line.mode === "menu"
          ? d.routing.menuDesc
          : line.mode === "simultaneous"
          ? d.routing.simultaneousDesc
          : d.sim.runTest,
      ring: false,
    });
  }

  async function ringConnect(c: Contact, _idx: number) {
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `${d.sim.ringing} ${c.rel ? getLocalizedRelationship(c.rel, lang) : ""}…`,
      ring: true,
    });
    await sleep(1500);
    if (cancelled.current) return false;
    if (c.available) {
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
      return true;
    }
    return false;
  }

  async function runCascade() {
    setDots(contacts.length);
    setActiveDots({});
    setScreen({ cls: "", av: "•", avColor: null, name: d.sim.connecting, state: d.sim.connecting, ring: false });
    await sleep(800);
    let done = false;
    for (let i = 0; i < contacts.length; i++) {
      if (cancelled.current) return;
      setActiveDots((d) => ({ ...d, [i]: "active" }));
      const c = contacts[i];
      const ok = await ringConnect(c, i);
      if (cancelled.current) return;
      if (ok) {
        done = true;
        break;
      }
      setActiveDots((d) => ({ ...d, [i]: "done" }));
      setScreen({
        cls: "ring-state",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.noAnswer,
        ring: false,
      });
      await sleep(500);
    }
    if (!done && !cancelled.current) {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.sim.voicemail,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function runSimultaneous() {
    setDots(contacts.length);
    // Ring every contact at once.
    setActiveDots(Object.fromEntries(contacts.map((_, i) => [i, "active"])));
    setScreen({
      cls: "ring-state",
      av: "•",
      avColor: null,
      name: d.routing.simultaneous,
      state: `${d.sim.ringing}…`,
      ring: true,
    });
    await sleep(1600);
    if (cancelled.current) return;
    // The first available contact answers.
    const firstAvailable = contacts.findIndex((c) => c.available);
    if (firstAvailable !== -1) {
      const c = contacts[firstAvailable];
      setActiveDots(
        Object.fromEntries(contacts.map((_, i) => [i, i === firstAvailable ? "active" : "done"]))
      );
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
    } else {
      setActiveDots(Object.fromEntries(contacts.map((_, i) => [i, "done"])));
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.sim.voicemail,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  function waitForPick() {
    return new Promise<number | null>((res) => {
      resolveMenu.current = res;
    });
  }

  async function runMenu() {
    setDots(0);
    setActiveDots({});
    setScreen({ cls: "", av: "☎", avColor: null, name: "Welcome", state: "Listen for the menu…", ring: false });
    await sleep(900);
    if (cancelled.current) return;
    setMenu(contacts);
    setScreen({ cls: "menu", av: "", avColor: null, name: "", state: "", ring: false });
    const idx = await waitForPick();
    if (cancelled.current || idx === null) return;
    setMenu(null);
    const c = contacts[idx];
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `${d.sim.connecting} ${c.rel ? getLocalizedRelationship(c.rel, lang) : c.name}…`,
      ring: true,
    });
    await sleep(1500);
    if (cancelled.current) return;
    if (c.available) {
      setScreen({
        cls: "connected",
        av: initials(c.name),
        avColor: c.color,
        name: c.name,
        state: d.sim.connected,
        ring: false,
      });
    } else {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: `${c.name} (${d.contacts.busy})`,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function runSchedule() {
    setDots(0);
    setActiveDots({});
    setScreen({ cls: "", av: "•", avColor: null, name: d.sim.connecting, state: d.sim.connecting, ring: false });
    await sleep(900);
    if (cancelled.current) return;

    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    const schedule = line.schedule || [
      {
        id: "slot1",
        name: "Nurse Dawn",
        description: "Overnight support",
        startHour: 0,
        endHour: 7,
        color: "oklch(0.44 0.105 240)",
      },
      {
        id: "slot2",
        name: line.contacts[0]?.name || "Caregiver",
        description: "Daytime coverage",
        startHour: 7,
        endHour: 15,
        color: line.contacts[0]?.color || "oklch(0.62 0.10 198)",
      },
      {
        id: "slot3",
        name: line.contacts[1]?.name || "Primary Caregiver",
        description: "Afternoon primary",
        startHour: 15,
        endHour: 21,
        color: line.contacts[1]?.color || "oklch(0.58 0.115 232)",
      },
      {
        id: "slot4",
        name: line.contacts[2]?.name || "Evening contact",
        description: "Evening shift",
        startHour: 21,
        endHour: 24,
        color: line.contacts[2]?.color || "oklch(0.55 0.11 280)",
      },
    ];
    
    const activeSlot = schedule.find(s => currentHour >= s.startHour && currentHour < s.endHour);
    
    if (!activeSlot) {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: d.routing.noCaregivers,
        state: d.sim.vmSent,
        ring: false,
      });
      return;
    }

    const contact = line.contacts.find(c => c.name === activeSlot.name);
    
    setScreen({
      cls: "ring-state",
      av: initials(activeSlot.name),
      avColor: activeSlot.color,
      name: activeSlot.name,
      state: `${d.sim.ringing} (${activeSlot.description})…`,
      ring: true,
    });
    
    await sleep(1800);
    if (cancelled.current) return;

    const available = contact ? contact.available : true;

    if (available) {
      setScreen({
        cls: "connected",
        av: initials(activeSlot.name),
        avColor: activeSlot.color,
        name: activeSlot.name,
        state: `${d.sim.connected} — ${d.common.activeNow}`,
        ring: false,
      });
    } else {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: `${activeSlot.name} (${d.contacts.busy})`,
        state: d.sim.vmSent,
        ring: false,
      });
    }
  }

  async function run() {
    if (running || !contacts.length) return;
    cancelled.current = false;
    setRunning(true);
    if (line.mode === "menu") await runMenu();
    else if (line.mode === "schedule") await runSchedule();
    else if (line.mode === "simultaneous") await runSimultaneous();
    else await runCascade();
    if (!cancelled.current) {
      await sleep(2200);
    }
    setRunning(false);
    reset();
  }

  const pick = (i: number) => {
    if (resolveMenu.current) {
      resolveMenu.current(i);
      resolveMenu.current = null;
    }
  };

  return (
    <div className="simwrap">
      <div
        className={`sim-phone ${screen.cls === "connected" ? "connected" : ""} ${
          screen.cls === "voicemail" ? "voicemail" : ""
        } ${menu ? "menu" : ""}`}
      >
        {menu ? (
          <div className="sim-menu">
            <div className="t">Thanks for calling:</div>
            {menu.map((c, i) => (
              <button className="sim-opt" key={c.id} onClick={() => pick(i)}>
                <span className="digit">{i + 1}</span>
                <span>
                  <b>
                    {d.routing.caregiver} {i + 1} — {c.name}
                  </b>
                  <small>{c.rel ? getLocalizedRelationship(c.rel, lang) : (lang === "es" ? "Contacto" : lang === "fr" ? "Contact" : lang === "ja" ? "連絡先" : lang === "zh" ? "联系人" : lang === "ar" ? "جهة اتصال" : lang === "hi" ? "संपर्क" : lang === "pt" ? "Contato" : lang === "de" ? "Kontakt" : lang === "it" ? "Contatto" : lang === "ko" ? "연락처" : "Contact")}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <span className="numline">{line.number}</span>
            <div
              className={`sim-ava ${screen.ring ? "ring" : ""}`}
              style={{ background: screen.avColor || undefined }}
            >
              {screen.av}
            </div>
            <div className="sim-name">{screen.name}</div>
            <div className="sim-state">{screen.state}</div>
            {dots > 0 && (
              <div className="sim-dots">
                {Array.from({ length: dots }).map((_, i) => (
                  <i key={i} className={activeDots[i] || ""} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sim-side">
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--ink-faint)",
              marginBottom: 6,
            }}
          >
            {line.mode === "schedule"
              ? d.routing.scheduleTitle
              : line.mode === "menu"
              ? d.overview.callerMenu
              : line.mode === "simultaneous"
              ? d.routing.simultaneous
              : d.overview.cascade}
          </div>
          {contacts.map((c, i) => (
            <div className="preview-row" key={c.id}>
              <span className="dg">{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: "0.86rem", display: "block" }}>{c.name}</b>
                <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>{getLocalizedRelationship(c.rel, lang)}</span>
              </div>
              {!c.available && (
                <span className="badge badge-gray">
                  <span className="d"></span>{d.contacts.busy}
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "10px 16px",
            fontSize: "0.88rem",
            borderRadius: "var(--r-md)",
          }}
          onClick={run}
          disabled={running || !contacts.length}
        >
          <Icon name="phone" style={{ width: 16, height: 16 }} /> {running ? d.sim.connecting : d.sim.runTest}
        </button>
      </div>
    </div>
  );
}

/* Routing view */
export function RoutingView({
  line,
  setLine,
  showToast,
  d,
  lang,
  plan,
  setView,
  setAcctTab,
  setAutoOpenPlanModal,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: DashboardTranslations;
  lang: string;
  plan: PlanId;
  setView: (v: string) => void;
  setAcctTab: (t: string) => void;
  setAutoOpenPlanModal: (open: boolean) => void;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const [localSchedule, setLocalSchedule] = useState<CoverageSlot[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Slot editor state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotName, setSlotName] = useState("");
  const [customName, setCustomName] = useState("");
  const [slotDesc, setSlotDesc] = useState("");
  const [slotStart, setSlotStart] = useState(0);
  const [slotEnd, setSlotEnd] = useState(4);
  const [slotColor, setSlotColor] = useState("oklch(0.58 0.115 232)");

  // Add slot state
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setLocalSchedule(line.schedule || [
      {
        id: "slot1",
        name: "Nurse Dawn",
        description: "Overnight support",
        startHour: 0,
        endHour: 7,
        color: "oklch(0.44 0.105 240)",
      },
      {
        id: "slot2",
        name: line.contacts[0]?.name || "Caregiver",
        description: "Daytime coverage",
        startHour: 7,
        endHour: 15,
        color: line.contacts[0]?.color || "oklch(0.62 0.10 198)",
      },
      {
        id: "slot3",
        name: line.contacts[1]?.name || "Primary Caregiver",
        description: "Afternoon primary",
        startHour: 15,
        endHour: 21,
        color: line.contacts[1]?.color || "oklch(0.58 0.115 232)",
      },
      {
        id: "slot4",
        name: line.contacts[2]?.name || "Evening contact",
        description: "Evening shift",
        startHour: 21,
        endHour: 24,
        color: line.contacts[2]?.color || "oklch(0.55 0.11 280)",
      },
    ]);
    // Reseed the schedule only when switching lines; depending on line.schedule
    // would clobber in-progress edits whenever the schedule state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, line.contacts]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
  const activeSlot = localSchedule.find(
    (slot) => currentHour >= slot.startHour && currentHour < slot.endHour
  );

  const saveSchedule = (newSchedule: CoverageSlot[]) => {
    setLocalSchedule(newSchedule);
    setLine((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, schedule: newSchedule } : l))
    );
    showToast(ext.scheduleUpdatedToast);
  };

  const startEditing = (slot: CoverageSlot) => {
    setEditingSlotId(slot.id);
    const isPreset = line.contacts.some((c) => c.name === slot.name) || slot.name === "Nurse Dawn";
    if (isPreset) {
      setSlotName(slot.name);
      setCustomName("");
    } else {
      setSlotName("Custom");
      setCustomName(slot.name);
    }
    setSlotDesc(slot.description);
    setSlotStart(slot.startHour);
    setSlotEnd(slot.endHour);
    setSlotColor(slot.color);
  };

  const cancelEditing = () => {
    setEditingSlotId(null);
  };

  const saveSlot = (slotId: string) => {
    const finalName = slotName === "Custom" ? (customName || "Custom Slot") : slotName;
    const newSchedule = localSchedule.map((s) =>
      s.id === slotId
        ? {
            ...s,
            name: finalName,
            description: slotDesc,
            startHour: slotStart,
            endHour: slotEnd,
            color: slotColor,
          }
        : s
    );
    saveSchedule(newSchedule);
    setEditingSlotId(null);
  };

  const deleteSlot = (slotId: string) => {
    const newSchedule = localSchedule.filter((s) => s.id !== slotId);
    saveSchedule(newSchedule);
  };

  const addNewSlot = () => {
    const finalName = slotName === "Custom" ? (customName || "New Slot") : slotName;
    const newSlot: CoverageSlot = {
      id: `slot-new-${Date.now()}`,
      name: finalName,
      description: slotDesc || "Coverage slot",
      startHour: slotStart,
      endHour: slotEnd,
      color: slotColor,
    };
    const newSchedule = [...localSchedule, newSlot];
    saveSchedule(newSchedule);
    setShowAddForm(false);
  };

  const sortedSlots = [...localSchedule].sort((a, b) => a.startHour - b.startHour);

  let hasOverlap = false;
  let hasGap = false;
  const gapsList: { start: number; end: number }[] = [];

  if (localSchedule.length === 0) {
    hasGap = true;
    gapsList.push({ start: 0, end: 24 });
  } else {
    if (sortedSlots[0].startHour > 0) {
      hasGap = true;
      gapsList.push({ start: 0, end: sortedSlots[0].startHour });
    }
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const current = sortedSlots[i];
      const next = sortedSlots[i + 1];
      if (current.endHour < next.startHour) {
        hasGap = true;
        gapsList.push({ start: current.endHour, end: next.startHour });
      } else if (current.endHour > next.startHour) {
        hasOverlap = true;
      }
    }
    if (sortedSlots[sortedSlots.length - 1].endHour < 24) {
      hasGap = true;
      gapsList.push({ start: sortedSlots[sortedSlots.length - 1].endHour, end: 24 });
    }
  }

  const formatHour = (h: number) => {
    if (h === 0 || h === 24) return "12 AM";
    if (h === 12) return "12 PM";
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  const PRESET_COLORS = [
    { value: "oklch(0.58 0.115 232)", name: "Amber" },
    { value: "oklch(0.62 0.10 198)", name: "Teal" },
    { value: "oklch(0.44 0.105 240)", name: "Blue" },
    { value: "oklch(0.55 0.11 280)", name: "Purple" },
    { value: "oklch(0.60 0.12 30)", name: "Coral" },
    { value: "oklch(0.58 0.12 145)", name: "Green" },
  ];

  const setMode = (mode: "cascade" | "menu" | "simultaneous" | "schedule") => {
    if (mode === line.mode) return;
    if (plan === "essential" && mode !== "cascade") {
      const upgradeMsg = lang === "es" ? "¡Mejora a Pro para desbloquear este modo!"
        : lang === "fr" ? "Passez à la version Pro pour débloquer ce mode !"
        : lang === "ja" ? "このモードを有効にするにはProプランにアップグレードしてください"
        : lang === "zh" ? "升级到专业版以解锁此模式"
        : lang === "ar" ? "ترقية إلى باقة برو لفتح هذا الوضع"
        : lang === "hi" ? "इस मोड को अनलॉक करने के लिए प्रो में अपग्रेड करें"
        : lang === "pt" ? "Atualize para o Pro para desbloquear este modo"
        : lang === "de" ? "Upgrade auf Pro, um diesen Modus freizuschalten"
        : lang === "it" ? "Passa a Pro per sbloccare questa modalità"
        : lang === "ko" ? "이 모드를 잠금 해제하려면 Pro로 업그레이드하세요"
        : "Upgrade to Pro to unlock this routing mode";
      showToast(upgradeMsg);
      setAcctTab("billing");
      setAutoOpenPlanModal(true);
      setView("account");
      return;
    }
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, mode } : l)));
    showToast(d.common.savedToast);
  };

  return (
    <div className="content-inner">
      {/* Line Details Customization Card */}
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{ext.lineDetails}</h2>
            <p>{ext.lineDetailsSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label>{ext.lineLabel}</label>
            <input
              type="text"
              value={getLocalizedLineLabel(line.label, lang)}
              onChange={(e) => setLine((prev) => prev.map((l) => l.id === line.id ? { ...l, label: e.target.value } : l))}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
              placeholder="e.g. Robert's line"
              style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)", width: "100%", outline: "none" }}
            />
          </div>
          <div className="field">
            <label>{ext.assignedToPerson}</label>
            <input
              type="text"
              value={getLocalizedPersonName(line.person, lang)}
              onChange={(e) => setLine((prev) => prev.map((l) => l.id === line.id ? { ...l, person: e.target.value } : l))}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
              placeholder="e.g. Robert Hale · Dad"
              style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)", width: "100%", outline: "none" }}
            />
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{d.routing.connMethod}</h2>
            <p>
              {d.routing.connMethodSub}
            </p>
          </div>
        </div>
        <div className="card-pad">
          <div className="mode-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            <div
              className={`mode-card ${line.mode === "cascade" ? "sel" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "cascade" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
              }}
              onClick={() => setMode("cascade")}
            >
              <div className="ic" style={{ marginBottom: 12 }}>
                <Icon name="routing" style={{ width: 24, height: 24 }} />
              </div>
              <h4>{d.routing.cascade}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.cascadeDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "simultaneous" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "simultaneous" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("simultaneous")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="spark" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.simultaneous}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.simultaneousDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "menu" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "menu" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("menu")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="list" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.callerMenu}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.menuDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "schedule" ? "sel" : ""} ${plan === "essential" ? "locked" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "schedule" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                opacity: plan === "essential" ? 0.75 : 1,
              }}
              onClick={() => setMode("schedule")}
            >
              <div className="ic" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Icon name="clock" style={{ width: 24, height: 24 }} />
                {plan === "essential" && <Badge kind="blue">PRO</Badge>}
              </div>
              <h4>{d.routing.scheduleTitle}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.scheduleDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Around-the-clock coverage timeline */}
      {line.mode === "schedule" && (
        <div className="card section-gap">
          <div className="card-head">
            <div>
              <h2>{d.routing.scheduleTitle}</h2>
              <p>
                {d.routing.scheduleSub}
              </p>
            </div>
            {activeSlot && (
              <Badge kind="green">
                {d.common.activeNow}: {activeSlot.name}
              </Badge>
            )}
          </div>
          <div className="card-pad">
          {/* Timeline visualization */}
          <div style={{ background: "var(--tint)", padding: 20, borderRadius: "var(--r-md)", border: "1px solid var(--line)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>{ext.coverageTimeline}</span>
              <span className="demo-status" style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: 999 }}>
                <span className="live" style={{ background: activeSlot ? "var(--green)" : "var(--ink-faint)" }}></span>
                {ext.currentTimeLabel}: {formatHour(Math.floor(currentHour))}:{String(Math.floor((currentHour % 1) * 60)).padStart(2, '0')}
              </span>
            </div>
            
            {/* Visual Timeline Track */}
            <div style={{ height: 48, display: "flex", borderRadius: 8, overflow: "hidden", position: "relative", background: "oklch(0.9 0.01 220)" }}>
              {sortedSlots.map((slot) => {
                const duration = slot.endHour - slot.startHour;
                const pct = (duration / 24) * 100;
                return (
                  <div
                    key={slot.id}
                    style={{
                      width: `${pct}%`,
                      background: slot.color,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#fff",
                      textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                      fontSize: "0.8rem",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      paddingInline: 4,
                      borderRight: "1px solid rgba(255,255,255,0.15)",
                    }}
                    title={`${slot.name} (${formatHour(slot.startHour)} - ${formatHour(slot.endHour)})`}
                  >
                    <b style={{ display: "block" }}>{slot.name}</b>
                    <span style={{ fontSize: "0.66rem", opacity: 0.85 }}>{formatHour(slot.startHour)} - {formatHour(slot.endHour)}</span>
                  </div>
                );
              })}
              
              {/* Pulsating Indicator for current time */}
              <div
                style={{
                  position: "absolute",
                  left: `${(currentHour / 24) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: "oklch(0.60 0.12 30)",
                  boxShadow: "0 0 10px 2px oklch(0.60 0.12 30)",
                  zIndex: 10,
                }}
              />
            </div>
            
            {/* Timeline Hour Marks */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--ink-faint)", marginTop: 8, paddingInline: 4 }}>
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          {/* Validation Alert / Status */}
          {(hasGap || hasOverlap) && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: "var(--r-sm)", background: hasOverlap ? "oklch(0.96 0.04 25)" : "oklch(0.96 0.05 75)", color: hasOverlap ? "oklch(0.5 0.13 20)" : "oklch(0.5 0.13 60)", fontSize: "0.86rem", display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                {hasOverlap && <div><b>{lang === "es" ? "Superposición de cobertura:" : lang === "fr" ? "Chevauchement de couverture :" : lang === "ja" ? "重複するカバー範囲:" : lang === "zh" ? "时间段重叠:" : lang === "ar" ? "تداخل التغطية:" : lang === "hi" ? "ओवरलैपिंग कवरेज:" : lang === "pt" ? "Sobreposição de cobertura:" : lang === "de" ? "Überschneidung der Abdeckung:" : lang === "it" ? "Copertura sovrapposta:" : lang === "ko" ? "스케줄 중복:" : "Overlapping Coverage:"}</b> {ext.overlappingCoverage.split(":").slice(1).join(":").trim() || ext.overlappingCoverage}</div>}
                {hasGap && (
                  <div>
                    <b>{lang === "es" ? "Horarios sin cobertura:" : lang === "fr" ? "Créneaux non couverts :" : lang === "ja" ? "未カバーの時間帯:" : lang === "zh" ? "未覆盖的时间段:" : lang === "ar" ? "فترات غير مغطاة:" : lang === "hi" ? "बिना कवरेज के अंतराल:" : lang === "pt" ? "Períodos sem cobertura:" : lang === "de" ? "Unabgedeckte Zeiten:" : lang === "it" ? "Fasce orarie scoperte:" : lang === "ko" ? "담당자 부재 시간대:" : "Uncovered Gaps:"}</b>{" "}
                    {gapsList.map((g, idx) => (
                      <span key={idx}>
                        {idx > 0 && ", "}
                        {formatHour(g.start)} {lang === "es" ? " a " : lang === "fr" ? " à " : lang === "ja" ? " から " : lang === "zh" ? " 至 " : lang === "ar" ? " إلى " : lang === "hi" ? " से " : lang === "pt" ? " a " : lang === "de" ? " bis " : lang === "it" ? " a " : lang === "ko" ? "부터 " : " to "} {formatHour(g.end)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Slots List and Editor */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>{ext.manageTimeSlots}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sortedSlots.map((slot) => {
                const isEditing = editingSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r-md)",
                      background: "var(--surface)",
                      padding: 16,
                    }}
                  >
                    {!isEditing ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50%", background: slot.color }}></span>
                          <div>
                            <h4 style={{ fontSize: "0.96rem", fontWeight: 600 }}>{slot.name}</h4>
                            <p style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
                              {slot.description === "Vacant slot" ? ext.vacantSlot : slot.description} · {formatHour(slot.startHour)} {lang === "es" ? " a " : lang === "fr" ? " à " : lang === "ja" ? " から " : lang === "zh" ? " 至 " : lang === "ar" ? " إلى " : lang === "hi" ? " से " : lang === "pt" ? " a " : lang === "de" ? " bis " : lang === "it" ? " a " : lang === "ko" ? "부터 " : " to "} {formatHour(slot.endHour)}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => startEditing(slot)}
                            className="btn btn-soft btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {ext.edit}
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            className="btn btn-soft btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem", color: "oklch(0.55 0.18 25)" }}
                          >
                            {ext.delete}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Inline edit form
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12 }}>
                          {/* Name Select Dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.assignTo}</label>
                            <select
                              value={slotName}
                              onChange={(e) => {
                                setSlotName(e.target.value);
                                // Suggest description based on relationship if available
                                const contact = line.contacts.find((c) => c.name === e.target.value);
                                if (contact && contact.rel) {
                                  setSlotDesc(getLocalizedRelationship(contact.rel, lang));
                                }
                              }}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                              {line.contacts.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name} ({getLocalizedRelationship(c.rel, lang)})
                                </option>
                              ))}
                              <option value="Custom">{ext.custom}</option>
                            </select>
                          </div>
                          
                          {/* Custom Name text input if "Custom" selected */}
                          {slotName === "Custom" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.customName}</label>
                              <input
                                type="text"
                                placeholder={ext.enterName}
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                              />
                            </div>
                          )}
                          
                          {/* Description input */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.description}</label>
                            <input
                              type="text"
                              value={slotDesc === "Vacant slot" ? ext.vacantSlot : slotDesc}
                              onChange={(e) => setSlotDesc(e.target.value)}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            />
                          </div>
                          
                          {/* Start hour dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.startHour}</label>
                            <select
                              value={slotStart}
                              onChange={(e) => setSlotStart(Number(e.target.value))}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              {Array.from({ length: 25 }).map((_, h) => (
                                <option key={h} value={h} disabled={h >= slotEnd}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* End hour dropdown */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.endHour}</label>
                            <select
                              value={slotEnd}
                              onChange={(e) => setSlotEnd(Number(e.target.value))}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              {Array.from({ length: 25 }).map((_, h) => (
                                <option key={h} value={h} disabled={h <= slotStart}>
                                  {formatHour(h)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Color Picker Swatches */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.swatchColor}</label>
                          <div style={{ display: "flex", gap: 8 }}>
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.value}
                                type="button"
                                onClick={() => setSlotColor(c.value)}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  background: c.value,
                                  border: slotColor === c.value ? "2.5px solid var(--ink)" : "1px solid var(--line)",
                                  cursor: "pointer",
                                }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Save & Cancel buttons */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                          <button
                            onClick={cancelEditing}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {d.contacts.cancel}
                          </button>
                          <button
                            onClick={() => saveSlot(slot.id)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                          >
                            {ext.save}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add a New Segment form */}
          {!showAddForm ? (
            <button
              onClick={() => {
                setShowAddForm(true);
                // Pre-fill values
                setSlotName("Custom");
                setCustomName("");
                setSlotDesc("");
                setSlotStart(0);
                setSlotEnd(4);
                setSlotColor(PRESET_COLORS[0].value);
              }}
              className="btn btn-soft"
              style={{ marginTop: 18, width: "100%", padding: 12, border: "1px dashed var(--line)" }}
            >
              + {ext.addNewSegment}
            </button>
          ) : (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: "var(--r-md)",
                border: "1px dashed var(--line)",
                background: "var(--tint)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <h4 style={{ fontSize: "0.96rem", fontWeight: 600 }}>{ext.addNewSlot}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 12 }}>
                {/* Assign dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.assignTo}</label>
                  <select
                    value={slotName}
                    onChange={(e) => {
                      setSlotName(e.target.value);
                      const contact = line.contacts.find((c) => c.name === e.target.value);
                      if (contact && contact.rel) {
                        setSlotDesc(getLocalizedRelationship(contact.rel, lang));
                      }
                    }}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                    {line.contacts.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({getLocalizedRelationship(c.rel, lang)})
                      </option>
                    ))}
                    <option value="Custom">{ext.custom}</option>
                  </select>
                </div>
                
                {slotName === "Custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.customName}</label>
                    <input
                      type="text"
                      placeholder={ext.enterName}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                    />
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.description}</label>
                  <input
                    type="text"
                    value={slotDesc}
                    onChange={(e) => setSlotDesc(e.target.value)}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.startHour}</label>
                  <select
                    value={slotStart}
                    onChange={(e) => setSlotStart(Number(e.target.value))}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    {Array.from({ length: 25 }).map((_, h) => (
                      <option key={h} value={h} disabled={h >= slotEnd}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.endHour}</label>
                  <select
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(Number(e.target.value))}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    {Array.from({ length: 25 }).map((_, h) => (
                      <option key={h} value={h} disabled={h <= slotStart}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swatch color selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "0.74rem", color: "var(--ink-faint)", fontWeight: 600 }}>{ext.swatchColor}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSlotColor(c.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: c.value,
                        border: slotColor === c.value ? "2.5px solid var(--ink)" : "1px solid var(--line)",
                        cursor: "pointer",
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  {d.contacts.cancel}
                </button>
                <button
                  onClick={addNewSlot}
                  className="btn btn-primary btn-sm"
                  style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                >
                  {d.routing.addSlot}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.sim.runTest}</h2>
            <p>
              {ext.simSubtitle.replace("{name}", getLocalizedPersonName(line.person, lang).split(" · ")[0])}
            </p>
          </div>
          <Badge kind="blue">
            {line.mode === "schedule"
              ? d.routing.scheduleTitle
              : line.mode === "menu"
              ? d.overview.callerMenu
              : line.mode === "simultaneous"
              ? d.routing.simultaneous
              : d.overview.cascade}
          </Badge>
        </div>
        <div className="card-pad">
          <TestCall line={line} d={d} lang={lang} />
        </div>
      </div>
    </div>
  );
}
