"use client";

import React, { useState, useRef, useEffect } from "react";

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

interface Line {
  id: string;
  label: string;
  person: string;
  number: string;
  color: string;
  mode: "menu" | "cascade";
  minutesUsed: number;
  contacts: Contact[];
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
}: {
  lines: Line[];
  log: Record<string, CallLogEntry[]>;
  line: Line;
  setView: (v: string) => void;
  setActiveLineId: (id: string) => void;
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
          lbl="Calls this week"
          trend="▲ 18% vs last week"
          trendDir="up"
        />
        <StatCard
          icon="check"
          iconBg="oklch(0.95 0.05 158)"
          iconColor="oklch(0.45 0.13 158)"
          val={`${connectRate}%`}
          lbl="Connected on first try"
          trend="▲ 6%"
          trendDir="up"
        />
        <StatCard
          icon="alert"
          iconBg="oklch(0.96 0.05 22)"
          iconColor="var(--rose)"
          val={missed}
          lbl="Missed → alerted"
          trend="▼ 2 vs last week"
          trendDir="down"
        />
        <StatCard
          icon="contacts"
          iconBg="oklch(0.96 0.04 285)"
          iconColor="var(--violet)"
          val={totalContacts}
          lbl="Trusted contacts"
          trend={`across ${lines.length} numbers`}
          trendDir="up"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }} className="ov-cols">
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Your numbers</h2>
              <p>{lines.length} of 2 included on Pro</p>
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
                    {l.mode === "menu" ? "Caller menu" : "Cascade"}
                  </Badge>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                    {l.contacts.length} contacts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Recent calls</h2>
              <p>{line.label}</p>
            </div>
            <button className="btn btn-soft btn-sm" onClick={() => setView("log")}>
              View all
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
                    <b>{c.routed}</b>
                    <span>
                      {c.caller} · {c.when}
                    </span>
                  </div>
                  <Badge kind={m.badge.replace("badge-", "")}>{m.label}</Badge>
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
}: {
  initial?: Contact;
  order: number;
  onSave: (c: Contact) => void;
  onClose: () => void;
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
      title={editing ? "Edit contact" : "Add a contact"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            {editing ? "Save changes" : "Add contact"}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Full name</label>
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
            <label>Relationship</label>
            <input
              value={rel}
              onChange={(e) => setRel(e.target.value)}
              placeholder="Daughter"
              maxLength={28}
            />
          </div>
          <div>
            <label>Phone to ring</label>
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
        <label>Avatar color</label>
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
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
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
    showToast("Contact removed");
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
    showToast(modal?.edit ? "Contact updated" : "Contact added");
    setModal(null);
  };

  return (
    <div className="content-inner">
      <div className="contacts-head">
        <div>
          <p className="hint">
            These are the people <b>{line.person.split(" · ")[0]}</b> can reach on {line.number}.
            {line.mode === "menu"
              ? " Callers pick from a menu in the order below."
              : " iCanCall rings them top to bottom until someone answers."}
          </p>
        </div>
        <span className="cap-pill">{contacts.length} / 6 contacts</span>
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
              <Toggle on={c.available} onChange={() => toggleAvail(c.id)} />
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
            <>You've reached the 6-contact limit on this plan</>
          ) : (
            <>
              <Icon name="plus" /> Add a contact
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
        />
      )}
    </div>
  );
}

/* Call Simulator */
function TestCall({ line }: { line: Line }) {
  const [screen, setScreen] = useState({
    cls: "",
    av: "—",
    avColor: null as string | null,
    name: "Ready to test",
    state: "Run a test call to preview routing",
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
      av: line.mode === "menu" ? "☰" : "—",
      avColor: null,
      name: line.mode === "menu" ? "Caller menu" : "Ready to test",
      state:
        line.mode === "menu"
          ? "Run a test call to hear the options"
          : "Run a test call to preview routing",
      ring: false,
    });
  }

  async function ringConnect(c: Contact, idx: number) {
    setScreen({
      cls: "ring-state",
      av: initials(c.name),
      avColor: c.color,
      name: c.name,
      state: `Ringing ${c.rel || "contact"}…`,
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
        state: "✓ Connected",
        ring: false,
      });
      return true;
    }
    return false;
  }

  async function runCascade() {
    setDots(contacts.length);
    setActiveDots({});
    setScreen({ cls: "", av: "•", avColor: null, name: "Connecting…", state: "Placing the call", ring: false });
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
        state: "No answer — trying next…",
        ring: false,
      });
      await sleep(500);
    }
    if (!done && !cancelled.current) {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: "Voicemail",
        state: "Message sent — everyone alerted",
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
      state: `Connecting to ${c.rel || c.name}…`,
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
        state: "✓ Connected",
        ring: false,
      });
    } else {
      setScreen({
        cls: "voicemail",
        av: "✉",
        avColor: null,
        name: `${c.name} is busy`,
        state: "Sent to voicemail — alerted",
        ring: false,
      });
    }
  }

  async function run() {
    if (running || !contacts.length) return;
    cancelled.current = false;
    setRunning(true);
    if (line.mode === "menu") await runMenu();
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
            <div className="t">Thanks for calling. Choose who to reach:</div>
            {menu.map((c, i) => (
              <button className="sim-opt" key={c.id} onClick={() => pick(i)}>
                <span className="digit">{i + 1}</span>
                <span>
                  <b>
                    Press {i + 1} — {c.name}
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
            {line.mode === "menu" ? "MENU ORDER" : "CASCADE ORDER"}
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
                  <span className="d"></span>Busy
                </span>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={run}
          disabled={running || !contacts.length}
        >
          <Icon name="phone" /> {running ? "Calling…" : "Run a test call"}
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
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
}) {
  const setMode = (mode: "cascade" | "menu") => {
    if (mode === line.mode) return;
    setLine((prev) => prev.map((l) => (l.id === line.id ? { ...l, mode } : l)));
    showToast(mode === "menu" ? "Switched to Caller Menu" : "Switched to Call Cascade");
  };

  return (
    <div className="content-inner">
      <div className="card section-gap">
        <div className="card-head">
          <div>
            <h2>How callers connect</h2>
            <p>
              Choose what happens when someone dials {line.number}. Changes take effect on the next call.
            </p>
          </div>
        </div>
        <div className="card-pad">
          <div className="mode-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
              <h4>Call cascade</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                Ring contacts one after another in the order below until someone answers. Best for
                emergencies — reaching <i>anyone</i> is what matters.
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
              <h4>Caller menu</h4>
              <p style={{ fontSize: "0.86rem", color: "var(--ink-soft)", marginTop: 6 }}>
                Greet callers and let them choose ("Press 1 for Maria, Press 2 for the doctor…"). Best when
                the right person depends on the situation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Preview &amp; test</h2>
            <p>
              Place a simulated call to see exactly what {line.person.split(" · ")[0]}'s callers will
              experience.
            </p>
          </div>
          <Badge kind="blue">{line.mode === "menu" ? "Caller menu" : "Call cascade"}</Badge>
        </div>
        <div className="card-pad">
          <TestCall line={line} />
        </div>
      </div>
    </div>
  );
}

/* Call log */
function CallLogView({ line, log }: { line: Line; log: Record<string, CallLogEntry[]> }) {
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
    ["all", "All"],
    ["connected", "Connected"],
    ["missed", "Missed"],
    ["voicemail", "Voicemail"],
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
          <Icon name="download" /> Export CSV
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Call history</h2>
            <p>Every call to {line.number}, including missed attempts</p>
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
                    <b>{c.caller}</b>
                    <span>incoming call</span>
                  </div>
                  <div className="routed">
                    <b>{c.routed}</b>
                    {c.rel}
                  </div>
                  <div className="dur">{c.dur}</div>
                  <div style={{ textAlign: "right" }}>
                    <Badge kind={m.badge.replace("badge-", "")}>{m.label}</Badge>
                    <div className="when" style={{ marginTop: 5 }}>
                      {c.when}
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
                No {filter} calls on this line.
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
}: {
  line: Line;
  setLine: React.Dispatch<React.SetStateAction<Line[]>>;
  showToast: (msg: string) => void;
}) {
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
            <h2>Greeting</h2>
            <p>What callers hear when they dial {line.number}</p>
          </div>
        </div>
        <div className="card-pad">
          <div className="field">
            <label>Greeting message</label>
            <textarea
              rows={3}
              value={greeting}
              onChange={(e) => set({ greeting: e.target.value })}
              className="w-full p-3 rounded-lg border border-line focus:outline-none focus:border-accent bg-surface"
            />
          </div>
          <div className="set-row" style={{ paddingTop: 4 }}>
            <div className="txt">
              <b>Bilingual greeting</b>
              <p>
                Play the greeting in a second language after English. Recommended for caregivers and
                multilingual families.
              </p>
            </div>
            <Toggle on={bilingual} onChange={(v) => set({ bilingual: v })} labels={["Off", "On"]} />
          </div>
          {bilingual && (
            <div className="field" style={{ marginTop: 16, marginBottom: 0, maxWidth: 260 }}>
              <label>Second language</label>
              <select value={language2} onChange={(e) => set({ language2: e.target.value })}>
                {["Spanish", "Mandarin", "Tagalog", "Vietnamese", "French", "Korean"].map((lang) => (
                  <option key={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Notifications</h2>
            <p>How you're alerted about calls on this line</p>
          </div>
        </div>
        <div className="card-pad" style={{ paddingTop: 4 }}>
          <div className="set-row">
            <div className="txt">
              <b>SMS alerts</b>
              <p>Text Maria the moment a call comes through, including who answered.</p>
            </div>
            <Toggle on={notifSMS} onChange={(v) => set({ notifSMS: v })} labels={["Off", "On"]} />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>Email alerts</b>
              <p>Send a copy of every call notification to your inbox.</p>
            </div>
            <Toggle on={notifEmail} onChange={(v) => set({ notifEmail: v })} labels={["Off", "On"]} />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>Missed-call alerts</b>
              <p>Get notified immediately if no one in the circle answers.</p>
            </div>
            <Toggle on={notifMissed} onChange={(v) => set({ notifMissed: v })} labels={["Off", "On"]} />
          </div>
          <div className="set-row">
            <div className="txt">
              <b>Weekly safety report</b>
              <p>A Monday summary of all call activity across this line.</p>
            </div>
            <Toggle on={notifWeekly} onChange={(v) => set({ notifWeekly: v })} labels={["Off", "On"]} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => showToast("Settings saved")}>
          <Icon name="check" /> Save changes
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

function AccountView({
  account,
  setAccount,
  showToast,
  tab,
  setTab,
}: {
  account: Account;
  setAccount: React.Dispatch<React.SetStateAction<Account>>;
  showToast: (msg: string) => void;
  tab: string;
  setTab: (t: string) => void;
}) {
  const a = account;
  const set = (patch: Partial<Account>) => setAccount((prev) => ({ ...prev, ...patch }));

  const [pwd, setPwd] = useState({ cur: "", next: "", conf: "" });
  const savePwd = () => {
    if (!pwd.cur || !pwd.next) return showToast("Enter your current and new password");
    if (pwd.next !== pwd.conf) return showToast("New passwords don’t match");
    setPwd({ cur: "", next: "", conf: "" });
    showToast("Password updated");
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
              <h2>Profile</h2>
              <p>Your personal details on the iCanCall account</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="acct-photo">
              <span className="big-ava" style={{ display: "grid", placeItems: "center" }}>
                {initials(a.name)}
              </span>
              <div className="pmeta">
                <b>{a.name}</b>
                <span>{a.role}</span>
                <div className="pacts">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => showToast("Photo upload available soon")}
                  >
                    <Icon name="camera" /> Change photo
                  </button>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>Full name</label>
                  <input value={a.name} onChange={(e) => set({ name: e.target.value })} />
                </div>
                <div>
                  <label>Preferred name</label>
                  <input value={a.preferred} onChange={(e) => set({ preferred: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Role on this account</label>
              <select value={a.role} onChange={(e) => set({ role: e.target.value })} style={{ maxWidth: 320 }}>
                {["Primary caregiver", "Family member", "Account administrator", "Care coordinator"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  )
                )}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast("Profile saved")}>
                <Icon name="check" /> Save changes
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
                <h2>Login email</h2>
                <p>Used to sign in and recover your account</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="field" style={{ marginBottom: 0, maxWidth: 420 }}>
                <label>Email address</label>
                <input type="email" value={a.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => showToast("Verification sent to your new email")}
                >
                  Update email
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>Password</h2>
                <p>Choose a strong password you don’t use elsewhere</p>
              </div>
            </div>
            <div className="card-pad">
              <div style={{ maxWidth: 420 }}>
                <div className="field">
                  <label>Current password</label>
                  <input
                    type="password"
                    value={pwd.cur}
                    onChange={(e) => setPwd({ ...pwd, cur: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field">
                  <label>New password</label>
                  <input
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Confirm new password</label>
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
                  <Icon name="lock" /> Update password
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>Two-factor authentication</h2>
                <p>Add an extra layer of security at sign-in</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 8 }}>
              <div className="set-row" style={{ paddingTop: 4 }}>
                <div className="txt">
                  <b>Text message (SMS) codes</b>
                  <p>
                    We’ll text a one-time code to {a.phone} each time you sign in on a new device.
                  </p>
                </div>
                <Toggle
                  on={a.twoFactor}
                  onChange={(v) => {
                    set({ twoFactor: v });
                    showToast(v ? "Two-factor enabled" : "Two-factor disabled");
                  }}
                  labels={["Off", "On"]}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h2>Active sessions</h2>
                <p>Devices currently signed in to your account</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                { dev: "Chrome · MacBook Pro", loc: "Oakland, CA", last: "Active now", cur: true },
                { dev: "iCanCall app · iPhone 15", loc: "Oakland, CA", last: "2 hours ago", cur: false },
                { dev: "Safari · iPad", loc: "Sacramento, CA", last: "Yesterday", cur: false },
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
                    <Badge kind="green">This device</Badge>
                  ) : (
                    <button
                      className="btn btn-danger-ghost btn-sm"
                      onClick={() => showToast("Signed out of " + s.dev)}
                    >
                      <Icon name="logout" /> Sign out
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
              <h2>Contact information</h2>
              <p>Where we reach you with call alerts and account notices</p>
            </div>
          </div>
          <div className="card-pad">
            <div className="field">
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>Mobile phone</label>
                  <input value={a.phone} onChange={(e) => set({ phone: e.target.value })} />
                </div>
                <div>
                  <label>Notification email</label>
                  <input
                    type="email"
                    value={a.notifyEmail}
                    onChange={(e) => set({ notifyEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="field">
              <label>Mailing address</label>
              <input value={a.address} onChange={(e) => set({ address: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>Time zone</label>
                  <select value={a.timezone} onChange={(e) => set({ timezone: e.target.value })}>
                    {["Pacific (PT)", "Mountain (MT)", "Central (CT)", "Eastern (ET)"].map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Preferred language</label>
                  <select value={a.language} onChange={(e) => set({ language: e.target.value })}>
                    {["English", "Spanish", "Mandarin", "Tagalog", "Vietnamese", "French"].map((lang) => (
                      <option key={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn btn-primary" onClick={() => showToast("Contact info saved")}>
                <Icon name="check" /> Save changes
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
                <h2>Current plan</h2>
                <p>Billed monthly · renews June 1, 2026</p>
              </div>
              <Badge kind="blue">Pro</Badge>
            </div>
            <div className="card-pad">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
                  $19.99
                </span>
                <span style={{ color: "var(--ink-faint)" }}>/ month</span>
                <span style={{ marginLeft: 10 }}>
                  <Badge kind="green">Save 17% on annual</Badge>
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
                {[
                  "2 dedicated phone numbers",
                  "6 routable contacts per number",
                  "Cascade routing + Caller Menu",
                  "Real-time SMS & email alerts",
                  "Bilingual greeting options",
                  "Admin dashboard",
                ].map((f) => (
                  <div className="plan-feat" key={f}>
                    <Icon name="check" /> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => showToast("Switched to annual billing — $199/yr")}
                >
                  <Icon name="spark" /> Switch to annual
                </button>
                <button className="btn btn-ghost" onClick={() => showToast("Opening plan options…")}>
                  Change plan
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
                    <h2>Add-ons</h2>
                    <p>Available on both the Essential and Pro plans</p>
                  </div>
                </div>
                <div className="card-pad" style={{ paddingTop: 8 }}>
                  <div className="addon">
                    <span className="aic">
                      <Icon name="phone" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>Additional phone number</b>
                        <span className="price">$6.99 / mo each</span>
                      </div>
                      <p>
                        Add another dedicated iCanCall number for another loved one, each with its own
                        contacts and routing.
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
                        {numCost > 0 ? `+$${numCost.toFixed(2)}/mo` : "Included: base plan"}
                      </span>
                    </div>
                  </div>

                  <div className="addon">
                    <span className="aic">
                      <Icon name="clock" />
                    </span>
                    <div className="abody">
                      <div className="atop">
                        <b>Extra voice minutes</b>
                        <span className="price">$4.99 per 30 min</span>
                      </div>
                      <p>
                        Top up talk time in 30-minute blocks. <b>Unused add-on minutes roll over</b> to
                        the next 30-day billing cycle — you never lose what you've paid for.
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
                        {ad.minuteBlocks * 30} min · {minCost > 0 ? `+$${minCost.toFixed(2)}/mo` : "$0.00/mo"}
                      </span>
                    </div>
                  </div>

                  <div className="addon-total">
                    <span className="lbl">
                      New monthly total <b>(plan + add-ons)</b>
                    </span>
                    <span className="big">
                      ${total.toFixed(2)}
                      <span> / mo</span>
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <button className="btn btn-primary" onClick={() => showToast("Add-ons updated")}>
                      <Icon name="check" /> Save add-ons
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
                    <h2>Add-on minutes</h2>
                    <p>Top-up talk time on top of your plan&rsquo;s included minutes</p>
                  </div>
                  {total > 0 && <Badge kind={low ? "amber" : "green"}>{low ? "Running low" : "Rolls over"}</Badge>}
                </div>
                <div className="card-pad">
                  {total === 0 ? (
                    <div className="mb-empty">
                      <span className="ic">
                        <Icon name="clock" />
                      </span>
                      <div>
                        <b>No add-on minutes yet</b>
                        <p>
                          Add extra voice minutes above and they&rsquo;ll show up here. Unused minutes roll
                          over each cycle, so you never lose what you&rsquo;ve paid for.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-top">
                        <div className="big">
                          {remaining}
                          <span> min remaining</span>
                        </div>
                        <div className="mb-meta">
                          {used} of {total} add-on min used &middot; renews June 1, 2026
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
                            <b>{purchased} min</b>
                            <span>
                              This cycle&rsquo;s top-up
                              {ad.minuteBlocks ? ` · ${ad.minuteBlocks} × 30 min` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="refresh" />
                          </span>
                          <div>
                            <b>{rollover} min</b>
                            <span>Rolled over from last cycle</span>
                          </div>
                        </div>
                        <div className="mb-stat">
                          <span className="mb-ic">
                            <Icon name="phone" />
                          </span>
                          <div>
                            <b>{used} min</b>
                            <span>Used this cycle</span>
                          </div>
                        </div>
                      </div>
                      <p className="mb-note">
                        <Icon name="check" /> Plan minutes are used first; add-on minutes kick in only after
                        those run out. Remaining add-on minutes roll over automatically.
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
                <h2>Payment method</h2>
                <p>Charged on the 1st of each month</p>
              </div>
            </div>
            <div className="card-pad">
              <div className="card-on-file">
                <span className="card-brand">{a.card.brand.toUpperCase()}</span>
                <div style={{ flex: 1 }}>
                  <div className="cnum">•••• •••• •••• {a.card.last4}</div>
                  <div className="cexp">Expires {a.card.exp}</div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => showToast("Opening secure card form…")}
                >
                  <Icon name="card" /> Update card
                </button>
              </div>
              <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
                <label>Billing address</label>
                <input value={a.billingAddr} onChange={(e) => set({ billingAddr: e.target.value })} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn btn-primary" onClick={() => showToast("Billing details saved")}>
                  <Icon name="check" /> Save changes
                </button>
              </div>
            </div>
          </div>

          <div className="card section-gap">
            <div className="card-head">
              <div>
                <h2>Billing history</h2>
                <p>Visa ending {a.card.last4}</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 6, paddingBottom: 10 }}>
              {[
                ["May 1, 2026", "Pro · monthly", "$19.99"],
                ["Apr 1, 2026", "Pro · monthly", "$19.99"],
                ["Mar 1, 2026", "Pro · monthly", "$19.99"],
              ].map(([d, desc, amt]) => (
                <div className="invoice" key={d}>
                  <div className="l">
                    <b>{d}</b>
                    <span>{desc}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span className="amt">{amt}</span>
                    <button className="btn btn-soft btn-sm" onClick={() => showToast("Downloading receipt…")}>
                      <Icon name="download" /> Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head">
              <div>
                <h2>Cancel subscription</h2>
                <p>Your numbers stay active until the end of the billing period</p>
              </div>
            </div>
            <div className="card-pad" style={{ paddingTop: 14 }}>
              <button
                className="btn btn-danger-ghost"
                onClick={() => showToast("We’d hate to see you go — contact support to cancel")}
              >
                Cancel iCanCall Pro
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
  const [log] = useState<Record<string, CallLogEntry[]>>({
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
          setImpersonatingUser(userObj);
          setAccount((prev) => ({
            ...prev,
            name: userObj.name,
            preferred: userObj.name.split(" ")[0],
            email: userObj.email,
            notifyEmail: userObj.email,
          }));
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
        <div className="brand">
          <span className="mark">
            <Icon name="shield" style={{ width: 18, height: 18, stroke: "#fff" }} />
          </span>
          <span>
            i<b>Can</b>Call
          </span>
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
                {lines.length}/2 numbers
              </span>
            </div>
            <button
              className="upgrade"
              onClick={() => {
                setAcctTab("billing");
                go("account");
              }}
            >
              Manage plan
            </button>
          </div>
          <button className="signout-row" onClick={signOut}>
            <Icon name="logout" style={{ width: 18, height: 18 }} /> Sign out
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
                    showToast("Add-a-number is available on Pro — contact support");
                  }}
                >
                  <Icon name="plus" style={{ width: 16, height: 16 }} /> Add another number
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
              <b>Maria Delgado</b>
              <span>Account owner</span>
            </span>
          </div>
          <button
            className="iconbtn signout-btn"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
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
            />
          )}
          {view === "contacts" && (
            <ContactsView line={line} setLine={setLines} showToast={showToast} />
          )}
          {view === "routing" && (
            <RoutingView line={line} setLine={setLines} showToast={showToast} />
          )}
          {view === "log" && <CallLogView line={line} log={log} />}
          {view === "settings" && (
            <SettingsView line={line} setLine={setLines} showToast={showToast} />
          )}
          {view === "account" && (
            <AccountView
              account={account}
              setAccount={setAccount}
              showToast={showToast}
              tab={acctTab}
              setTab={setAcctTab}
            />
          )}
        </div>
      </div>

      <Toast msg={toast} />
      </div>
    </div>
  );
}
