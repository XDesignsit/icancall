"use client";

import React, { useState, useRef, useEffect } from "react";
import { dashboardTranslations } from "@/lib/dashboardTranslations";
import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";

/* ============ DEMO DATA & HELPERS ============ */
const AVATAR_COLORS = [
  "oklch(0.58 0.115 232)",
  "oklch(0.62 0.10 198)",
  "oklch(0.55 0.13 285)",
  "oklch(0.60 0.13 30)",
  "oklch(0.58 0.13 145)",
  "oklch(0.6 0.14 350)",
];

const initials = (name: string) =>
  (name || "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const PLAN_MINUTES = 60; // per line, Pro

const STATUS_META = {
  connected: { badge: "badge-green", label: "Connected", dirCls: "dir-in" },
  missed: { badge: "badge-rose", label: "Missed → alerted", dirCls: "dir-miss" },
  voicemail: { badge: "badge-blue", label: "Voicemail", dirCls: "dir-vm" },
};

/* ============ TYPES ============ */
interface Contact {
  id: string;
  name: string;
  rel: string;
  phone: string;
  color: string;
  available: boolean;
}

interface CoverageSlot {
  id: string;
  name: string;
  description: string;
  startHour: number;
  endHour: number;
  color: string;
}

interface Line {
  id: string;
  label: string;
  person: string;
  number: string;
  color: string;
  mode: "menu" | "cascade" | "schedule";
  minutesUsed: number;
  contacts: Contact[];
  schedule?: CoverageSlot[];
  settings?: {
    greeting?: string;
    bilingual?: boolean;
    language2?: string;
    notifSMS?: boolean;
    notifEmail?: boolean;
    notifMissed?: boolean;
    notifWeekly?: boolean;
  };
}

interface CallLogEntry {
  id: number;
  status: "connected" | "missed" | "voicemail";
  caller: string;
  routed: string;
  rel: string;
  dur: string;
  when: string;
}

interface Account {
  name: string;
  preferred: string;
  role: string;
  email: string;
  notifyEmail: string;
  phone: string;
  address: string;
  timezone: string;
  language: string;
  twoFactor: boolean;
  card: { brand: string; last4: string; exp: string };
  billingAddr: string;
  addons: {
    extraNumbers: number;
    minuteBlocks: number;
    usedMin: number;
    rolloverMin: number;
  };
}

/* ============ ICONS ============ */
const ICONS = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  contacts: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 6.5a3 3 0 0 1 0 5.8"/><path d="M17.5 19a5 5 0 0 0-3-4.6"/></>,
  routing: <><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H14a2 2 0 0 1 2 2v0M8.4 6.3l7 9.4"/></>,
  log: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 7l2.1 1.2M17.7 15.8l2.1 1.2M19.8 7l-2.1 1.2M6.3 15.8 4.2 17M2.5 12h2.4M19.1 12h2.4"/></>,
  usage: <><path d="M4 19V5M4 19h16"/><rect x="7.5" y="11" width="3" height="5"/><rect x="13.5" y="7" width="3" height="9"/></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
  phone: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/></>,
  trash: <><path d="M5 7h14M9 7V5h6v2M7 7l1 12h8l1-12"/></>,
  up: <><path d="m6 14 6-6 6 6"/></>,
  down: <><path d="m6 10 6 6 6-6"/></>,
  check: <><path d="m5 12 5 5L20 6"/></>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  chev: <><path d="m6 9 6 6 6-6"/></>,
  in: <><path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z"/></>,
  voicemail: <><circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M7 16.5h10"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  alert: <><path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z"/></>,
  list: <><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>,
  download: <><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></>,
  lock: <><rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h11"/></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.2"/></>,
  device: <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3M21 3v5h-5"/></>,
};

function Icon({ name, className, ...rest }: { name: keyof typeof ICONS; className?: string; [key: string]: any }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {ICONS[name] || null}
    </svg>
  );
}

function Avatar({ name, color, size = 46, radius = "50%", fontSize }: { name: string; color: string; size?: number; radius?: string; fontSize?: number }) {
  return (
    <span
      className="ava"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: fontSize || size * 0.38,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </span>
  );
}

function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <span className={`badge badge-${kind}`}>
      <span className="d"></span>
      {children}
    </span>
  );
}

function Toggle({
  on,
  onChange,
  labels = ["Busy", "Available"],
}: {
  on: boolean;
  onChange: (val: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="track"></span>
      <span className="lbl">{on ? labels[1] : labels[0]}</span>
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check" />
      {msg}
    </div>
  );
}

/* ============ SUB VIEWS ============ */

/* Overview */
function StatCard({
  icon,
  iconBg,
  iconColor,
  val,
  lbl,
  trend,
  trendDir,
}: {
  icon: keyof typeof ICONS;
  iconBg: string;
  iconColor: string;
  val: string | number;
  lbl: string;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  return (
    <div className="stat">
      <div className="ic" style={{ background: iconBg, color: iconColor }}>
        <Icon name={icon} />
      </div>
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
      {trend && <div className={`trend trend-${trendDir}`}>{trend}</div>}
    </div>
  );
}

function OverviewView({
  lines,
  log,
  line,
  setView,
  setActiveLineId,
  d,
  lang,
}: {
  lines: Line[];
  log: Record<string, CallLogEntry[]>;
  line: Line;
  setView: (v: string) => void;
  setActiveLineId: (id: string) => void;
  d: any;
  lang: string;
}) {
  const allCalls = Object.values(log).flat();
  const totalThisWeek = allCalls.length;
  const missed = allCalls.filter((c) => c.status !== "connected").length;
  const connectRate = totalThisWeek > 0 ? Math.round(((totalThisWeek - missed) / totalThisWeek) * 100) : 100;
  const totalContacts = lines.reduce((s, l) => s + l.contacts.length, 0);

  const recent = (log[line.id] || []).slice(0, 5);

  return (
    <div className="content-inner">
      <div className="stat-grid section-gap">
        <StatCard
          icon="phone"
          iconBg="var(--tint)"
          iconColor="var(--blue-deep)"
          val={totalThisWeek}
          lbl={d.overview.callsWeek}
          trend="▲ 18%"
          trendDir="up"
        />
        <StatCard
          icon="check"
          iconBg="oklch(0.95 0.05 158)"
          iconColor="oklch(0.45 0.13 158)"
          val={`${connectRate}%`}
          lbl={d.overview.connectedFirst}
          trend="▲ 6%"
          trendDir="up"
        />
        <StatCard
          icon="alert"
          iconBg="oklch(0.96 0.05 22)"
          iconColor="var(--rose)"
          val={missed}
          lbl={d.overview.missedAlerted}
          trend="▼ 2"
          trendDir="down"
        />
        <StatCard
          icon="contacts"
          iconBg="oklch(0.96 0.04 285)"
          iconColor="var(--violet)"
          val={totalContacts}
          lbl={d.overview.trustedContacts}
          trend={`across ${lines.length} ${d.common.numbers}`}
          trendDir="up"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="ov-cols">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.overview.yourNumbers}</h2>
              <p>{lines.length} {d.overview.includedPro}</p>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lines.map((l) => (
              <div
                key={l.id}
                className="crow"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setActiveLineId(l.id);
                  setView("contacts");
                }}
              >
                <Avatar name={l.person} color={l.color} size={42} radius="11px" />
                <div className="info">
                  <b>{l.label}</b>
                  <div className="rel">{l.person}</div>
                  <div className="tel">{l.number}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Badge kind={l.mode === "menu" ? "blue" : "amber"}>
                    {l.mode === "menu" ? d.overview.callerMenu : l.mode === "schedule" ? d.overview.timeSchedule : d.overview.cascade}
                  </Badge>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                    {l.contacts.length} {d.contacts.limitPill}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.overview.recentCalls}</h2>
              <p>{line.label}</p>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => setView("log")}>
              {d.overview.viewAll}
            </button>
          </div>
          <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {recent.map((c) => {
              const m = STATUS_META[c.status as keyof typeof STATUS_META];
              return (
                <div className="logrow" key={c.id} style={{ gridTemplateColumns: "40px 1fr auto" }}>
                  <div className={`dir ${m.dirCls}`}>
                    <Icon name={c.status === "voicemail" ? "voicemail" : c.status === "missed" ? "alert" : "in"} />
                  </div>
                  <div className="who">
                    <b>{c.routed === "No one available" ? (lang === "es" ? "Nadie disponible" : lang === "fr" ? "Personne de disponible" : lang === "ja" ? "対応者なし" : lang === "zh" ? "无人可用" : lang === "ar" ? "لا أحد متاح" : lang === "hi" ? "कोई उपलब्ध नहीं" : lang === "pt" ? "Ninguém disponível" : lang === "de" ? "Niemand verfügbar" : lang === "it" ? "Nessuno disponibile" : lang === "ko" ? "연결 가능 도우미 없음" : "No one available") : c.routed}</b>
                    <span>
                      {c.caller === "Unknown" ? (lang === "es" ? "Desconocido" : lang === "fr" ? "Inconnu" : lang === "ja" ? "不明" : lang === "zh" ? "未知" : lang === "ar" ? "مجهول" : lang === "hi" ? "अज्ञात" : lang === "pt" ? "Desconhecido" : lang === "de" ? "Unbekannt" : lang === "it" ? "Sconosciuto" : lang === "ko" ? "알 수 없음" : "Unknown") :
                       c.caller.replace("(mobile)", lang === "es" ? "(móvil)" : lang === "fr" ? "(portable)" : lang === "ja" ? "(携帯電話)" : lang === "zh" ? "(手机)" : lang === "ar" ? "(هاتف محمول)" : lang === "hi" ? "(मोबाइल)" : lang === "pt" ? "(celular)" : lang === "de" ? "(Mobiltelefon)" : lang === "it" ? "(cellulare)" : lang === "ko" ? "(휴대전화)" : "(mobile)")} · {c.when.replace("Today", lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : lang === "ja" ? "今日" : lang === "zh" ? "今天" : lang === "ar" ? "اليوم" : lang === "hi" ? "오늘" : lang === "pt" ? "Hoje" : lang === "de" ? "Heute" : lang === "it" ? "Oggi" : lang === "ko" ? "오늘" : "Today")
                                           .replace("Yesterday", lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "कल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday")
                                           .replace("Mon", lang === "es" ? "Lun" : lang === "fr" ? "Lun" : lang === "ja" ? "月" : lang === "zh" ? "周一" : lang === "ar" ? "الإثنين" : lang === "hi" ? "소म" : lang === "pt" ? "Seg" : lang === "de" ? "Mon" : lang === "it" ? "Lun" : lang === "ko" ? "월" : "Mon")
                                           .replace("Tue", lang === "es" ? "Mar" : lang === "fr" ? "Mar" : lang === "ja" ? "火" : lang === "zh" ? "周二" : lang === "ar" ? "الثلاثاء" : lang === "hi" ? "मंगल" : lang === "pt" ? "Ter" : lang === "de" ? "Tue" : lang === "it" ? "Mar" : lang === "ko" ? "화" : "Tue")
                                           .replace("Wed", lang === "es" ? "Mié" : lang === "fr" ? "Mer" : lang === "ja" ? "水" : lang === "zh" ? "周三" : lang === "ar" ? "الأربعاء" : lang === "hi" ? "बुध" : lang === "pt" ? "Qua" : lang === "de" ? "Wed" : lang === "it" ? "Mer" : lang === "ko" ? "수" : "Wed")
                                           .replace("Thu", lang === "es" ? "Jue" : lang === "fr" ? "Jeu" : lang === "ja" ? "목" : lang === "zh" ? "周四" : lang === "ar" ? "الخميس" : lang === "hi" ? "गुरु" : lang === "pt" ? "Qui" : lang === "de" ? "Thu" : lang === "it" ? "Gio" : lang === "ko" ? "목" : "Thu")
                                           .replace("Fri", lang === "es" ? "Vie" : lang === "fr" ? "Ven" : lang === "ja" ? "金" : lang === "zh" ? "周五" : lang === "ar" ? "الجمعة" : lang === "hi" ? "शुक्र" : lang === "pt" ? "Sex" : lang === "de" ? "Fr" : lang === "it" ? "Ven" : lang === "ko" ? "금" : "Fri")
                                           .replace("Sat", lang === "es" ? "Sáb" : lang === "fr" ? "Sam" : lang === "ja" ? "土" : lang === "zh" ? "周六" : lang === "ar" ? "السبت" : lang === "hi" ? "शनि" : lang === "pt" ? "Sáb" : lang === "de" ? "Sat" : lang === "it" ? "Sab" : lang === "ko" ? "토" : "Sat")
                                           .replace("Sun", lang === "es" ? "Dom" : lang === "fr" ? "Dim" : lang === "ja" ? "日" : lang === "zh" ? "周日" : lang === "ar" ? "الأحد" : lang === "hi" ? "रवि" : lang === "pt" ? "Dom" : lang === "de" ? "So" : lang === "it" ? "Dom" : lang === "ko" ? "일" : "Sun")}
                    </span>
                  </div>
                  <Badge kind={m.badge.replace("badge-", "")}>{c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 900px){ .ov-cols{ grid-template-columns:1fr !important; } }`}</style>
    </div>
  );
}

/* Contacts */
function ContactModal({
  initial,
  order,
  onSave,
  onClose,
  d,
}: {
  initial?: Contact;
  order: number;
  onSave: (c: Contact) => void;
  onClose: () => void;
  d: any;
}) {
  const editing = !!initial;
  const [name, setName] = useState(initial?.name || "");
  const [rel, setRel] = useState(initial?.rel || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [color, setColor] = useState(initial?.color || AVATAR_COLORS[order % AVATAR_COLORS.length]);

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id || "c" + Date.now(),
      name: name.trim(),
      rel: rel.trim(),
      phone: phone.trim(),
      color,
      available: initial?.available ?? true,
    });
  };

  return (
    <Modal
      title={editing ? d.contacts.editContact : d.contacts.addContact}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            {d.contacts.cancel}
          </button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? d.contacts.saveChanges : d.contacts.addContact}
          </button>
        </>
      }
    >
      <div className="field">
        <label>{d.contacts.fullName}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Maria Delgado"
          autoFocus
          maxLength={28}
        />
      </div>
      <div className="field">
        <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label>{d.contacts.relationship}</label>
            <input
              value={rel}
              onChange={(e) => setRel(e.target.value)}
              placeholder="Daughter"
              maxLength={28}
            />
          </div>
          <div>
            <label>{d.contacts.phoneRing}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(415) 555-0100"
              maxLength={20}
            />
          </div>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>{d.contacts.avatarColor}</label>
        <div className="swatch-row" style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {AVATAR_COLORS.map((c) => (
            <span
              key={c}
              className={`swatch ${c === color ? "sel" : ""}`}
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: c === color ? "2.5px solid var(--accent)" : "1px solid var(--line)",
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ContactsView({
  line,
  setLine,
  showToast,
  d,
  lang,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: any;
  lang: string;
}) {
  const [modal, setModal] = useState<{ edit?: Contact } | null>(null);
  const contacts = line.contacts;
  const full = contacts.length >= 6;

  const move = (idx: number, dir: number) => {
    const j = idx + dir;
    if (j < 0 || j >= contacts.length) return;
    setLine((prev) =>
      prev.map((l) => {
        if (l.id !== line.id) return l;
        const arr = [...l.contacts];
        [arr[idx], arr[j]] = [arr[j], arr[idx]];
        return { ...l, contacts: arr };
      })
    );
  };

  const remove = (id: string) => {
    setLine((prev) =>
      prev.map((l) => (l.id === line.id ? { ...l, contacts: l.contacts.filter((c) => c.id !== id) } : l))
    );
    showToast(d.contacts.removedToast);
  };

  const toggleAvail = (id: string) =>
    setLine((prev) =>
      prev.map((l) =>
        l.id === line.id
          ? {
              ...l,
              contacts: l.contacts.map((c) => (c.id === id ? { ...c, available: !c.available } : c)),
            }
          : l
      )
    );

  const save = (contact: Contact) => {
    setLine((prev) =>
      prev.map((l) => {
        if (l.id !== line.id) return l;
        const exists = l.contacts.some((c) => c.id === contact.id);
        return {
          ...l,
          contacts: exists
            ? l.contacts.map((c) => (c.id === contact.id ? contact : c))
            : [...l.contacts, contact],
        };
      })
    );
    showToast(modal?.edit ? d.contacts.updatedToast : d.contacts.addedToast);
    setModal(null);
  };

  return (
    <div className="content-inner">
      <div className="contacts-head">
        <div>
          <p className="hint">
            <b>{line.person.split(" · ")[0]}</b>
            {lang === "es" ? " puede contactar en " : lang === "fr" ? " peut joindre sur " : lang === "ja" ? " が連絡可能な相手番号: " : lang === "zh" ? " 可以呼叫的电话号码: " : lang === "ar" ? " يمكنه الاتصال على " : lang === "hi" ? " इस नंबर पर संपर्क कर सकते हैं: " : lang === "pt" ? " pode contatar em " : lang === "de" ? " kann unter dieser Nummer erreichen: " : lang === "it" ? " può raggiungere su " : lang === "ko" ? " 가 연락할 수 있는 번호: " : " can reach on "}
            {line.number}.{" "}
            {line.mode === "schedule"
              ? d.contacts.hintSchedule
              : line.mode === "menu"
              ? d.contacts.hintMenu
              : d.contacts.hintCascade}
          </p>
        </div>
        <span className="cap-pill">{contacts.length} / 6 {d.contacts.limitPill}</span>
      </div>

      <div className="clist">
        {contacts.map((c, i) => (
          <div className={`crow ${c.available ? "" : "dim"}`} key={c.id}>
            <div className="reorder">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <Icon name="up" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === contacts.length - 1} aria-label="Move down">
                <Icon name="down" />
              </button>
            </div>
            <div className="pos">
              <span className="num">{i + 1}</span>
            </div>
            <Avatar name={c.name} color={c.color} />
            <div className="info">
              <b>{c.name}</b>
              <div className="rel">{c.rel || "Contact"}</div>
              <div className="tel">{c.phone || "No number set"}</div>
            </div>
            <div className="acts">
              <Toggle on={c.available} onChange={() => toggleAvail(c.id)} labels={[d.contacts.busy, d.contacts.available]} />
              <button className="mini" onClick={() => setModal({ edit: c })} aria-label="Edit">
                <Icon name="edit" />
              </button>
              <button className="mini del" onClick={() => remove(c.id)} aria-label="Remove">
                <Icon name="trash" />
              </button>
            </div>
          </div>
        ))}

        <div className={`add-slot ${full ? "full" : ""}`} onClick={() => !full && setModal({})}>
          {full ? (
            <>{d.contacts.limitReached}</>
          ) : (
            <>
              <Icon name="plus" /> {d.contacts.addContact}
            </>
          )}
        </div>
      </div>

      {modal && (
        <ContactModal
          initial={modal.edit}
          order={contacts.length}
          onSave={save}
          onClose={() => setModal(null)}
          d={d}
        />
      )}
    </div>
  );
}

/* Call Simulator */
function TestCall({ line, d }: { line: Line; d: any }) {
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
  }, [line.id, line.mode]);

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
      name: line.mode === "schedule" ? d.overview.timeSchedule : line.mode === "menu" ? d.overview.callerMenu : d.sim.ready,
      state:
        line.mode === "schedule"
          ? d.routing.scheduleDesc
          : line.mode === "menu"
          ? d.routing.menuDesc
          : d.sim.runTest,
      ring: false,
    });
  }

  async function ringConnect(c: Contact, idx: number) {
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `${d.sim.ringing} ${c.rel || ""}…`,
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
      state: `${d.sim.connecting} ${c.rel || c.name}…`,
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
                  <small>{c.rel || "Contact"}</small>
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
              : d.overview.cascade}
          </div>
          {contacts.map((c, i) => (
            <div className="preview-row" key={c.id}>
              <span className="dg">{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: "0.86rem", display: "block" }}>{c.name}</b>
                <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>{c.rel}</span>
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
function RoutingView({
  line,
  setLine,
  showToast,
  d,
  lang,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: any;
  lang: string;
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
    showToast("Coverage schedule updated successfully");
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
  const totalHours = localSchedule.reduce((sum, slot) => sum + (slot.endHour - slot.startHour), 0);

  let hasOverlap = false;
  let hasGap = false;
  let gapsList: { start: number; end: number }[] = [];

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

  const setMode = (mode: "cascade" | "menu" | "schedule") => {
    if (mode === line.mode) return;
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, mode } : l)));
    showToast(d.common.savedToast);
  };

  return (
    <div className="content-inner">
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
              className={`mode-card ${line.mode === "menu" ? "sel" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "menu" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
              }}
              onClick={() => setMode("menu")}
            >
              <div className="ic" style={{ marginBottom: 12 }}>
                <Icon name="list" style={{ width: 24, height: 24 }} />
              </div>
              <h4>{d.routing.callerMenu}</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                {d.routing.menuDesc}
              </p>
            </div>
            <div
              className={`mode-card ${line.mode === "schedule" ? "sel" : ""}`}
              style={{
                cursor: "pointer",
                padding: 20,
                border: line.mode === "schedule" ? "2.5px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "var(--r-md)",
              }}
              onClick={() => setMode("schedule")}
            >
              <div className="ic" style={{ marginBottom: 12 }}>
                <Icon name="clock" style={{ width: 24, height: 24 }} />
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
              <span style={{ fontSize: "0.86rem", fontWeight: 600 }}>24-Hour Coverage Timeline</span>
              <span className="demo-status" style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: 999 }}>
                <span className="live" style={{ background: activeSlot ? "var(--green)" : "var(--ink-faint)" }}></span>
                Current Time: {formatHour(Math.floor(currentHour))}:{String(Math.floor((currentHour % 1) * 60)).padStart(2, '0')}
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
              <span>⚠️</span>
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
                                  setSlotDesc(contact.rel);
                                }
                              }}
                              style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                            >
                              <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                              {line.contacts.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.name} ({c.rel})
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
                        setSlotDesc(contact.rel);
                      }
                    }}
                    style={{ padding: 8, borderRadius: "var(--r-sm)", border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                  >
                    <option value="Nurse Dawn">{lang === "ko" ? "간호사 Dawn" : lang === "ja" ? "看護師 Dawn" : lang === "zh" ? "护士 Dawn" : "Nurse Dawn"}</option>
                    {line.contacts.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.rel})
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
              Place a simulated call to see exactly what {line.person.split(" · ")[0]}'s callers will
              experience.
            </p>
          </div>
          <Badge kind="blue">
            {line.mode === "schedule"
              ? d.routing.scheduleTitle
              : line.mode === "menu"
              ? d.overview.callerMenu
              : d.overview.cascade}
          </Badge>
        </div>
        <div className="card-pad">
          <TestCall line={line} d={d} />
        </div>
      </div>
    </div>
  );
}

/* Call log */
function CallLogView({ line, log, d, lang }: { line: Line; log: Record<string, CallLogEntry[]>; d: any; lang: string }) {
  const [filter, setFilter] = useState("all");
  const calls = log[line.id] || [];
  const counts = {
    all: calls.length,
    connected: calls.filter((c) => c.status === "connected").length,
    missed: calls.filter((c) => c.status === "missed").length,
    voicemail: calls.filter((c) => c.status === "voicemail").length,
  };
  const shown = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const pills = [
    ["all", d.overview.viewAll],
    ["connected", d.sim.connected],
    ["missed", d.sim.noAnswer],
    ["voicemail", d.sim.voicemail],
  ];

  return (
    <div className="content-inner">
      <div className="logtools">
        <div className="filter-pills">
          {pills.map(([k, lbl]) => (
            <button
              key={k}
              className={`fpill ${filter === k ? "active" : ""}`}
              onClick={() => setFilter(k)}
            >
              {lbl} <span style={{ opacity: 0.7 }}>{counts[k as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div className="topbar-spacer"></div>
        <button className="btn btn-ghost btn-sm">
          <Icon name="download" /> {lang === "es" ? "Exportar CSV" : lang === "fr" ? "Exporter en CSV" : lang === "ja" ? "CSVエクスポート" : lang === "zh" ? "导出 CSV" : lang === "ar" ? "تصدير CSV" : lang === "hi" ? "सीएसवी निर्यात करें" : lang === "pt" ? "Exportar CSV" : lang === "de" ? "CSV exportieren" : lang === "it" ? "Esporta CSV" : lang === "ko" ? "CSV 내보내기" : "Export CSV"}
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.titles.log}</h2>
            <p>{d.titles.logSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          <div className="log">
            {shown.map((c) => {
              const m = STATUS_META[c.status as keyof typeof STATUS_META];
              return (
                <div className="logrow" key={c.id}>
                  <div className={`dir ${m.dirCls}`}>
                    <Icon
                      name={c.status === "voicemail" ? "voicemail" : c.status === "missed" ? "alert" : "in"}
                    />
                  </div>
                  <div className="who">
                    <b>{c.caller === "Unknown" ? (lang === "es" ? "Desconocido" : lang === "fr" ? "Inconnu" : lang === "ja" ? "不明" : lang === "zh" ? "未知" : lang === "ar" ? "مجهول" : lang === "hi" ? "अज्ञात" : lang === "pt" ? "Desconhecido" : lang === "de" ? "Unbekannt" : lang === "it" ? "Sconosciuto" : lang === "ko" ? "알 수 없음" : "Unknown") :
                        c.caller.replace("(mobile)", lang === "es" ? "(móvil)" : lang === "fr" ? "(portable)" : lang === "ja" ? "(携帯電話)" : lang === "zh" ? "(手机)" : lang === "ar" ? "(هاتف محمول)" : lang === "hi" ? "(मोबाइल)" : lang === "pt" ? "(celular)" : lang === "de" ? "(Mobiltelefon)" : lang === "it" ? "(cellulare)" : lang === "ko" ? "(휴대전화)" : "(mobile)")}</b>
                    <span>{c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}</span>
                  </div>
                  <div className="routed">
                    <b>{c.routed === "No one available" ? (lang === "es" ? "Nadie disponible" : lang === "fr" ? "Personne de disponible" : lang === "ja" ? "対応者なし" : lang === "zh" ? "无人可用" : lang === "ar" ? "لا أحد متاح" : lang === "hi" ? "कोई उपलब्ध नहीं" : lang === "pt" ? "Ninguém disponível" : lang === "de" ? "Niemand verfügbar" : lang === "it" ? "Nessuno disponibile" : lang === "ko" ? "연결 가능 도우미 없음" : "No one available") : c.routed}</b>
                    {c.rel === "Daughter" ? (lang === "es" ? "Hija" : lang === "fr" ? "Fille" : lang === "ja" ? "娘" : lang === "zh" ? "女儿" : lang === "ar" ? "ابنة" : lang === "hi" ? "बेटी" : lang === "pt" ? "Filha" : lang === "de" ? "Tochter" : lang === "it" ? "Figlia" : lang === "ko" ? "딸" : "Daughter") :
                     c.rel === "Son" ? (lang === "es" ? "Hijo" : lang === "fr" ? "Fils" : lang === "ja" ? "息子" : lang === "zh" ? "儿子" : lang === "ar" ? "ابن" : lang === "hi" ? "बेटा" : lang === "pt" ? "Filho" : lang === "de" ? "Sohn" : lang === "it" ? "Figlio" : lang === "ko" ? "아들" : "Son") :
                     c.rel === "Daytime caregiver" ? (lang === "es" ? "Cuidador diurno" : lang === "fr" ? "Aidant de jour" : lang === "ja" ? "日中介護者" : lang === "zh" ? "日间看护" : lang === "ar" ? "مقدم الرعاية النهارية" : lang === "hi" ? "डेकेयरर" : lang === "pt" ? "Cuidador diurno" : lang === "de" ? "Tagespfleger" : lang === "it" ? "Caregiver diurno" : lang === "ko" ? "주간 보호자" : "Daytime caregiver") :
                     c.rel === "Primary caregiver" ? (lang === "es" ? "Cuidador principal" : lang === "fr" ? "Aidant principal" : lang === "ja" ? "主な介護者" : lang === "zh" ? "主要看护人" : lang === "ar" ? "مقدم الرعاية الرئيسي" : lang === "hi" ? "मुख्य केयरटेकर" : lang === "pt" ? "Cuidador principal" : lang === "de" ? "Hauptbetreuer" : lang === "it" ? "Caregiver principale" : lang === "ko" ? "주 보호자" : "Primary caregiver") :
                     c.rel === "Family member" ? (lang === "es" ? "Miembro de la familia" : lang === "fr" ? "Membre de la famille" : lang === "ja" ? "家族メンバー" : lang === "zh" ? "家庭成员" : lang === "ar" ? "أحد أفراد العائلة" : lang === "hi" ? "परिवार का सदस्य" : lang === "pt" ? "Membro da família" : lang === "de" ? "Familienmitglied" : lang === "it" ? "Familiare" : lang === "ko" ? "가족 구성원" : "Family member") :
                     c.rel === "Primary physician" ? (lang === "es" ? "Médico de cabecera" : lang === "fr" ? "Médecin traitant" : lang === "ja" ? "主治医" : lang === "zh" ? "主治医生" : lang === "ar" ? "الطبيب المعالج" : lang === "hi" ? "प्राथमिक चिकित्सक" : lang === "pt" ? "Médico de família" : lang === "de" ? "Hausarzt" : lang === "it" ? "Medico curante" : lang === "ko" ? "주치의" : "Primary physician") :
                     c.rel === "Voicemail left" ? (lang === "es" ? "Buzón de voz grabado" : lang === "fr" ? "Message vocal laissé" : lang === "ja" ? "留守番電話保存" : lang === "zh" ? "已留语音留言" : lang === "ar" ? "تم ترك بريد صوتي" : lang === "hi" ? "वॉयसमेल छोड़ा गया" : lang === "pt" ? "Mensagem de voz deixada" : lang === "de" ? "Mailbox-Nachricht hinterlassen" : lang === "it" ? "Messaggio in segreteria" : lang === "ko" ? "음성 사서함에 녹음됨" : "Voicemail left") :
                     c.rel}
                  </div>
                  <div className="dur">{c.dur}</div>
                  <div style={{ textAlign: "right" }}>
                    <Badge kind={m.badge.replace("badge-", "")}>
                      {c.status === "voicemail" ? d.sim.voicemail : c.status === "missed" ? d.sim.noAnswer : d.sim.connected}
                    </Badge>
                    <div className="when" style={{ marginTop: 5 }}>
                      {c.when.replace("Today", lang === "es" ? "Hoy" : lang === "fr" ? "Aujourd'hui" : lang === "ja" ? "今日" : lang === "zh" ? "今天" : lang === "ar" ? "اليوم" : lang === "hi" ? "오늘" : lang === "pt" ? "Hoje" : lang === "de" ? "Heute" : lang === "it" ? "Oggi" : lang === "ko" ? "오늘" : "Today")
                              .replace("Yesterday", lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "अकल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday")
                              .replace("Mon", lang === "es" ? "Lun" : lang === "fr" ? "Lun" : lang === "ja" ? "月" : lang === "zh" ? "周一" : lang === "ar" ? "الإثنين" : lang === "hi" ? "सोम" : lang === "pt" ? "Seg" : lang === "de" ? "Mon" : lang === "it" ? "Lun" : lang === "ko" ? "월" : "Mon")
                              .replace("Tue", lang === "es" ? "Mar" : lang === "fr" ? "Mar" : lang === "ja" ? "火" : lang === "zh" ? "周二" : lang === "ar" ? "الثلاثاء" : lang === "hi" ? "मंगल" : lang === "pt" ? "Ter" : lang === "de" ? "Tue" : lang === "it" ? "Mar" : lang === "ko" ? "화" : "Tue")
                              .replace("Wed", lang === "es" ? "Mié" : lang === "fr" ? "Mer" : lang === "ja" ? "水" : lang === "zh" ? "周三" : lang === "ar" ? "الأربعاء" : lang === "hi" ? "बुध" : lang === "pt" ? "Qua" : lang === "de" ? "Wed" : lang === "it" ? "Mer" : lang === "ko" ? "수" : "Wed")
                              .replace("Thu", lang === "es" ? "Jue" : lang === "fr" ? "Jeu" : lang === "ja" ? "木" : lang === "zh" ? "周四" : lang === "ar" ? "الخميس" : lang === "hi" ? "गुरु" : lang === "pt" ? "Qui" : lang === "de" ? "Thu" : lang === "it" ? "Gio" : lang === "ko" ? "목" : "Thu")
                              .replace("Fri", lang === "es" ? "Vie" : lang === "fr" ? "Ven" : lang === "ja" ? "金" : lang === "zh" ? "周五" : lang === "ar" ? "الجمعة" : lang === "hi" ? "शुक्र" : lang === "pt" ? "Sex" : lang === "de" ? "Fr" : lang === "it" ? "Ven" : lang === "ko" ? "금" : "Fri")
                              .replace("Sat", lang === "es" ? "Sáb" : lang === "fr" ? "Sam" : lang === "ja" ? "土" : lang === "zh" ? "周六" : lang === "ar" ? "السبت" : lang === "hi" ? "शनि" : lang === "pt" ? "Sáb" : lang === "de" ? "Sat" : lang === "it" ? "Sab" : lang === "ko" ? "토" : "Sat")
                              .replace("Sun", lang === "es" ? "Dom" : lang === "fr" ? "Dim" : lang === "ja" ? "日" : lang === "zh" ? "周日" : lang === "ar" ? "الأحد" : lang === "hi" ? "रवि" : lang === "pt" ? "Dom" : lang === "de" ? "So" : lang === "it" ? "Dom" : lang === "ko" ? "일" : "Sun")}
                    </div>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "var(--ink-faint)",
                  fontSize: "0.9rem",
                }}
              >
                {lang === "es" ? `No hay llamadas de tipo "${filter}" en esta línea.` :
                 lang === "fr" ? `Aucun appel de type "${filter}" sur cette ligne.` :
                 lang === "ja" ? `この回線には「${filter}」の通話はありません。` :
                 lang === "zh" ? `此线路暂无“${filter}”类型通话。` :
                 lang === "ar" ? `لا توجد مكالمات من فئة "${filter}" على هذا الخط.` :
                 lang === "hi" ? `इस लाइन पर कोई "${filter}" कॉल नहीं है।` :
                 lang === "pt" ? `Nenhuma chamada do tipo "${filter}" nesta linha.` :
                 lang === "de" ? `Keine Anrufe des Typs „${filter}“ auf dieser Leitung.` :
                 lang === "it" ? `Nessuna chiamata di tipo "${filter}" su questa linea.` :
                 lang === "ko" ? `이 회선에 "${filter}" 통화 내역이 없습니다.` :
                 `No ${filter} calls on this line.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Greetings & alerts */
function SettingsView({
  line,
  setLine,
  showToast,
  d,
  lang,
  preferredName,
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
  d: any;
  lang: string;
  preferredName: string;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const s = line.settings || {};
  const set = (patch: Partial<NonNullable<Line["settings"]>>) =>
    setLine((prev) =>
      prev.map((l) =>
        l.id === line.id ? { ...l, settings: { ...(l.settings || {}), ...patch } } : l
      )
    );

  const greeting =
    s.greeting ??
    `Hi, you've reached ${line.person.split(" · ")[0]}. ${
      line.mode === "menu"
        ? "Please choose who you'd like to reach."
        : "Hold on while we connect you."
    }`;
  const bilingual = s.bilingual ?? true;
  const language2 = s.language2 ?? "Spanish";
  const notifSMS = s.notifSMS ?? true;
  const notifEmail = s.notifEmail ?? true;
  const notifMissed = s.notifMissed ?? true;
  const notifWeekly = s.notifWeekly ?? false;

  return (
    <div className="content-inner">
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>{d.settings.greetingVoicemail}</h2>
            <p>{d.settings.ttsGreetingSub}</p>
          </div>
        </div>
        <div className="card-pad">
          <div className="field">
            <label>{d.settings.ttsGreeting}</label>
            <textarea
              rows={3}
              value={greeting}
              onChange={(e) => set({ greeting: e.target.value })}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
            />
          </div>
          <div className="set-row" style={{ paddingTop: 4 }}>
            <div className="txt">
              <b>{d.settings.bilingualSupport}</b>
              <p>
                {d.settings.bilingualSupportSub}
              </p>
            </div>
            <Toggle
              on={bilingual}
              onChange={(v) => set({ bilingual: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          {bilingual && (
            <div className="field" style={{ marginTop: 16, marginBottom: 0, maxWidth: 260 }}>
              <label>{d.settings.secondLang}</label>
              <select value={language2} onChange={(e) => set({ language2: e.target.value })}>
                {[
                  { id: "Spanish", label: lang === "es" ? "Español" : lang === "fr" ? "Espagnol" : lang === "ja" ? "スペイン語" : lang === "zh" ? "西班牙语" : lang === "ar" ? "الإسبانية" : lang === "hi" ? "स्पैनिश" : lang === "pt" ? "Espanhol" : lang === "de" ? "Spanisch" : lang === "it" ? "Spagnolo" : lang === "ko" ? "스페인어" : "Spanish" },
                  { id: "Mandarin", label: lang === "es" ? "Mandarín" : lang === "fr" ? "Mandarin" : lang === "ja" ? "中国語" : lang === "zh" ? "中文（普通话）" : lang === "ar" ? "الماندرين" : lang === "hi" ? "मंदारिन" : lang === "pt" ? "Mandarim" : lang === "de" ? "Mandarin" : lang === "it" ? "Mandarino" : lang === "ko" ? "중국어" : "Mandarin" },
                  { id: "Tagalog", label: lang === "es" ? "Tagalo" : lang === "fr" ? "Tagalog" : lang === "ja" ? "タガログ語" : lang === "zh" ? "塔加路语" : lang === "ar" ? "التاغالوغية" : lang === "hi" ? "तागालोग" : lang === "pt" ? "Tagalo" : lang === "de" ? "Tagalog" : lang === "it" ? "Tagalog" : lang === "ko" ? "타갈로그어" : "Tagalog" },
                  { id: "Vietnamese", label: lang === "es" ? "Vietnamita" : lang === "fr" ? "Vietnamien" : lang === "ja" ? "ベトナム語" : lang === "zh" ? "越南语" : lang === "ar" ? "الفيتنامية" : lang === "hi" ? "वियतनामी" : lang === "pt" ? "Vietnamita" : lang === "de" ? "Vietnamesisch" : lang === "it" ? "Vietnamita" : lang === "ko" ? "베트남어" : "Vietnamese" },
                  { id: "French", label: lang === "es" ? "Francés" : lang === "fr" ? "Français" : lang === "ja" ? "フランス語" : lang === "zh" ? "法语" : lang === "ar" ? "الفرنسية" : lang === "hi" ? "फ़्रेंच" : lang === "pt" ? "Francês" : lang === "de" ? "Französisch" : lang === "it" ? "Francese" : lang === "ko" ? "프랑스어" : "French" },
                  { id: "Korean", label: lang === "es" ? "Coreano" : lang === "fr" ? "Coréen" : lang === "ja" ? "韓国語" : lang === "zh" ? "韩语" : lang === "ar" ? "الكورية" : lang === "hi" ? "कोरियाई" : lang === "pt" ? "Coreano" : lang === "de" ? "Koreanisch" : lang === "it" ? "Coreano" : lang === "ko" ? "한국어" : "Korean" }
                ].map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>{d.settings.notifications}</h2>
            <p>{d.settings.notificationsSub}</p>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4 }}>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.smsAlerts}</b>
              <p>{ext.smsAlertsDesc.replace("{name}", preferredName)}</p>
            </div>
            <Toggle
              on={notifSMS}
              onChange={(v) => set({ notifSMS: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.emailAlerts}</b>
              <p>{ext.emailAlertsDesc}</p>
            </div>
            <Toggle
              on={notifEmail}
              onChange={(v) => set({ notifEmail: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.missedAlerts}</b>
              <p>{ext.missedAlertsDesc}</p>
            </div>
            <Toggle
              on={notifMissed}
              onChange={(v) => set({ notifMissed: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>{d.settings.weeklyReports}</b>
              <p>{ext.weeklyReportsDesc}</p>
            </div>
            <Toggle
              on={notifWeekly}
              onChange={(v) => set({ notifWeekly: v })}
              labels={[
                lang === "es" ? "Apagado" : lang === "fr" ? "Désactivé" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Spento" : lang === "ko" ? "꺼짐" : "Off",
                lang === "es" ? "Encendido" : lang === "fr" ? "Activé" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "Acceso" : lang === "ko" ? "켜짐" : "On"
              ]}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
          <Icon name="check" /> {d.contacts.saveChanges}
        </button>
      </div>
    </div>
  );
}

/* Account & billing */
const ACCT_TABS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Login & security" },
  { id: "contact", label: "Contact info" },
  { id: "billing", label: "Payment & billing" },
];

export function AccountView({
  account,
  setAccount,
  showToast,
  tab,
  setTab,
  d,
  lang,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
  showToast: (msg: string) => void;
  tab: string;
  setTab: (t: string) => void;
  d: any;
  lang: string;
}) {
  const ext = dashboardExtraTranslations[lang as keyof typeof dashboardExtraTranslations] || dashboardExtraTranslations.en;
  const a = account;
  const set = (patch: Partial<Account>) => setAccount((prev) => ({ ...prev, ...patch }));

  const ACCT_TABS = [
    { id: "profile", label: d.account.profile },
    { id: "security", label: d.account.security },
    { id: "contact", label: d.account.contactInfo },
    { id: "billing", label: d.account.billing },
  ];

  const [pwd, setPwd] = useState({ cur: "", next: "", conf: "" });
  const savePwd = () => {
    if (!pwd.cur || !pwd.next) return showToast(ext.enterPasswordToast);
    if (pwd.next !== pwd.conf) return showToast(ext.passwordMismatchToast);
    setPwd({ cur: "", next: "", conf: "" });
    showToast(ext.passwordUpdatedToast);
  };

  return (
    <div className="content-inner">
      <div className="acct-tabs">
        {ACCT_TABS.map((t) => (
          <button
            key={t.id}
            className={`acct-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.profile}</h2>
              <p>{d.account.personalDetailsSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="acct-photo">
              <span className="big-ava" style={{ display: "grid", placeItems: "center" }}>
                {initials(a.name)}
              </span>
              <div className="pmeta">
                <b>{a.name}</b>
                <span>
                  {a.role === "Primary caregiver" ? ext.primaryCaregiver :
                   a.role === "Family member" ? ext.familyMember :
                   a.role === "Account administrator" ? ext.accountAdmin :
                   a.role === "Care coordinator" ? ext.careCoordinator :
                   a.role}
                </span>
                <div className="pacts">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => showToast(ext.photoToast)}
                  >
                    <Icon name="camera" /> {ext.changePhoto}
                  </button>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.contacts.fullName}</label>
                  <input value={a.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label>{d.account.prefName}</label>
                  <input value={a.preferred} onChange={(e) => set({ preferred: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{d.account.role}</label>
              <select value={a.role} onChange={(e) => set({ role: e.target.value })} style={{ maxWidth: 320 }}>
                {[
                  { id: "Primary caregiver", label: ext.primaryCaregiver },
                  { id: "Family member", label: ext.familyMember },
                  { id: "Account administrator", label: ext.accountAdmin },
                  { id: "Care coordinator", label: ext.careCoordinator },
                ].map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                <Icon name="check" /> {d.contacts.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "security" && (
        <>
          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.email}</h2>
                <p>{d.account.emailRecoverSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
                <label>{d.account.email}</label>
                <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => showToast(d.common.savedToast)}
                >
                  {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.security}</h2>
                <p>{d.account.strongPasswordSub}</p>
              </div>
            </div>
            <div className="card-pad">
              <div style={{ maxWidth: 420 }}>
                <div className="field">
                  <label>{lang === "es" ? "Contraseña actual" : lang === "fr" ? "Mot de passe actuel" : lang === "ja" ? "現在のパスワード" : lang === "zh" ? "当前密码" : lang === "ar" ? "كلمة المرور الحالية" : lang === "hi" ? "वर्तमान पासवर्ड" : lang === "pt" ? "Senha atual" : lang === "de" ? "Aktuelles Passwort" : lang === "it" ? "Password attuale" : lang === "ko" ? "현재 비밀번호" : "Current password"}</label>
                  <input
                    type="password"
                    value={pwd.cur}
                    onChange={(e) => setPwd({ ...pwd, cur: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field">
                  <label>{lang === "es" ? "Nueva contraseña" : lang === "fr" ? "Nouveau mot de passe" : lang === "ja" ? "新しいパスワード" : lang === "zh" ? "新密码" : lang === "ar" ? "كلمة المرور الجديدة" : lang === "hi" ? "नया पासवर्ड" : lang === "pt" ? "Nova senha" : lang === "de" ? "Neues Passwort" : lang === "it" ? "Nuova password" : lang === "ko" ? "새 비밀번호" : "New password"}</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>{lang === "es" ? "Confirmar nueva contraseña" : lang === "fr" ? "Confirmer le nouveau mot de passe" : lang === "ja" ? "新しいパスワードの確認" : lang === "zh" ? "确认新密码" : lang === "ar" ? "تأكيد كلمة المرور الجديدة" : lang === "hi" ? "नए पासवर्ड की पुष्टि करें" : lang === "pt" ? "Confirmar nova senha" : lang === "de" ? "Neues Passwort bestätigen" : lang === "it" ? "Conferma nuova password" : lang === "ko" ? "새 비밀번호 확인" : "Confirm new password"}</label>
                  <input
                    type="password"
                    value={pwd.conf}
                    onChange={(e) => setPwd({ ...pwd, conf: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button className="btn btn-primary" onClick={savePwd}>
                  <Icon name="lock" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.twoFactor}</h2>
                <p>{d.account.twoFactorSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="txt">
                  <b>{d.account.smsCodesTitle}</b>
                  <p>
                    {d.account.smsCodesDesc} ({a.phone})
                  </p>
                </div>
                <Toggle
                  on={a.twoFactor}
                  onChange={(v) => {
                    set({ twoFactor: v });
                    showToast(v ? (lang === "es" ? "Autenticación de dos factores activada" : lang === "fr" ? "Double authentification activée" : lang === "ja" ? "2段階認証を有効にしました" : lang === "zh" ? "双重验证已启用" : lang === "ar" ? "تم تفعيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण सक्षम" : lang === "pt" ? "Autenticação de dois fatores ativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung aktiviert" : lang === "it" ? "Autenticazione a due fattori abilitata" : lang === "ko" ? "2단계 인증이 활성화되었습니다" : "Two-factor enabled") : (lang === "es" ? "Autenticación de dos factores desactivada" : lang === "fr" ? "Double authentification désactivée" : lang === "ja" ? "2段階認証を无効にしました" : lang === "zh" ? "双重验证已禁用" : lang === "ar" ? "تم تعطيل التحقق بخطوتين" : lang === "hi" ? "दो-चरण प्रमाणीकरण अक्षम" : lang === "pt" ? "Autenticação de dois fatores desativada" : lang === "de" ? "Zwei-Faktor-Authentifizierung deaktiviert" : lang === "it" ? "Autenticazione a due fattori disabilitata" : lang === "ko" ? "2단계 인증이 비활성화되었습니다" : "Two-factor disabled"));
                  }}
                  labels={[lang === "es" ? "Off" : lang === "fr" ? "Off" : lang === "ja" ? "オフ" : lang === "zh" ? "关闭" : lang === "ar" ? "إيقاف" : lang === "hi" ? "बंद" : lang === "pt" ? "Desativado" : lang === "de" ? "Aus" : lang === "it" ? "Off" : lang === "ko" ? "꺼짐" : "Off", lang === "es" ? "On" : lang === "fr" ? "On" : lang === "ja" ? "オン" : lang === "zh" ? "开启" : lang === "ar" ? "تشغيل" : lang === "hi" ? "चालू" : lang === "pt" ? "Ativado" : lang === "de" ? "An" : lang === "it" ? "On" : lang === "ko" ? "켜짐" : "On"]}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>{ext.activeSessions}</h2>
                <p>{d.account.activeSessionsSub}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                { dev: "Chrome · MacBook Pro", loc: "Oakland, CA", last: d.common.activeNow, cur: true },
                { dev: "iCanCall app · iPhone 15", loc: "Oakland, CA", last: lang === "es" ? "Hace 2 horas" : lang === "fr" ? "Il y a 2 heures" : lang === "ja" ? "2時間前" : lang === "zh" ? "2小时前" : lang === "ar" ? "قبل ساعتين" : lang === "hi" ? "2 घंटे पहले" : lang === "pt" ? "Há 2 horas" : lang === "de" ? "Vor 2 Stunden" : lang === "it" ? "2 ore fa" : lang === "ko" ? "2시간 전" : "2 hours ago", cur: false },
                { dev: "Safari · iPad", loc: "Sacramento, CA", last: lang === "es" ? "Ayer" : lang === "fr" ? "Hier" : lang === "ja" ? "昨日" : lang === "zh" ? "昨天" : lang === "ar" ? "أمس" : lang === "hi" ? "कल" : lang === "pt" ? "Ontem" : lang === "de" ? "Gestern" : lang === "it" ? "Ieri" : lang === "ko" ? "어제" : "Yesterday", cur: false },
              ].map((s, i) => (
                <div className="session" key={i}>
                  <span className="sic">
                    <Icon name="device" />
                  </span>
                  <div className="sinfo">
                    <b>{s.dev}</b>
                    <span>
                      {s.loc} · {s.last}
                    </span>
                  </div>
                  {s.cur ? (
                    <Badge kind="green">{ext.thisDevice}</Badge>
                  ) : (
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => showToast(ext.deviceSignoutToast + s.dev)}
                    >
                      <Icon name="logout" /> {ext.signOut}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "contact" && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>{d.account.contactInfo}</h2>
              <p>{d.account.contactReachSub}</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.phone}</label>
                  <input value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label>{d.account.email}</label>
                  <input
                    type="email"
                    value={a.notifyEmail}
                    onChange={(e) => set({ notifyEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="field">
              <label>{ext.address}</label>
              <input value={a.address} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>{d.account.timezone}</label>
                  <select value={a.timezone} onChange={(e) => set({ timezone: e.target.value })}>
                    {[
                      { id: "Pacific (PT)", label: lang === "es" ? "Pacífico (PT)" : lang === "fr" ? "Pacifique (PT)" : lang === "ja" ? "太平洋標準時 (PT)" : lang === "zh" ? "太平洋时间 (PT)" : lang === "ar" ? "الهادئ (PT)" : lang === "hi" ? "पैसिफिक (PT)" : lang === "pt" ? "Pacífico (PT)" : lang === "de" ? "Pazifik (PT)" : lang === "it" ? "Pacifico (PT)" : lang === "ko" ? "태평양시 (PT)" : "Pacific (PT)" },
                      { id: "Mountain (MT)", label: lang === "es" ? "Montaña (MT)" : lang === "fr" ? "Rocheuses (MT)" : lang === "ja" ? "山岳部標準時 (MT)" : lang === "zh" ? "山地时间 (MT)" : lang === "ar" ? "الجبلي (MT)" : lang === "hi" ? "माउंटेन (MT)" : lang === "pt" ? "Montanha (MT)" : lang === "de" ? "Mountain (MT)" : lang === "it" ? "Montagne (MT)" : lang === "ko" ? "산악시 (MT)" : "Mountain (MT)" },
                      { id: "Central (CT)", label: lang === "es" ? "Central (CT)" : lang === "fr" ? "Centre (CT)" : lang === "ja" ? "中部標準時 (CT)" : lang === "zh" ? "中部时间 (CT)" : lang === "ar" ? "المركزي (CT)" : lang === "hi" ? "सेंट्रल (CT)" : lang === "pt" ? "Central (CT)" : lang === "de" ? "Zentralzeit (CT)" : lang === "it" ? "Centrale (CT)" : lang === "ko" ? "중부시 (CT)" : "Central (CT)" },
                      { id: "Eastern (ET)", label: lang === "es" ? "Este (ET)" : lang === "fr" ? "Est (ET)" : lang === "ja" ? "東部標準時 (ET)" : lang === "zh" ? "东部时间 (ET)" : lang === "ar" ? "الشرقي (ET)" : lang === "hi" ? "ईस्टर्न (ET)" : lang === "pt" ? "Leste (ET)" : lang === "de" ? "Ostküstenzeit (ET)" : lang === "it" ? "Orientale (ET)" : lang === "ko" ? "동부시 (ET)" : "Eastern (ET)" }
                    ].map((tz) => (
                      <option key={tz.id} value={tz.id}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>{d.account.language}</label>
                  <select value={a.language} onChange={(e) => set({ language: e.target.value })}>
                    {[
                      { id: "English", label: lang === "es" ? "Inglés" : lang === "fr" ? "Anglais" : lang === "ja" ? "英語" : lang === "zh" ? "英语" : lang === "ar" ? "الإنجليزية" : lang === "hi" ? "अंग्रेज़ी" : lang === "pt" ? "Inglês" : lang === "de" ? "Englisch" : lang === "it" ? "Inglese" : lang === "ko" ? "영어" : "English" },
                      { id: "Spanish", label: lang === "es" ? "Español" : lang === "fr" ? "Espagnol" : lang === "ja" ? "スペイン語" : lang === "zh" ? "西班牙语" : lang === "ar" ? "الإسبانية" : lang === "hi" ? "स्पैनिश" : lang === "pt" ? "Espanhol" : lang === "de" ? "Spanisch" : lang === "it" ? "Spagnolo" : lang === "ko" ? "스페인어" : "Spanish" },
                      { id: "Mandarin", label: lang === "es" ? "Mandarín" : lang === "fr" ? "Mandarin" : lang === "ja" ? "中国語" : lang === "zh" ? "中文（普通话）" : lang === "ar" ? "الماندرين" : lang === "hi" ? "मंदारिन" : lang === "pt" ? "Mandarim" : lang === "de" ? "Mandarin" : lang === "it" ? "Mandarino" : lang === "ko" ? "중국어" : "Mandarin" },
                      { id: "Tagalog", label: lang === "es" ? "Tagalo" : lang === "fr" ? "Tagalog" : lang === "ja" ? "タガログ語" : lang === "zh" ? "塔加路语" : lang === "ar" ? "التاغالوغية" : lang === "hi" ? "तागालोग" : lang === "pt" ? "Tagalo" : lang === "de" ? "Tagalog" : lang === "it" ? "Tagalog" : lang === "ko" ? "타갈로그어" : "Tagalog" },
                      { id: "Vietnamese", label: lang === "es" ? "Vietnamita" : lang === "fr" ? "Vietnamien" : lang === "ja" ? "ベトナム語" : lang === "zh" ? "越南语" : lang === "ar" ? "الفيتنامية" : lang === "hi" ? "वियतनामी" : lang === "pt" ? "Vietnamita" : lang === "de" ? "Vietnamesisch" : lang === "it" ? "Vietnamita" : lang === "ko" ? "베트남어" : "Vietnamese" },
                      { id: "French", label: lang === "es" ? "Francés" : lang === "fr" ? "Français" : lang === "ja" ? "フランス語" : lang === "zh" ? "法语" : lang === "ar" ? "الفرنسية" : lang === "hi" ? "फ़्रेंच" : lang === "pt" ? "Francês" : lang === "de" ? "Französisch" : lang === "it" ? "Francese" : lang === "ko" ? "프랑스어" : "French" }
                    ].map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                <Icon name="check" /> {d.contacts.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "billing" && (
        <>
          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.billing}</h2>
                <p>{d.account.renewDateSub}</p>
              </div>
              <Badge kind="blue">Pro</Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  $19.99
                </span>
                <span style={{ color: "var(--ink-faint)" }}>{lang === "es" ? "/ mes" : lang === "fr" ? "/ mois" : lang === "ja" ? "/ 月" : lang === "zh" ? "/ 月" : lang === "ar" ? "/ شهر" : lang === "hi" ? "/ महीना" : lang === "/ mês" ? "/ mês" : lang === "de" ? "/ Monat" : lang === "it" ? "/ mese" : lang === "ko" ? "/ 월" : "/ month"}</span>
                <span style={{ marginLeft: 10 }}>
                  <Badge kind="green">{ext.saveAnnual}</Badge>
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px 24px",
                  marginTop: 18,
                }}
                className="feat-grid"
              >
                {d.account.billingFeatures.map((f: string) => (
                  <div className="plan-feat" key={f}>
                    <Icon name="check" /> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => showToast(ext.annualToast)}
                >
                  <Icon name="spark" /> {ext.switchToAnnual}
                </button>
                <button className="btn btn-ghost" onClick={() => showToast(ext.planOptionsToast)}>
                  {ext.changePlan}
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const ad = a.addons || { extraNumbers: 0, minuteBlocks: 0 };
            const setAd = (patch: Partial<Account["addons"]>) =>
              setAccount((prev) => ({ ...prev, addons: { ...(prev.addons || {}), ...patch } as Account["addons"] }));
            const numCost = ad.extraNumbers * 6.99;
            const minCost = ad.minuteBlocks * 4.99;
            const total = 19.99 + numCost + minCost;
            const maxBlocks = 10;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addOns}</h2>
                    <p>{d.account.addonsPlansSub}</p>
                  </div>
                </div>
                <div className="card-pad" style={{ paddingTop: 8 }}>
                  <div className="addon">
                    <span className="aic">
                      <Icon name="phone" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{d.account.addonNumbersTitle}</b>
                        <span className="price">{lang === "es" ? "$6.99 / mes c/u" : lang === "fr" ? "6,99 $ / mois chacun" : lang === "ja" ? "各 $6.99 / 月" : lang === "zh" ? "每个 $6.99 / 月" : lang === "ar" ? "$6.99 / شهرياً لكل رقم" : lang === "hi" ? "$6.99 / माह प्रत्येक" : lang === "pt" ? "$6.99 / mês cada" : lang === "de" ? "6,99 $ / Monat pro Nummer" : lang === "it" ? "6,99 $ / mese ciascuno" : lang === "ko" ? "개당 $6.99 / 월" : "$6.99 / mo each"}</span>
                      </div>
                      <p>
                        {d.account.addonNumbersDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="stepper">
                        <button
                          onClick={() => setAd({ extraNumbers: Math.max(0, ad.extraNumbers - 1) })}
                          disabled={ad.extraNumbers === 0}
                          aria-label="Remove one"
                        >
                          −
                        </button>
                        <span className="v">{ad.extraNumbers}</span>
                        <button
                          onClick={() => setAd({ extraNumbers: Math.min(8, ad.extraNumbers + 1) })}
                          disabled={ad.extraNumbers === 8}
                          aria-label="Add one"
                        >
                          +
                        </button>
                      </div>
                      <span className="sub">
                        {numCost > 0 ? `+$${numCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}` : lang === "es" ? "Incluido: plan base" : lang === "fr" ? "Inclus : forfait de base" : lang === "ja" ? "基本プランに含まれる" : lang === "zh" ? "包含在基础版中" : lang === "ar" ? "مشمول في الباقة الأساسية" : lang === "hi" ? "शामिल: बेस प्लान" : lang === "pt" ? "Incluído: plano básico" : lang === "de" ? "Inklusive: Basistarif" : lang === "it" ? "Incluso: piano base" : lang === "ko" ? "기본 제공: 기본 플랜" : "Included: base plan"}
                      </span>
                    </div>
                  </div>

                  <div className="addon">
                    <span className="aic">
                      <Icon name="clock" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>{ext.extraMinTitle}</b>
                        <span className="price">{ext.extraMinPrice}</span>
                      </div>
                      <p>
                        {ext.extraMinDesc}
                      </p>
                    </div>
                    <div className="actl">
                      <div className="rangewrap">
                        <input
                          type="range"
                          className="rng"
                          min={0}
                          max={maxBlocks}
                          step={1}
                          value={ad.minuteBlocks}
                          style={{ "--pct": `${(ad.minuteBlocks / maxBlocks) * 100}%` } as React.CSSProperties}
                          onChange={(e) => setAd({ minuteBlocks: Number(e.target.value) })}
                        />
                      </div>
                      <span className="sub">
                        {ad.minuteBlocks * 30} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"} · {minCost > 0 ? `+$${minCost.toFixed(2)}/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}` : `$0.00/${lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}`}
                      </span>
                    </div>
                  </div>

                  <div className="addon-total">
                    <span className="lbl">
                      {ext.newMonthlyTotal} <b>{ext.planAndAddons}</b>
                    </span>
                    <span className="big">
                      ${total.toFixed(2)}
                      <span> / {lang === "es" ? "mes" : lang === "fr" ? "mois" : lang === "ja" ? "月" : lang === "zh" ? "月" : lang === "ar" ? "شهر" : lang === "hi" ? "माह" : lang === "pt" ? "mês" : lang === "de" ? "Monat" : lang === "it" ? "mese" : lang === "ko" ? "월" : "mo"}</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => showToast(ext.addonsUpdatedToast)}>
                      <Icon name="check" /> {ext.saveAddons}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {(() => {
            const ad = a.addons || {};
            const purchased = (ad.minuteBlocks || 0) * 30;
            const rollover = ad.rolloverMin || 0;
            const total = purchased + rollover;
            const used = Math.min(ad.usedMin || 0, total);
            const remaining = Math.max(0, total - used);
            const pct = total > 0 ? Math.round((used / total) * 100) : 0;
            const low = total > 0 && remaining <= total * 0.15;
            return (
              <div className="card section-gap">
                <div className="card-head">
                  <div>
                    <h2>{ext.addonMinutesTitle}</h2>
                    <p>{ext.addonMinutesDesc}</p>
                  </div>
                  {total > 0 && <Badge kind={low ? "amber" : "green"}>{low ? ext.runningLow : ext.rollsOver}</Badge>}
                </div>
                <div className="card-pad">
                  {total === 0 ? (
                    <div className="mb-empty">
                      <span className="ic">
                        <Icon name="clock" />
                      </span>
                      <div>
                        <b>{ext.noAddonMinYet}</b>
                        <p>
                          {ext.noAddonMinDesc}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-top">
                        <div className="big">
                          {remaining}
                          <span> {ext.minRemaining}</span>
                        </div>
                        <div className="mb-meta">
                          {used} {lang === "es" ? "de" : lang === "fr" ? "sur" : lang === "ja" ? "の" : lang === "zh" ? "共" : lang === "ar" ? "من" : lang === "hi" ? "कुल" : lang === "pt" ? "de" : lang === "de" ? "von" : lang === "it" ? "di" : lang === "ko" ? "중" : "of"} {total} {ext.addonMinUsed} &middot; {lang === "es" ? "renueva el 1 de junio de 2026" : lang === "fr" ? "renouvellement le 1er juin 2026" : lang === "ja" ? "2026年6月1日に更新" : lang === "zh" ? "于 2026年6月1日续期" : lang === "ar" ? "يتجدد في 1 يونيو 2026" : lang === "hi" ? "1 जून, 2026 को नवीनीकृत होगा" : lang === "pt" ? "renova em 1 de junho de 2026" : lang === "de" ? "verlängert sich am 1. Juni 2026" : lang === "it" ? "si rinnova il 1 giugno 2026" : lang === "ko" ? "2026년 6월 1일에 갱신 예정" : "renews June 1, 2026"}
                        </div>
                      </div>
                      <div className="usage-bar bigbar" style={{ marginTop: 14 }}>
                        <i className={low ? "warn" : ""} style={{ width: pct + "%" }} />
                      </div>
                      <div className="mb-stats">
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="plus" />
                          </span>
                          <div>
                            <b>{purchased} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>
                              {ext.thisCycleTopup}
                              {ad.minuteBlocks ? ` · ${ad.minuteBlocks} × 30 ${lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="refresh" />
                          </span>
                          <div>
                            <b>{rollover} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.rolledOverFromLast}</span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="phone" />
                          </span>
                          <div>
                            <b>{used} {lang === "es" ? "min" : lang === "fr" ? "min" : lang === "ja" ? "分" : lang === "zh" ? "分钟" : lang === "ar" ? "دقيقة" : lang === "hi" ? "मिनट" : lang === "pt" ? "min" : lang === "de" ? "Min" : lang === "it" ? "min" : lang === "ko" ? "분" : "min"}</b>
                            <span>{ext.usedThisCycle}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mb-note">
                        <Icon name="check" /> {ext.addonMinNote}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{d.account.paymentMethod}</h2>
                <p>{ext.chargedOnFirst}</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="card-on-file">
                <span className="card-brand">{a.card.brand.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="cnum">•••• •••• •••• {a.card.last4}</div>
                  <div className="cexp">{lang === "es" ? "Vence" : lang === "fr" ? "Expire le" : lang === "ja" ? "有効期限" : lang === "zh" ? "有效期至" : lang === "ar" ? "تنتهي في" : lang === "hi" ? "समाप्ति तिथि" : lang === "pt" ? "Expira em" : lang === "de" ? "Gültig bis" : lang === "it" ? "Scade il" : lang === "ko" ? "만료일" : "Expires"} {a.card.exp}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => showToast(lang === "es" ? "Abriendo el formulario de tarjeta seguro…" : lang === "fr" ? "Ouverture du formulaire de carte sécurisé…" : lang === "ja" ? "セキュアなカード入力フォームを開いています…" : lang === "zh" ? "正在打开安全信用卡表单…" : lang === "ar" ? "جاري فتح نموذج البطاقة الآمن…" : lang === "hi" ? "सुरक्षित कार्ड फ़ॉर्म खोला जा रहा है…" : lang === "pt" ? "Abrindo formulário seguro de cartão…" : lang === "de" ? "Sicheres Kartenformular wird geöffnet…" : lang === "it" ? "Apertura del modulo sicuro della carta…" : lang === "ko" ? "보안 카드 양식을 여는 중…" : "Opening secure card form…")}
                >
                  <Icon name="card" /> {ext.updateCard}
                </button>
              </div>
              <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
                <label>{d.account.billingAddress}</label>
                <input value={a.billingAddr} onChange={(e) => set({ billingAddr: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast(d.common.savedToast)}>
                  <Icon name="check" /> {d.contacts.saveChanges}
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>{ext.billingHistory}</h2>
                <p>{lang === "es" ? "Visa terminada en" : lang === "fr" ? "Visa se terminant par" : lang === "ja" ? "末尾が" : lang === "zh" ? "末尾为" : lang === "ar" ? "بطاقة Visa التي تنتهي بـ" : lang === "hi" ? "वीजा अंत" : lang === "pt" ? "Visa terminando em" : lang === "de" ? "Visa mit der Endung" : lang === "it" ? "Visa che termina con" : lang === "ko" ? "끝자리" : "Visa ending"} {a.card.last4}{lang === "ja" ? "のVisa" : lang === "ko" ? "인 Visa" : ""}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                [lang === "es" ? "1 de mayo de 2026" : lang === "fr" ? "1 mai 2026" : lang === "ja" ? "2026年5月1日" : lang === "zh" ? "2026年5月1日" : lang === "ar" ? "1 مايو 2026" : lang === "hi" ? "1 मई, 2026" : lang === "pt" ? "1 de maio de 2026" : lang === "de" ? "1. Mai 2026" : lang === "it" ? "1 maggio 2026" : lang === "ko" ? "2026년 5월 1일" : "May 1, 2026", "Pro · monthly", "$19.99"],
                [lang === "es" ? "1 de abr de 2026" : lang === "fr" ? "1 avr. 2026" : lang === "ja" ? "2026年4月1日" : lang === "zh" ? "2026年4月1日" : lang === "ar" ? "1 أبريل 2026" : lang === "hi" ? "1 अप्रैल, 2026" : lang === "pt" ? "1 de abr de 2026" : lang === "de" ? "1. Apr. 2026" : lang === "it" ? "1 aprile 2026" : lang === "ko" ? "2026년 4월 1일" : "Apr 1, 2026", "Pro · monthly", "$19.99"],
                [lang === "es" ? "1 de mar de 2026" : lang === "fr" ? "1 mars 2026" : lang === "ja" ? "2026年3月1日" : lang === "zh" ? "2026年3月1日" : lang === "ar" ? "1 مارس 2026" : lang === "hi" ? "1 मार्च, 2026" : lang === "pt" ? "1 de mar de 2026" : lang === "de" ? "1. März 2026" : lang === "it" ? "1 marzo 2026" : lang === "ko" ? "2026년 3월 1일" : "Mar 1, 2026", "Pro · monthly", "$19.99"],
              ].map(([dVal, desc, amt]) => {
                const localizedDesc = desc === "Pro · monthly" ? (lang === "es" ? "Pro · mensual" : lang === "fr" ? "Pro · mensuel" : lang === "ja" ? "プロ · 月額" : lang === "zh" ? "专业版 · 按月" : lang === "ar" ? "برو · شهرياً" : lang === "hi" ? "प्रो · मासिक" : lang === "pt" ? "Pro · mensal" : lang === "de" ? "Pro · monatlich" : lang === "it" ? "Pro · mensile" : lang === "ko" ? "프로 · 월간" : "Pro · monthly") : desc;
                return (
                  <div className="invoice" key={dVal}>
                    <div className="l">
                      <b>{dVal}</b>
                      <span>{localizedDesc}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span className="amt">{amt}</span>
                      <button className="btn btn-soft btn-sm" onClick={() => showToast(ext.downloadReceiptToast)}>
                        <Icon name="download" /> {ext.receipt}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head">
              <div>
                <h2>{ext.cancelSubscription}</h2>
                <p>{ext.cancelSubscriptionDesc}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <button
                className="btn btn-danger-ghost"
                onClick={() => showToast(ext.cancelToast)}
              >
                {ext.cancelPro}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============ MAIN APPLICATION SHELL ============ */
const NAV = [
  {
    group: "Manage",
    items: [
      { id: "overview", label: "Overview", icon: "overview" as keyof typeof ICONS },
      { id: "contacts", label: "Contacts", icon: "contacts" as keyof typeof ICONS },
      { id: "routing", label: "Routing", icon: "routing" as keyof typeof ICONS },
    ],
  },
  {
    group: "Activity",
    items: [{ id: "log", label: "Call log", icon: "log" as keyof typeof ICONS, badge: true }],
  },
  {
    group: "Configure",
    items: [
      { id: "settings", label: "Greetings & alerts", icon: "settings" as keyof typeof ICONS },
      { id: "account", label: "Account & billing", icon: "user" as keyof typeof ICONS },
    ],
  },
];

const TITLES = {
  overview: ["Overview", "Welcome back, Maria"],
  contacts: ["Contacts", "Manage who can be reached"],
  routing: ["Routing", "Choose how callers connect"],
  log: ["Call log", "Every call, including missed attempts"],
  settings: ["Greetings & alerts", "Greeting and notification settings"],
  account: ["Account", "Profile, security and billing"],
};

const LINE_SCOPED = {
  overview: false,
  contacts: true,
  routing: true,
  log: true,
  settings: true,
  account: false,
};

const SEED_CONTACT_DATA = [
  { first: "John", rel: "Son" },
  { first: "Sarah", rel: "Daughter" },
  { first: "Michael", rel: "Brother" },
  { first: "Emma", rel: "Sister" },
  { first: "David", rel: "Caregiver" },
  { first: "Dr. Amanda Chen", rel: "Primary Physician" },
  { first: "Neighbor Mark", rel: "Neighbor" },
  { first: "Elena", rel: "Niece" },
  { first: "Thomas", rel: "Nephew" },
];

function generateDynamicLines(accountData: any): Line[] {
  if (!accountData || !accountData.lines) return [];
  const ownerName = accountData.owner || accountData.name || "";
  const ownerLastName = ownerName ? (ownerName.split(" ").slice(-1)[0] || "") : "";
  const areaCode = accountData.area || "415";

  return accountData.lines.map((ln: any, idx: number) => {
    const slug = ln.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const count = typeof ln.contacts === "number" ? ln.contacts : 3;

    const contacts: Contact[] = Array.from({ length: count }).map((_, cIdx) => {
      const seed = SEED_CONTACT_DATA[cIdx % SEED_CONTACT_DATA.length];
      const name = seed.rel === "Son" || seed.rel === "Daughter" || seed.rel === "Brother" || seed.rel === "Sister" || seed.rel === "Niece" || seed.rel === "Nephew"
        ? `${seed.first} ${ownerLastName}`
        : seed.first;
      const indexStr = String(cIdx + 10).slice(-2);
      return {
        id: `c-${slug}-${cIdx}`,
        name,
        rel: seed.rel,
        phone: `(${areaCode}) 555-01${indexStr}`,
        color: AVATAR_COLORS[cIdx % AVATAR_COLORS.length],
        available: cIdx !== 2,
      };
    });

    return {
      id: slug,
      label: ln.label,
      person: ln.person,
      number: ln.number,
      color: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      mode: ln.mode || "cascade",
      minutesUsed: ln.minutesUsed || 0,
      contacts,
    };
  });
}

function generateDynamicLogs(linesList: Line[]): Record<string, CallLogEntry[]> {
  const result: Record<string, CallLogEntry[]> = {};
  const statusOptions: Array<"connected" | "missed" | "voicemail"> = ["connected", "connected", "voicemail", "missed"];
  const callerNames = ["Grandkid Leo", "Sunrise Pharmacy", "Utility Dept", "Dr. Anita Patel", "Mom (Eleanor)"];

  linesList.forEach((ln) => {
    const contacts = ln.contacts;
    const logs: CallLogEntry[] = Array.from({ length: 5 }).map((_, lIdx) => {
      const status = statusOptions[lIdx % statusOptions.length];
      const contact = contacts[lIdx % contacts.length];
      const caller = contact ? `${contact.name} (mobile)` : callerNames[lIdx % callerNames.length];
      const when = lIdx === 0 ? "Today · 2:48 PM" : lIdx === 1 ? "Today · 11:02 AM" : lIdx === 2 ? "Yesterday · 7:14 PM" : lIdx === 3 ? "Yesterday · 9:30 AM" : "Mon · 3:20 PM";
      return {
        id: lIdx + 1,
        status,
        caller,
        routed: status === "connected" ? (contact ? contact.name : ln.label) : "No one available",
        rel: status === "connected" ? (contact ? contact.rel : "Carrier") : "Voicemail left",
        dur: status === "connected" ? `${lIdx + 2}:${(lIdx * 12).toString().padStart(2, "0")}` : "—",
        when,
      };
    });
    result[ln.id] = logs;
  });

  return result;
}

export default function DashboardApp() {
  const [lines, setLines] = useState<Line[]>([
    {
      id: "mom",
      label: "Eleanor's line",
      person: "Eleanor Delgado · Mom",
      number: "(415) 555-0142",
      color: "oklch(0.6 0.14 350)",
      mode: "menu",
      minutesUsed: 38,
      contacts: [
        {
          id: "c1",
          name: "Maria Delgado",
          rel: "Daughter",
          phone: "(415) 555-0192",
          color: AVATAR_COLORS[0],
          available: true,
        },
        {
          id: "c2",
          name: "James Delgado",
          rel: "Son",
          phone: "(510) 555-0177",
          color: AVATAR_COLORS[1],
          available: true,
        },
        {
          id: "c3",
          name: "Dr. Anita Patel",
          rel: "Primary physician",
          phone: "(415) 555-0240",
          color: AVATAR_COLORS[2],
          available: false,
        },
        {
          id: "c4",
          name: "Sunrise Home Care",
          rel: "Daytime caregiver",
          phone: "(415) 555-0311",
          color: AVATAR_COLORS[3],
          available: true,
        },
        {
          id: "c5",
          name: "Lena Novak",
          rel: "Neighbor",
          phone: "(415) 555-0156",
          color: AVATAR_COLORS[4],
          available: true,
        },
      ],
    },
    {
      id: "dad",
      label: "Robert's line",
      person: "Robert Hale · Dad",
      number: "(415) 555-0188",
      color: "oklch(0.58 0.115 232)",
      mode: "cascade",
      minutesUsed: 11,
      contacts: [
        {
          id: "d1",
          name: "Maria Delgado",
          rel: "Daughter",
          phone: "(415) 555-0192",
          color: AVATAR_COLORS[0],
          available: true,
        },
        {
          id: "d2",
          name: "Carla Hale",
          rel: "Sister",
          phone: "(206) 555-0133",
          color: AVATAR_COLORS[5],
          available: true,
        },
        {
          id: "d3",
          name: "Dr. Sam Okafor",
          rel: "Cardiologist",
          phone: "(415) 555-0299",
          color: AVATAR_COLORS[2],
          available: true,
        },
      ],
    },
  ]);

  const [activeLineId, setActiveLineId] = useState("mom");
  const [log, setLog] = useState<Record<string, CallLogEntry[]>>({
    mom: [
      {
        id: 1,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "4:12",
        when: "Today · 2:48 PM",
      },
      {
        id: 2,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Sunrise Home Care",
        rel: "Daytime caregiver",
        dur: "1:05",
        when: "Today · 9:30 AM",
      },
      {
        id: 3,
        status: "voicemail",
        caller: "Unknown",
        routed: "No one available",
        rel: "Voicemail left",
        dur: "0:38",
        when: "Yesterday · 7:14 PM",
      },
      {
        id: 4,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "James Delgado",
        rel: "Son",
        dur: "6:51",
        when: "Yesterday · 11:02 AM",
      },
      {
        id: 5,
        status: "missed",
        caller: "Eleanor (mobile)",
        routed: "Dr. Anita Patel",
        rel: "Primary physician",
        dur: "—",
        when: "Mon · 3:20 PM",
      },
      {
        id: 6,
        status: "connected",
        caller: "Eleanor (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "2:44",
        when: "Mon · 8:55 AM",
      },
      {
        id: 7,
        status: "connected",
        caller: "Lena Novak",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "3:30",
        when: "Sun · 5:41 PM",
      },
    ],
    dad: [
      {
        id: 1,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "5:20",
        when: "Today · 1:12 PM",
      },
      {
        id: 2,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Dr. Sam Okafor",
        rel: "Cardiologist",
        dur: "2:08",
        when: "Yesterday · 10:30 AM",
      },
      {
        id: 3,
        status: "missed",
        caller: "Robert (mobile)",
        routed: "Carla Hale",
        rel: "Sister",
        dur: "—",
        when: "Wed · 6:02 PM",
      },
      {
        id: 4,
        status: "connected",
        caller: "Robert (mobile)",
        routed: "Maria Delgado",
        rel: "Daughter",
        dur: "1:47",
        when: "Tue · 9:18 AM",
      },
    ],
  });

  const [view, setView] = useState("overview");
  const [activeVoicemail, setActiveVoicemail] = useState<{
    recordingUrl: string;
    transcription: string;
    caller: string;
    duration: string;
  } | null>(null);

  const [impersonatingUser, setImpersonatingUser] = useState<{ email: string; name: string } | null>(null);
  const [acctTab, setAcctTab] = useState("profile");
  const [account, setAccount] = useState<Account>({
    name: "Maria Delgado",
    preferred: "Maria",
    role: "Primary caregiver",
    email: "maria.delgado@email.com",
    notifyEmail: "maria.delgado@email.com",
    phone: "(415) 555-0192",
    address: "482 Linden Ave, Oakland, CA 94607",
    timezone: "Pacific (PT)",
    language: "English",
    twoFactor: true,
    card: { brand: "Visa", last4: "4242", exp: "08 / 27" },
    billingAddr: "482 Linden Ave, Oakland, CA 94607",
    addons: { extraNumbers: 1, minuteBlocks: 2, usedMin: 41, rolloverMin: 18 },
  });

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

  useEffect(() => {
    const syncLang = () => {
      const savedLang = localStorage.getItem("lang") as any;
      const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
      if (validLangs.includes(savedLang)) {
        setLang(savedLang);
      }
    };
    window.addEventListener("storage", syncLang);
    return () => window.removeEventListener("storage", syncLang);
  }, []);

  const changeLanguage = (newLang: "en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko") => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    window.dispatchEvent(new Event("storage"));
  };

  const d = dashboardTranslations[lang];

  const NAV = [
    {
      group: d.nav.manage,
      items: [
        { id: "overview", label: d.nav.overview, icon: "overview" as keyof typeof ICONS },
        { id: "contacts", label: d.nav.contacts, icon: "contacts" as keyof typeof ICONS },
        { id: "routing", label: d.nav.routing, icon: "routing" as keyof typeof ICONS },
      ],
    },
    {
      group: d.nav.activity,
      items: [{ id: "log", label: d.nav.log, icon: "log" as keyof typeof ICONS, badge: true }],
    },
    {
      group: d.nav.configure,
      items: [
        { id: "settings", label: d.nav.settings, icon: "settings" as keyof typeof ICONS },
        { id: "account", label: d.nav.account, icon: "user" as keyof typeof ICONS },
      ],
    },
  ];

  const TITLES = {
    overview: [d.titles.overview, `${d.titles.overviewSub}, ${account.preferred}`],
    contacts: [d.titles.contacts, d.titles.contactsSub],
    routing: [d.titles.routing, d.titles.routingSub],
    log: [d.titles.log, d.titles.logSub],
    settings: [d.titles.settings, d.titles.settingsSub],
    account: [d.titles.account, d.titles.accountSub],
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isLoggedIn") !== "true") {
        window.location.href = "/login";
        return;
      }

      // Check if session is impersonated
      const imp = localStorage.getItem("impersonatingUser");
      if (imp) {
        try {
          const userObj = JSON.parse(imp);
          const ownerName = userObj.owner || userObj.name || "Test User";
          const ownerEmail = userObj.email || "";
          setImpersonatingUser({ name: ownerName, email: ownerEmail });
          setAccount((prev) => ({
            ...prev,
            name: ownerName,
            preferred: ownerName.split(" ")[0] || ownerName,
            email: ownerEmail,
            notifyEmail: ownerEmail,
          }));

          if (userObj.lines && userObj.lines.length > 0) {
            const generatedLines = generateDynamicLines(userObj);
            setLines(generatedLines);
            if (generatedLines[0]) {
              setActiveLineId(generatedLines[0].id);
            }
            const generatedLogs = generateDynamicLogs(generatedLines);
            setLog(generatedLogs);
          }
        } catch (e) {
          console.error(e);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      const recordingUrl = params.get("recordingUrl");
      const transcription = params.get("transcription");
      const caller = params.get("caller");
      const duration = params.get("duration");

      if (viewParam) {
        setView(viewParam);
      }
      if (recordingUrl) {
        setActiveVoicemail({
          recordingUrl,
          transcription: transcription || "No transcript available.",
          caller: caller || "Unknown Caller",
          duration: duration || "0:30",
        });
      }
    }
  }, []);

  const handleStopImpersonating = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("impersonatingUser");
      if (localStorage.getItem("isAdminLoggedIn") === "true") {
        window.location.href = "/super-admin";
      } else {
        localStorage.removeItem("isLoggedIn");
        window.location.href = "/login";
      }
    }
  };

  const [toast, setToast] = useState<string | null>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const line = lines.find((l) => l.id === activeLineId) || lines[0];

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const missedCount = (log[activeLineId] || []).filter((c) => c.status !== "connected").length;
  const go = (v: string) => {
    setView(v);
    setSideOpen(false);
  };

  const signOut = () => {
    showToast("Signing out…");
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("impersonatingUser");
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 750);
  };

  const [t1, t2] = TITLES[view as keyof typeof TITLES] || ["Dashboard", "iCanCall Routing Panel"];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {impersonatingUser && (
        <div style={{ background: "oklch(0.35 0.08 28)", color: "#fff", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.88rem", zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flex: "none" }}>
          <div>
            ⚠️ Impersonation Mode: Active session for <strong>{impersonatingUser.name}</strong> ({impersonatingUser.email})
          </div>
          <button 
            onClick={handleStopImpersonating}
            className="btn btn-sm"
            style={{ 
              background: "oklch(0.58 0.115 232)", 
              color: "#fff",
              fontSize: "0.78rem", 
              padding: "5px 12px", 
              boxShadow: "none",
              border: "none",
              cursor: "pointer",
              borderRadius: "6px",
              fontWeight: 600
            }}
          >
            Exit Impersonation
          </button>
        </div>
      )}
      <div className="dash" style={{ flex: 1 }}>
      <aside className={`sidebar ${sideOpen ? "open" : ""}`}>
        <div className="brand" style={{ padding: "16px 20px 8px" }}>
          <svg
            id="logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 154.5652"
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <style>{`
              #logo .cls-1 { fill: var(--ink); }
              #logo .cls-2 { fill: var(--accent, #4083ae); }
            `}</style>
            <g>
              <path className="cls-1" d="M278.7879,47.1856c-2.504,0-4.6863-.8794-6.5415-2.6434-1.857-1.7623-2.7828-3.9892-2.7828-6.6809,0-2.6899.9258-4.9169,2.7828-6.6809,1.8552-1.7623,4.0375-2.6452,6.5415-2.6452,2.5058,0,4.6863.8829,6.5433,2.6452,1.8552,1.7641,2.7828,3.991,2.7828,6.6809,0,2.6917-.9276,4.9186-2.7828,6.6809-1.857,1.7641-4.0375,2.6434-6.5433,2.6434ZM278.7879,127.219c-2.5987,0-4.6166-.8347-6.0536-2.5058-1.4406-1.6693-2.1573-3.9875-2.1573-6.958v-51.0828c0-3.0616.7167-5.4048,2.1573-7.0294,1.437-1.6211,3.4548-2.4343,6.0536-2.4343,2.5969,0,4.6398.8132,6.1251,2.4343,1.4835,1.6247,2.227,3.9678,2.227,7.0294v51.0828c0,2.9705-.7203,5.2886-2.1573,6.958-1.4406,1.6711-3.5031,2.5058-6.1948,2.5058Z"/>
              <path className="cls-2" d="M351.4434,127.6372c-10.209.2788-18.9543-1.6711-26.2375-5.8463-7.285-4.1751-12.8739-9.9517-16.772-17.3296-3.8963-7.3762-5.8463-15.7032-5.8463-24.9829,0-6.8668,1.1135-13.2242,3.3405-19.0687,2.227-5.8463,5.428-10.9275,9.6049-15.2421,4.1751-4.3145,9.3011-7.655,15.3797-10.0214,6.0768-2.3664,12.9204-3.5496,20.5307-3.5496,6.7721,0,12.4575,1.1135,17.0508,3.3405,4.5916,2.227,8.327,4.6881,11.2046,7.378,1.6693,1.5782,2.7131,3.2011,3.1313,4.8704.4164,1.6711.3485,3.2261-.2091,4.6631-.5576,1.4406-1.4852,2.5755-2.7846,3.4102s-2.8525,1.1832-4.6613,1.0438c-1.8105-.1394-3.689-.9491-5.6371-2.4361-1.58-1.2046-3.2708-2.2949-5.0813-3.2708-1.8087-.9741-3.8749-1.739-6.193-2.2967-2.3217-.5558-5.0598-.8347-8.2126-.8347-4.6416,0-8.7935.8347-12.4575,2.5058-3.6657,1.6693-6.7506,3.991-9.2564,6.9597-2.504,2.9705-4.4075,6.3807-5.7068,10.2305-1.2994,3.8516-1.9482,7.9571-1.9482,12.3181,0,6.311,1.16,11.8998,3.4799,16.772,2.3181,4.8704,5.6586,8.6773,10.0214,11.4137,4.361,2.7381,9.6496,4.1054,15.8676,4.1054,3.5246,0,7.2386-.5094,11.1349-1.5317,3.8981-1.0188,7.1903-2.6899,9.882-5.0098,1.7623-1.5764,3.4799-2.4361,5.151-2.5755,1.6693-.1394,3.1313.2091,4.3842,1.0438s2.1787,1.9732,2.7828,3.4102c.6023,1.4406.7882,3.017.5576,4.7328-.2323,1.7176-1.092,3.319-2.5755,4.8025-2.1358,2.227-4.8954,4.1537-8.2823,5.7748-3.3869,1.6247-6.983,2.8776-10.7863,3.7587-3.8052.8811-7.4244,1.3673-10.856,1.462Z"/>
              <path className="cls-2" d="M417.9774,127.6372c-4.9204,0-9.117-1.0223-12.5969-3.0634-3.4799-2.0393-6.1483-4.7524-8.0035-8.1411-1.857-3.3869-2.7828-7.1206-2.7828-11.2046,0-3.8034,1.1582-7.26,3.4781-10.3699,2.3199-3.1081,5.3601-5.5889,9.117-7.4459,3.7587-1.8552,7.9106-2.8543,12.4575-2.9937,4.5451-.1394,9.0473.8597,13.5013,2.9937l6.4021,3.0616v9.3261l-6.8185-2.924c-3.714-1.5764-7.008-2.3664-9.8838-2.3664s-5.3119.5112-7.3065,1.5317c-1.9964,1.0223-3.5031,2.3664-4.5237,4.0357-1.0223,1.6711-1.5317,3.3887-1.5317,5.151,0,3.0616,1.067,5.5674,3.2011,7.5156s5.1027,2.9222,8.9079,2.9222c2.2288,0,4.3163-.3932,6.2645-1.1832,1.9482-.7864,3.6407-1.8999,5.0795-3.3405,1.4388-1.437,2.5523-3.1528,3.3405-5.1492.7882-1.9946,1.1832-4.1966,1.1832-6.6112v-16.7023c0-4.6398-1.1367-8.05-3.4102-10.2305-2.2734-2.1787-5.5907-3.2708-9.9517-3.2708-.9276,0-2.0876.1859-3.4799.5558-1.3905.3718-2.9919.9741-4.8007,1.8105-1.8105.8347-3.7372,1.9964-5.7765,3.4799-1.6711,1.2064-3.2261,1.7623-4.6631,1.6693-1.4406-.0912-2.6684-.5791-3.689-1.462-1.0223-.8794-1.7176-1.9696-2.0876-3.2708-.3718-1.2976-.3253-2.6649.1394-4.1054.4629-1.437,1.437-2.7149,2.9222-3.8284,2.5058-1.9482,5.1027-3.4781,7.7944-4.5916s5.2904-1.9017,7.7944-2.3664c2.5058-.4647,4.6398-.697,6.4039-.697,6.6809,0,12.1787,1.0438,16.4932,3.1313,4.3145,2.0894,7.5388,5.2439,9.6729,9.4655,2.134,4.2234,3.2028,9.5817,3.2028,16.0767v34.3787c0,2.4146-.697,4.3396-2.0894,5.7765-1.3905,1.437-3.3869,2.1573-5.9839,2.1573-1.7641,0-3.2493-.3021-4.4539-.9044-1.2082-.6023-2.1358-1.5067-2.7846-2.7149-.6506-1.2046-.9741-2.5969-.9741-4.1751v-5.0116h1.1135c-.6506,3.2493-1.9035,5.8248-3.7587,7.7265-1.857,1.9017-4.1984,3.2708-7.0277,4.1054-2.8329.8347-6.1948,1.2529-10.0911,1.2529Z"/>
              <path className="cls-2" d="M479.6356,127.3584c-2.7846,0-4.9883-.765-6.6112-2.2967-1.6247-1.5317-2.4361-3.7337-2.4361-6.6112v-52.6127c0-2.8758.8114-5.0563,2.4361-6.5415,1.6229-1.4835,3.7801-2.227,6.4718-2.227,2.6899,0,4.7077.7435,6.0554,2.227,1.344,1.4852,2.0179,3.6657,2.0179,6.5415v9.4637l-1.5317-3.4799c2.0411-4.9169,5.2207-8.6505,9.5352-11.2046,4.3145-2.5505,9.2082-3.8266,14.6844-3.8266,5.4727,0,9.9731,1.0223,13.5013,3.0616,3.5246,2.0429,6.1698,5.1278,7.9338,9.2564,1.7605,4.1304,2.6434,9.3494,2.6434,15.6585v33.6834c0,2.8776-.7435,5.0795-2.227,6.6112-1.4852,1.5317-3.6193,2.2967-6.4021,2.2967-2.7846,0-4.9419-.765-6.4718-2.2967-1.5317-1.5317-2.2967-3.7337-2.2967-6.6112v-32.8488c0-5.2886-.9991-9.1385-2.9937-11.5513-1.9964-2.4129-5.0795-3.6193-9.2546-3.6193-5.1045,0-9.1653,1.5996-12.1804,4.8007-3.0152,3.2028-4.5237,7.4477-4.5237,12.7363v30.4824c0,2.8776-.6738,5.0795-2.0179,6.6112-1.3458,1.5317-3.4566,2.2967-6.3324,2.2967Z"/>
              <path className="cls-1" d="M599.3363,127.6372c-10.209.2788-18.9543-1.6711-26.2375-5.8463-7.285-4.1751-12.8739-9.9517-16.772-17.3296-3.8963-7.3762-5.8463-15.7032-5.8463-24.9829,0-6.8668,1.1135-13.2242,3.3405-19.0687,2.227-5.8463,5.428-10.9275,9.6049-15.2421,4.1751-4.3145,9.3011-7.655,15.3797-10.0214,6.0768-2.3664,12.9204-3.5496,20.5307-3.5496,6.7721,0,12.4575,1.1135,17.0508,3.3405,4.5916,2.227,8.327,4.6881,11.2046,7.378,1.6693,1.5782,2.7131,3.2011,3.1313,4.8704.4164,1.6711.3485,3.2261-.2091,4.6631-.5576,1.4406-1.4852,2.5755-2.7846,3.4102s-2.8525,1.1832-4.6613,1.0438c-1.8105-.1394-3.689-.9491-5.6371-2.4361-1.58-1.2046-3.2708-2.2949-5.0813-3.2708-1.8087-.9741-3.8749-1.739-6.193-2.2967-2.3217-.5558-5.0598-.8347-8.2126-.8347-4.6416,0-8.7935.8347-12.4575,2.5058-3.6657,1.6693-6.7506,3.991-9.2564,6.9597-2.504,2.9705-4.4075,6.3807-5.7068,10.2305-1.2994,3.8516-1.9482,7.9571-1.9482,12.3181,0,6.311,1.16,11.8998,3.4799,16.772,2.3181,4.8704,5.6586,8.6773,10.0214,11.4137,4.361,2.7381,9.6496,4.1054,15.8676,4.1054,3.5246,0,7.2386-.5094,11.1349-1.5317,3.8981-1.0188,7.1903-2.6899,9.882-5.0098,1.7623-1.5764,3.4799-2.4361,5.151-2.5755,1.6693-.1394,3.1313.2091,4.3842,1.0438,1.2529.8347,2.1787,1.9732,2.7828,3.4102.6023,1.4406.7882,3.017.5576,4.7328-.2323,1.7176-1.092,3.319-2.5755,4.8025-2.1358,2.227-4.8954,4.1537-8.2823,5.7748-3.3869,1.6247-6.983,2.8776-10.7863,3.7587-3.8052.8811-7.4244,1.3673-10.856,1.462Z"/>
              <path className="cls-1" d="M665.8685,127.6372c-4.9204,0-9.117-1.0223-12.5969-3.0634-3.4799-2.0393-6.1483-4.7524-8.0035-8.1411-1.857-3.3869-2.7828-7.1206-2.7828-11.2046,0-3.8034,1.1582-7.26,3.4781-10.3699,2.3199-3.1081,5.3601-5.5889,9.117-7.4459,3.7587-1.8552,7.9106-2.8543,12.4575-2.9937,4.5451-.1394,9.0473.8597,13.5013,2.9937l6.4021,3.0616v9.3261l-6.8185-2.924c-3.714-1.5764-7.008-2.3664-9.8838-2.3664s-5.3119.5112-7.3065,1.5317c-1.9964,1.0223-3.5031,2.3664-4.5237,4.0357-1.0223,1.6711-1.5317,3.3887-1.5317,5.151,0,3.0616,1.067,5.5674,3.2011,7.5156,2.134,1.9482,5.1027,2.9222,8.9079,2.9222,2.2288,0,4.3163-.3932,6.2645-1.1832,1.9482-.7864,3.6407-1.8999,5.0795-3.3405,1.4388-1.437,2.5523-3.1528,3.3405-5.1492.7882-1.9946,1.1832-4.1966,1.1832-6.6112v-16.7023c0-4.6398-1.1367-8.05-3.4102-10.2305-2.2734-2.1787-5.5907-3.2708-9.9517-3.2708-.9276,0-2.0876.1859-3.4799.5558-1.3905.3718-2.9919.9741-4.8007,1.8105-1.8105.8347-3.7372,1.9964-5.7765,3.4799-1.6711,1.2064-3.2261,1.7623-4.6631,1.6693-1.4406-.0912-2.6684-.5791-3.689-1.462-1.0223-.8794-1.7176-1.9696-2.0876-3.2708-.3718-1.2976-.3253-2.6649.1394-4.1054.4629-1.437,1.437-2.7149,2.9222-3.8284,2.5058-1.9482,5.1027-3.4781,7.7944-4.5916s5.2904-1.9017,7.7944-2.3664c2.5058-.4647,4.6398-.697,6.4039-.697,6.6809,0,12.1787,1.0438,16.4932,3.1313,4.3145,2.0894,7.5388,5.2439,9.6729,9.4655,2.134,4.2234,3.2028,9.5817,3.2028,16.0767v34.3787c0,2.4146-.697,4.3396-2.0894,5.7765-1.3905,1.437-3.3869,2.1573-5.9839,2.1573-1.7641,0-3.2493-.3021-4.4539-.9044-1.2082-.6023-2.1358-1.5067-2.7846-2.7149-.6506-1.2046-.9741-2.5969-.9741-4.1751v-5.0116h1.1135c-.6506,3.2493-1.9035,5.8248-3.7587,7.7265-1.857,1.9017-4.1984,3.2708-7.0277,4.1054-2.8329.8347-6.1948,1.2529-10.0911,1.2529Z"/>
              <path className="cls-1" d="M744.0914,119.2852c0,1.2082-.2091,2.2967-.6256,3.2708-.4182.9741-1.0223,1.8338-1.8105,2.5755-.7882.7435-1.6944,1.2976-2.7131,1.6711-1.0223.3682-2.1823.5558-3.4799.5558-3.0616,0-5.6622-.3718-7.7944-1.1135-2.1358-.7417-3.8516-1.739-5.151-2.9919s-2.2967-2.6917-2.9919-4.3145-1.1617-3.3869-1.3923-5.2904c-.2323-1.8999-.3467-3.7801-.3467-5.6371V41.3411c0-2.8758.672-5.1724,2.0179-6.89,1.344-1.7158,3.4102-2.5755,6.193-2.5755,2.7846,0,4.8722.8597,6.2645,2.5755,1.3905,1.7176,2.0876,4.0143,2.0876,6.89v66.5304c0,1.2082.0214,2.2055.0697,2.9937.0447.7882.3235,1.3691.8347,1.739.5094.3718,1.3673.5576,2.5755.5576,1.4835,0,2.6899.3253,3.6175.9741.9276.6506,1.6014,1.4602,2.0196,2.4361.4164.9741.6256,1.8785.6256,2.7131Z"/>
              <path className="cls-1" d="M780,119.2852c0,1.2082-.2091,2.2967-.6256,3.2708-.4182.9741-1.0223,1.8338-1.8105,2.5755-.7882.7435-1.6944,1.2976-2.7131,1.6711-1.0223.3682-2.1823.5558-3.4799.5558-3.0616,0-5.6622-.3718-7.7944-1.1135-2.1358-.7417-3.8516-1.739-5.151-2.9919s-2.2967-2.6917-2.9919-4.3145-1.1617-3.3869-1.3923-5.2904c-.2323-1.8999-.3467-3.7801-.3467-5.6371V41.3411c0-2.8758.672-5.1724,2.0179-6.89,1.344-1.7158,3.4102-2.5755,6.193-2.5755,2.7846,0,4.8722.8597,6.2645,2.5755,1.3905,1.7176,2.0876,4.0143,2.0876,6.89v66.5304c0,1.2082.0214,2.2055.0697,2.9937.0447.7882.3235,1.3691.8347,1.739.5094.3718,1.3673.5576,2.5755.5576,1.4835,0,2.6899.3253,3.6175.9741.9276.6506,1.6014,1.4602,2.0196,2.4361.4164.9741.6256,1.8785.6256,2.7131Z"/>
            </g>
            <g>
              <path className="cls-1" d="M212.1483,66.9858l-.1196-.1795c-8.6726-12.9312-19.965-27.1303-32.7526-32.2381-1.4474-.6819-1.9379-1.3877-.6938-2.7274,1.3757-1.4115,3.1341-3.0982,4.0792-4.9644,5.8374-10.2397-2.261-23.6134-14.0197-22.9914-12.3331.2033-19.2713,14.8451-12.0221,24.6063,1.1603,1.8781,4.103,3.7562,4.5577,4.8806.2512.6579-.0718,1.0885-.7538,1.6149-6.3998,3.3374-11.7111,9.3545-17.728,13.7446-6.9619,5.1797-13.5292.1555-20.4314-3.6245-2.7394-1.3039-3.8518-2.3446-1.6629-5.2754,5.73-7.895-.3588-19.7257-10.3233-19.1396-7.1893.1675-12.6561,7.0218-11.424,14.0078.1914,1.244.5861,2.4642,1.1603,3.5767,1.0647,2.2609,3.3615,3.9834,3.3255,5.2753-.0958,1.6987-2.6795,2.548-4.7011,4.2705-7.345,5.706-13.3499,16.0892-23.1949,8.6846-1.3516-.8612-2.8109-1.8302-4.1748-2.6676-1.2919-.9091-2.4044-1.3517-2.5598-2.7394-.0599-1.3038,1.9377-3.1819,2.524-5.5146,2.2369-6.9022-4.5098-14.1034-11.5915-12.1656-5.3471,1.1484-8.6487,7.2013-6.9022,12.3809.5384,2.2609,3.0504,4.5816,3.505,5.73.4546,1.0048-.6938,1.7704-1.543,2.3326-16.4123,11.2923-33.614,51.5212-34.6904,78.4722-.1676,6.316,1.4594,20.3597,10.4071,17.9792,7.9907-3.9355,12.5963-13.0148,19.6778-18.7328,5.5147-5.1318,12.6681-7.3807,18.9123-2.0096,5.5743,4.115,11.0531,12.9312,19.0198,10.0243,6.3879-2.4164,10.9814-10.1799,17.2018-12.7518,12.7157-4.7849,20.1204,17.2735,32.9678,11.8666,11.6512-5.4069,20.3597-22.9675,36.7719-14.9767,11.9145,5.2395,22.0584,18.3979,33.8292,25.1565,6.1725,3.4571,13.7326,1.8542,18.1108-3.8877,14.7971-22.9435-3.5767-58.7225-14.7615-78.0176ZM152.3971,89.738c-4.4858-9.9406,3.3854-21.9866,14.3187-21.8191h.2272c8.9-.0718,16.3645,8.0146,15.5151,16.9026-1.3398,16.2687-23.6134,19.8573-30.0611,4.9165ZM96.2824,88.8408c-1.0049-7.0936,5.0121-13.8882,12.1415-13.8045h.2272c8.1942-.1316,14.4145,8.6846,11.5675,16.3763-4.2106,12.2852-22.441,10.3354-23.9363-2.5718ZM59.6898,104.8223c-12.6799-1.2202-12.0938-19.5582.6101-20.0248h.2392c13.6132.622,12.8235,20.5631-.8493,20.0248Z"/>
              <path className="cls-2" d="M186.0468,54.5331c-16.3404-14.6537-26.0656-5.395-38.3987,7.0696-5.036,4.8567-11.0531,7.3089-17.3811,3.5408-7.4644-4.5218-15.7542-12.8116-25.0847-8.0506-7.0338,3.3375-13.2303,13.0508-19.5703,16.3285-8.4213,4.2825-14.2349-6.2562-21.2567-8.7444-13.8762-4.8806-26.8313,26.2451-29.104,37.5135-1.0049,4.9882-2.7274,17.9793,5.1079,17.4409,6.603-1.3996,12.0219-8.0984,19.0797-8.6368,8.3855-1.5909,14.5699,6.663,21.4602,8.5889,10.2996,2.3326,15.9457-14.5939,28.4342-14.4743,8.6367-.4546,14.6418,7.2731,21.3645,11.4957,8.9239,5.5146,16.46-3.6006,24.4149-8.0027,21.5081-13.4336,43.6022,15.9457,51.2701-3.9715l.0837-.2512c4.5697-19.4386-8.5768-37.7408-20.4195-49.8466ZM59.6898,104.8223c-12.6799-1.2202-12.0938-19.5582.6101-20.0248h.2392c13.6132.622,12.8235,20.5631-.8493,20.0248ZM120.2187,91.4126c-4.2106,12.2852-22.441,10.3354-23.9363-2.5718-1.0049-7.0936,5.0121-13.8882,12.1415-13.8045h.2272c8.1942-.1316,14.4145,8.6846,11.5675,16.3763ZM182.4581,84.8214c-1.3398,16.2687-23.6134,19.8573-30.0611,4.9165-4.4858-9.9406,3.3854-21.9866,14.3187-21.8191h.2272c8.9-.0718,16.3645,8.0146,15.5151,16.9026Z"/>
            </g>
          </svg>
        </div>

        {NAV.map((grp) => (
          <React.Fragment key={grp.group}>
            <div className="nav-group-label">{grp.group}</div>
            <div className="nav">
              {grp.items.map((it) => (
                <button
                  key={it.id}
                  className={`nav-item ${view === it.id ? "active" : ""}`}
                  onClick={() => go(it.id)}
                >
                  <Icon name={it.icon} />
                  {it.label}
                  {(it as any).badge && missedCount > 0 && <span className="badge-dot">{missedCount}</span>}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}

        <div className="sidebar-foot">
          <div className="plan-card">
            <div className="row">
              <span className="pill">PRO PLAN</span>
              <span style={{ fontSize: "0.78rem", color: "oklch(0.82 0.02 225)" }}>
                {lines.length}/2 {d.common.numbers}
              </span>
            </div>
            <button
              className="upgrade"
              onClick={() => {
                setAcctTab("billing");
                go("account");
              }}
            >
              {d.common.managePlan}
            </button>
          </div>
          <button className="signout-row" onClick={signOut}>
            <Icon name="logout" style={{ width: 18, height: 18 }} /> {d.common.signOut}
          </button>
        </div>
      </aside>

      <div className={`scrim ${sideOpen ? "show" : ""}`} onClick={() => setSideOpen(false)}></div>

      <div className="main">
        <div className="topbar">
          <button
            className="iconbtn menu-btn"
            onClick={() => setSideOpen(true)}
            aria-label="Menu"
          >
            <Icon name="menu" />
          </button>
          <div className="page-title">
            <h1>{t1}</h1>
            <p>{LINE_SCOPED[view as keyof typeof LINE_SCOPED] ? line.label + " · " + line.person : t2}</p>
          </div>
          <div className="topbar-spacer"></div>

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
              marginRight: 12
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

          {/* number switcher */}
          <div className={`numswitch ${switchOpen ? "open" : ""}`}>
            <button className="numswitch-btn" onClick={() => setSwitchOpen((o) => !o)}>
              <span className="ava" style={{ background: line.color }}>
                {initials(line.person)}
              </span>
              <span className="meta">
                <b>{line.label}</b>
                <span>{line.number}</span>
              </span>
              <span className="chev">
                <Icon name="chev" style={{ width: 16, height: 16 }} />
              </span>
            </button>
            {switchOpen && (
              <div className="numswitch-menu">
                {lines.map((l) => (
                  <div
                    key={l.id}
                    className={`numswitch-opt ${l.id === activeLineId ? "sel" : ""}`}
                    onClick={() => {
                      setActiveLineId(l.id);
                      setSwitchOpen(false);
                    }}
                  >
                    <span className="ava" style={{ background: l.color }}>
                      {initials(l.person)}
                    </span>
                    <span className="meta">
                      <b>{l.label}</b>
                      <span>{l.number}</span>
                    </span>
                    {l.id === activeLineId && (
                      <span className="tick">
                        <Icon name="check" style={{ width: 17, height: 17 }} />
                      </span>
                    )}
                  </div>
                ))}
                <button
                  className="add-num"
                  onClick={() => {
                    setSwitchOpen(false);
                    showToast(d.common.addNumberTip);
                  }}
                >
                  <Icon name="plus" style={{ width: 16, height: 16 }} /> {d.common.addAnotherNumber}
                </button>
              </div>
            )}
          </div>

          <button className="iconbtn" onClick={() => go("log")} aria-label="Notifications">
            <Icon name="bell" />
            {missedCount > 0 && <span className="dot"></span>}
          </button>
          <div className="user-chip clickable" onClick={() => go("account")}>
            <span className="ava">MD</span>
            <span className="who">
              <b>{account.name}</b>
              <span>{d.common.accountOwner}</span>
            </span>
          </div>
          <button
            className="iconbtn signout-btn"
            onClick={signOut}
            aria-label={d.common.signOut}
            title={d.common.signOut}
          >
            <Icon name="logout" />
          </button>
        </div>

        <div className="content">
          {activeVoicemail && (
            <div className="card" style={{ border: '2px solid oklch(0.60 0.13 220)', background: 'oklch(0.96 0.03 220 / 0.3)', marginBottom: 24 }}>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'oklch(0.45 0.16 220)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voicemail Player</span>
                    <h2 style={{ fontSize: '1.2rem', margin: '4px 0 0 0', color: 'var(--ink)' }}>From: {activeVoicemail.caller} &bull; Duration: {activeVoicemail.duration}</h2>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveVoicemail(null)}>Close Player</button>
                </div>
                
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                  <p style={{ fontStyle: 'italic', margin: 0, color: 'var(--ink)', fontSize: '0.92rem', lineHeight: 1.5 }}>"{activeVoicemail.transcription}"</p>
                </div>

                <div>
                  <audio controls src={activeVoicemail.recordingUrl} style={{ width: '100%', height: 40 }} autoPlay>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          )}
          {view === "overview" && (
            <OverviewView
              lines={lines}
              log={log}
              line={line}
              setView={go}
              setActiveLineId={setActiveLineId}
              d={d}
              lang={lang}
            />
          )}
          {view === "contacts" && (
            <ContactsView line={line} setLine={setLines} showToast={showToast} d={d} lang={lang} />
          )}
          {view === "routing" && (
            <RoutingView line={line} setLine={setLines} showToast={showToast} d={d} lang={lang} />
          )}
          {view === "log" && <CallLogView line={line} log={log} d={d} lang={lang} />}
          {view === "settings" && (
            <SettingsView
              line={line}
              setLine={setLines}
              showToast={showToast}
              d={d}
              lang={lang}
              preferredName={account.preferred}
            />
          )}
          {view === "account" && (
            <AccountView
              account={account}
              setAccount={setAccount}
              showToast={showToast}
              tab={acctTab}
              setTab={setAcctTab}
              d={d}
              lang={lang}
            />
          )}
        </div>
      </div>

      <Toast msg={toast} />
      </div>
    </div>
  );
}
