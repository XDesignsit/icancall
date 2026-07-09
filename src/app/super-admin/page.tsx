"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

/* ============ MOCK DATA ============ */
const AVATAR_COLORS = [
  "oklch(0.58 0.115 232)",
  "oklch(0.62 0.10 198)",
  "oklch(0.55 0.13 285)",
  "oklch(0.60 0.13 30)",
  "oklch(0.58 0.13 145)",
  "oklch(0.6 0.14 350)",
];

const fmtUSD = (n: number, dp: number = 0) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const fmtNum = (n: number) => Number(n).toLocaleString("en-US");

const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

const KPI = {
  mrr: 9847,
  mrrPrev: 9082,
  arr: 118164,
  accounts: 487,
  accountsNew: 44,
  accountsPrev: 455,
  activeNumbers: 712,
  churnLogo: 2.1,
  nrr: 104,
  arpa: 22.85,
  ltv: 412,
};

const MRR_SERIES = [4180, 4620, 5050, 5380, 5910, 6340, 6880, 7390, 7920, 8510, 9180, 9847];
const SIGNUP_SERIES = [21, 24, 22, 28, 26, 31, 29, 34, 33, 38, 41, 44];
const CHURN_SERIES = [3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9];
const ACCOUNTS_SERIES = [188, 210, 228, 253, 274, 301, 324, 353, 379, 411, 448, 487];

const PLAN_SPLIT = [
  {
    id: "pro",
    name: "Pro",
    count: 201,
    mrr: 5667,
    color: "var(--blue)",
    billing: [
      { id: "monthly", label: "Monthly", count: 118, mrr: 3540, color: "var(--blue)" },
      { id: "annual", label: "Annual", count: 83, mrr: 2127, color: "oklch(0.72 0.08 232)" },
    ],
  },
  {
    id: "essential",
    name: "Essential",
    count: 286,
    mrr: 4180,
    color: "var(--teal-deep)",
    billing: [
      { id: "monthly", label: "Monthly", count: 191, mrr: 2890, color: "var(--teal-deep)" },
      { id: "annual", label: "Annual", count: 95, mrr: 1290, color: "oklch(0.79 0.07 196)" },
    ],
  },
];

const STATUS_SPLIT = [
  { id: "active", label: "Active", count: 470, kind: "green" },
  { id: "past_due", label: "Past due", count: 12, kind: "amber" },
  { id: "suspended", label: "Suspended", count: 5, kind: "rose" },
];

const MRR_MOVEMENT = [
  { label: "New business", amt: 1024, kind: "pos" },
  { label: "Expansion", amt: 388, kind: "pos" },
  { label: "Reactivation", amt: 96, kind: "pos" },
  { label: "Contraction", amt: -214, kind: "neg" },
  { label: "Churn", amt: -529, kind: "neg" },
];

const FEATURES = {
  routing: [
    { id: "menu", label: "Caller Menu", pct: 58, color: "var(--blue)" },
    { id: "cascade", label: "Cascade", pct: 42, color: "var(--violet)" },
  ],
  voicemailEnabledPct: 71,
  voicemailOfCallsPct: 5.8,
  avgContacts: 4.3,
  contactsDist: [
    { n: "1", pct: 6 },
    { n: "2", pct: 11 },
    { n: "3", pct: 22 },
    { n: "4", pct: 24 },
    { n: "5", pct: 19 },
    { n: "6", pct: 18 },
  ],
};

const MAILEROO = {
  totalSent: 2845,
  deliverySuccess: 99.42,
  bounceRate: 0.18,
  spamRate: 0.04,
  avgLatency: "1.4s",
  smtpQueueStatus: "Optimal",
  categories: [
    { name: "Voicemail Alerts", count: 1565, pct: 55, color: "var(--violet)" },
    { name: "Welcome & Billing", count: 995, pct: 35, color: "var(--blue)" },
    { name: "System Security Alerts", count: 285, pct: 10, color: "var(--teal)" },
  ],
  logs: [
    { id: "mr-9943", email: "maria.delgado@gmail.com", category: "Voicemail Alert", timestamp: "Today · 2:48 PM", msgId: "msg_vm_78a1c9df", status: "delivered" },
    { id: "mr-9942", email: "james.d@delgadofamily.org", category: "Voicemail Alert", timestamp: "Today · 11:02 AM", msgId: "msg_vm_43f82b12", status: "delivered" },
    { id: "mr-9941", email: "alex.d@icancall.co", category: "System Security Alert", timestamp: "Today · 9:14 AM", msgId: "msg_sec_10bc93ef", status: "delivered" },
    { id: "mr-9940", email: "support@icancall.co", category: "Welcome & Billing", timestamp: "Yesterday · 4:32 PM", msgId: "msg_bill_88da1230", status: "delivered" },
    { id: "mr-9939", email: "robert.hale@yahoo.com", category: "Voicemail Alert", timestamp: "Yesterday · 2:10 PM", msgId: "msg_vm_c982a174", status: "delivered" },
    { id: "mr-9938", email: "bad-email-address-test@domain.com", category: "System Security Alert", timestamp: "May 30 · 11:45 AM", msgId: "msg_sec_d88f9c10", status: "bounced" },
    { id: "mr-9937", email: "mom-eleanor@delgadofamily.org", category: "Welcome & Billing", timestamp: "May 29 · 3:00 PM", msgId: "msg_bill_f043e911", status: "delivered" },
  ]
};

const HEALTH = {
  uptime: 99.98,
  connectRate: 94.2,
  voicemailRate: 5.8,
  missedAlertRate: 99.1,
  avgRingMs: 2.4,
  callsLast30: 18420,
  callVolume: [520, 548, 612, 590, 634, 470, 410, 560, 598, 640, 612, 668, 590, 512],
  connectTrend: [93.1, 93.6, 94.0, 92.8, 94.4, 95.1, 94.2],
  incidents: [
    {
      id: 1,
      sev: "resolved",
      title: "Carrier latency — (305) Miami pool",
      detail: "Elevated ring times on 41 numbers",
      when: "May 22 · 14m",
      kind: "amber",
    },
    {
      id: 2,
      sev: "resolved",
      title: "Voicemail transcription delay",
      detail: "Backlog cleared, no calls dropped",
      when: "May 14 · 38m",
      kind: "amber",
    },
    {
      id: 3,
      sev: "resolved",
      title: "SMS alert provider failover",
      detail: "Auto-failover to secondary route",
      when: "Apr 30 · 6m",
      kind: "green",
    },
  ],
  regions: [
    { code: "415", city: "San Francisco", numbers: 168, connect: 95.1 },
    { code: "212", city: "New York", numbers: 142, connect: 94.6 },
    { code: "312", city: "Chicago", numbers: 96, connect: 93.8 },
    { code: "305", city: "Miami", numbers: 88, connect: 92.4 },
    { code: "206", city: "Seattle", numbers: 74, connect: 95.3 },
    { code: "617", city: "Boston", numbers: 61, connect: 94.9 },
  ],
};

const ACCOUNTS = [
  {
    id: "ACC-2041",
    owner: "Maria Delgado",
    email: "maria.delgado@gmail.com",
    color: "oklch(0.55 0.13 285)",
    plan: "pro",
    billing: "annual",
    status: "active",
    joined: "Nov 2, 2024",
    last: "8m ago",
    city: "San Francisco",
    area: "415",
    numbers: 2,
    contacts: 8,
    calls30: 142,
    connect: 95.1,
    vmRate: 4.2,
    minutesUsed: 49,
    minutesCap: 120,
    mrr: 16.58,
    ltv: 298,
    next: "Nov 2, 2025",
    isHero: true,
    lines: [
      {
        label: "Eleanor's line",
        person: "Eleanor Delgado · Mom",
        number: "(415) 555-0142",
        mode: "menu",
        minutesUsed: 38,
        contacts: 5,
      },
      {
        label: "Robert's line",
        person: "Robert Hale · Dad",
        number: "(415) 555-0188",
        mode: "cascade",
        minutesUsed: 11,
        contacts: 3,
      },
    ],
  },
  {
    id: "ACC-2038",
    owner: "Daniel Okonkwo",
    email: "d.okonkwo@outlook.com",
    color: "oklch(0.58 0.115 232)",
    plan: "pro",
    billing: "monthly",
    status: "active",
    joined: "Oct 19, 2024",
    last: "2h ago",
    city: "Chicago",
    area: "312",
    numbers: 2,
    contacts: 9,
    calls30: 96,
    connect: 93.4,
    vmRate: 6.1,
    minutesUsed: 71,
    minutesCap: 120,
    mrr: 24.99,
    ltv: 188,
    next: "Jun 19, 2025",
    lines: [
      {
        label: "Grace's line",
        person: "Grace Okonkwo · Mother",
        number: "(312) 555-0177",
        mode: "menu",
        minutesUsed: 44,
        contacts: 6,
      },
      {
        label: "Joseph's line",
        person: "Joseph Okonkwo · Uncle",
        number: "(312) 555-0204",
        mode: "cascade",
        minutesUsed: 27,
        contacts: 3,
      },
    ],
  },
  {
    id: "ACC-2035",
    owner: "Priya Nair",
    email: "priya.nair@gmail.com",
    color: "oklch(0.6 0.14 350)",
    plan: "essential",
    billing: "monthly",
    status: "active",
    joined: "Oct 11, 2024",
    last: "1d ago",
    city: "New York",
    area: "212",
    numbers: 1,
    contacts: 3,
    calls30: 54,
    connect: 96.0,
    vmRate: 3.1,
    minutesUsed: 22,
    minutesCap: 30,
    mrr: 14.99,
    ltv: 104,
    next: "Jun 11, 2025",
    lines: [
      {
        label: "Asha's line",
        person: "Asha Nair · Grandmother",
        number: "(212) 555-0166",
        mode: "menu",
        minutesUsed: 22,
        contacts: 3,
      },
    ],
  },
  {
    id: "ACC-2033",
    owner: "Robert Chen",
    email: "rchen.family@gmail.com",
    color: "oklch(0.62 0.10 198)",
    plan: "pro",
    billing: "annual",
    status: "active",
    joined: "Sep 28, 2024",
    last: "4h ago",
    city: "Seattle",
    area: "206",
    numbers: 2,
    contacts: 7,
    calls30: 88,
    connect: 95.7,
    vmRate: 4.8,
    minutesUsed: 58,
    minutesCap: 120,
    mrr: 16.58,
    ltv: 232,
    next: "Sep 28, 2025",
    lines: [
      {
        label: "Wei's line",
        person: "Wei Chen · Father",
        number: "(206) 555-0143",
        mode: "cascade",
        minutesUsed: 33,
        contacts: 4,
      },
      {
        label: "Mei's line",
        person: "Mei Chen · Mother",
        number: "(206) 555-0151",
        mode: "menu",
        minutesUsed: 25,
        contacts: 3,
      },
    ],
  },
  {
    id: "ACC-2030",
    owner: "Sofia Martinez",
    email: "sofia.m@icloud.com",
    color: "oklch(0.60 0.13 30)",
    plan: "essential",
    billing: "annual",
    status: "active",
    joined: "Sep 14, 2024",
    last: "3d ago",
    city: "Miami",
    area: "305",
    numbers: 1,
    contacts: 4,
    calls30: 41,
    connect: 92.4,
    vmRate: 7.0,
    minutesUsed: 19,
    minutesCap: 30,
    mrr: 10.75,
    ltv: 129,
    next: "Sep 14, 2025",
    lines: [
      {
        label: "Carmen's line",
        person: "Carmen Ruiz · Aunt",
        number: "(305) 555-0188",
        mode: "menu",
        minutesUsed: 19,
        contacts: 4,
      },
    ],
  },
  {
    id: "ACC-2029",
    owner: "James Patel",
    email: "james.patel@gmail.com",
    color: "oklch(0.58 0.13 145)",
    plan: "pro",
    billing: "monthly",
    status: "past_due",
    joined: "Sep 6, 2024",
    last: "6d ago",
    city: "Boston",
    area: "617",
    numbers: 2,
    contacts: 6,
    calls30: 33,
    connect: 90.1,
    vmRate: 9.2,
    minutesUsed: 64,
    minutesCap: 120,
    mrr: 24.99,
    ltv: 160,
    next: "Overdue · May 6",
    lines: [
      {
        label: "Nana's line",
        person: "Vimala Patel · Grandmother",
        number: "(617) 555-0122",
        mode: "cascade",
        minutesUsed: 40,
        contacts: 4,
      },
      {
        label: "Papa's line",
        person: "Arun Patel · Grandfather",
        number: "(617) 555-0139",
        mode: "menu",
        minutesUsed: 24,
        contacts: 2,
      },
    ],
  },
];

const TRANSACTIONS = [
  { id: "in_8841", acct: "Aisha Bello", amt: 24.99, kind: "paid", when: "Today · 11:04 AM", plan: "Pro · Monthly" },
  { id: "in_8840", acct: "Daniel Okonkwo", amt: 24.99, kind: "paid", when: "Today · 9:30 AM", plan: "Pro · Monthly" },
  { id: "in_8838", acct: "James Patel", amt: 24.99, kind: "failed", when: "Today · 6:12 AM", plan: "Pro · Monthly" },
  { id: "in_8835", acct: "Tomás Rivera", amt: 14.99, kind: "paid", when: "Yesterday · 8:41 PM", plan: "Essential · Monthly" },
  { id: "in_8832", acct: "Maria Delgado", amt: 249.0, kind: "paid", when: "Yesterday · 2:02 PM", plan: "Pro · Annual" },
  { id: "in_8829", acct: "Kevin O’Brien", amt: 14.99, kind: "paid", when: "Yesterday · 10:15 AM", plan: "Essential · Monthly" },
  { id: "in_8826", acct: "Sofia Martinez", amt: 8.5, kind: "refund", when: "Mon · 4:48 PM", plan: "Goodwill credit" },
];

const TWILIO = {
  spend: 2840,
  spendPrev: 2614,
  projected: 3010,
  balance: 4210,
  autoRecharge: 2000,
  costPerCall: 0.154,
  costPerMin: 0.026,
  costPerNumber: 3.99,
  spendSeries: [1180, 1290, 1380, 1510, 1660, 1820, 1990, 2160, 2320, 2510, 2680, 2840],
  breakdown: [
    { id: "voice", label: "Programmable Voice", amt: 1180, color: "var(--blue)" },
    { id: "numbers", label: "Phone numbers", amt: 819, color: "var(--teal-deep)" },
    { id: "sms", label: "Messaging · alerts", amt: 410, color: "var(--violet)" },
    { id: "transcribe", label: "Recording & transcription", amt: 250, color: "var(--amber)" },
    { id: "lookup", label: "Lookup & Verify", amt: 181, color: "oklch(0.62 0.16 22)" },
  ],
  usage: {
    voiceMin: 46200,
    voiceIn: 41000,
    voiceOut: 5200,
    sms: 6240,
    smsAlerts: 5180,
    sms2fa: 1060,
    numbers: 712,
    numbersAdded: 52,
    numbersReleased: 9,
    transcriptions: 1068,
    recordings: 1342,
    lookups: 3140,
  },
  regions: [
    { code: "415", city: "San Francisco", numbers: 168, spend: 712 },
    { code: "212", city: "New York", numbers: 142, spend: 604 },
    { code: "312", city: "Chicago", numbers: 96, spend: 402 },
    { code: "305", city: "Miami", numbers: 88, spend: 388 },
    { code: "206", city: "Seattle", numbers: 74, spend: 318 },
    { code: "617", city: "Boston", numbers: 61, spend: 266 },
  ],
  reliability: { callErrorRate: 0.8, smsUndelivered: 1.2, apiSuccess: 99.94, avgLatencyMs: 410 },
  charges: [
    { id: "TW-44021", desc: "Programmable Voice — daily usage", amt: 41.2, when: "Today · 12:00 AM", kind: "usage" },
    { id: 'TW-44018', desc: 'Auto-recharge — balance top-up', amt: 2000, when: 'Yesterday · 3:14 PM', kind: 'recharge' },
    { id: "TW-44012", desc: "Phone number renewals (×214)", amt: 246.1, when: "May 28 · 2:00 AM", kind: "numbers" },
    { id: "TW-43998", desc: "Voice recording & transcription", amt: 9.3, when: "May 26 · 12:00 AM", kind: "usage" },
  ],
};

/* ============ ICONS ============ */
const ICONS = {
  shield: <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  users: <><circle cx="9" cy="7" r="4" /><path d="M16 11a4 4 0 0 0-3-3.87M2 19a6 6 0 0 1 12 0M22 19a6 6 0 0 0-6-6" /></>,
  revenue: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  cloud: <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-3.87-3.3-7-7.5-7C4.8 4 2 6.8 2 10.5c0 2.79 2.18 5 5 5h10.5" />,
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  health: <><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" /></>,
  logout: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4M5 12h11"/></>,
  check: <path d="m5 12 5 5L20 6" />,
  phone: <path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  gauge: <><path d="M4.5 18a8.5 8.5 0 0 1 15 0" /><path d="M12 18V9" /><circle cx="12" cy="18" r="1.5" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>,
  download: <><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" /></>,
  alert: <><path d="M12 8v5M12 16.5v.5"/><path d="M10.3 4 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z"/></>,
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
};

function Icon({ name, style }: { name: keyof typeof ICONS; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 18, height: 18, ...style }}
    >
      {ICONS[name]}
    </svg>
  );
}

const GRADIENTS = [
  "linear-gradient(150deg, var(--violet), var(--blue))",
  "linear-gradient(150deg, var(--blue), var(--teal-deep))",
  "linear-gradient(150deg, var(--green), var(--teal-deep))",
  "linear-gradient(150deg, var(--amber), var(--rose))",
  "linear-gradient(150deg, var(--violet), var(--rose))",
  "linear-gradient(150deg, var(--blue-deep), var(--violet))",
];

interface AdminProfile {
  name: string;
  role: string;
  initials: string;
  avatarUrl: string;
  avatarBg: string;
}

function ProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: AdminProfile;
  onClose: () => void;
  onSave: (newProfile: AdminProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [initials, setInitials] = useState(profile.initials);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarBg, setAvatarBg] = useState(profile.avatarBg);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image must be smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <h3>Profile Settings</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>×</span>
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Avatar Preview */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.4rem",
                  background: avatarBg,
                }}
              >
                {initials || "?"}
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6 }}>
                Profile Photo
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <label className="btn btn-soft btn-sm" style={{ cursor: "pointer", fontSize: "0.78rem" }}>
                  Upload image
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                </label>
                {avatarUrl && (
                  <button className="btn btn-danger-ghost btn-sm" style={{ fontSize: "0.78rem" }} onClick={() => setAvatarUrl("")}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => {
              setName(e.target.value);
              const parts = e.target.value.trim().split(" ");
              if (parts.length >= 2) {
                setInitials((parts[0][0] + parts[1][0]).toUpperCase());
              } else if (parts.length === 1 && parts[0]) {
                setInitials(parts[0].slice(0, 2).toUpperCase());
              }
            }} placeholder="e.g. Alex Delgado" maxLength={30} />
          </div>

          <div className="field">
            <label>Title / Role</label>
            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. System Engineer" maxLength={35} />
          </div>

          <div className="field">
            <label>Initials</label>
            <input type="text" value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))} placeholder="AD" maxLength={2} style={{ textTransform: "uppercase" }} />
          </div>

          {!avatarUrl && (
            <div className="field">
              <label>Avatar Color Gradient</label>
              <div className="swatch-row">
                {GRADIENTS.map((gradient, idx) => (
                  <span
                    key={idx}
                    className={`swatch ${avatarBg === gradient ? "sel" : ""}`}
                    style={{
                      background: gradient,
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: avatarBg === gradient ? "2px solid var(--ink)" : "1px solid var(--line)"
                    }}
                    onClick={() => setAvatarBg(gradient)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim()) {
                alert("Please enter a name.");
                return;
              }
              onSave({
                name: name.trim(),
                role: role.trim() || "Super Admin",
                initials: initials.trim() || "SA",
                avatarUrl,
                avatarBg,
              });
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminAccount {
  id: string;
  owner: string;
  email: string;
  color: string;
  numbers: number;
  city: string;
  area: string;
  mrr: number;
  joined: string;
  status: string;
  [key: string]: unknown;
}

export default function SuperAdminApp() {
  const [view, setView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "Alex Delgado",
    role: "System Engineer",
    initials: "AD",
    avatarUrl: "",
    avatarBg: "linear-gradient(150deg, var(--violet), var(--blue))",
  });
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Redirect unauthenticated admin sessions to login
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isAdminLoggedIn") !== "true") {
        window.location.href = "/login";
      } else {
        const saved = localStorage.getItem("adminProfile");
        if (saved) {
          try {
            setProfile(JSON.parse(saved));
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/admin/accounts");
        if (res.status === 401) {
          localStorage.removeItem("isAdminLoggedIn");
          window.location.href = "/login?unauthorized=true";
          return;
        }
        const data = await res.json();
        if (res.ok && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      } catch (err) {
        console.error("Failed to load accounts:", err);
      } finally {
        setLoading(false);
      }
    }
    if (typeof window !== "undefined" && localStorage.getItem("isAdminLoggedIn") === "true") {
      loadAccounts();
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("impersonatingUser");
      window.location.href = "/";
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background: "oklch(0.975 0.008 220)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ border: "4px solid rgba(0,0,0,0.1)", width: "36px", height: "36px", borderRadius: "50%", borderLeftColor: "#4083ae", animation: "spin 1s linear infinite", margin: "0 auto 16px auto" }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ color: "oklch(0.4 0.02 240)", fontSize: "0.95rem", fontWeight: 500 }}>Loading Super Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin" style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "100vh" }}>
      <style>{`
        .sidebar {
          background: var(--blue-ink) !important;
        }
        .nav-item {
          transition: background 0.15s, color 0.15s;
        }
        .nav-item:hover {
          background: oklch(1 0 0 / 0.08) !important;
        }
        .nav-item.active {
          background: linear-gradient(135deg, var(--blue), var(--teal-deep)) !important;
          box-shadow: 0 4px 12px rgba(64, 131, 174, 0.18);
        }
        .topbar-input {
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        }
        .topbar-input:focus {
          border-color: var(--blue) !important;
          background-color: #fff !important;
          box-shadow: 0 0 0 3px rgba(64, 131, 174, 0.15);
        }
      `}</style>
      {/* Sidebar */}
      <aside className="sidebar" style={{ background: "var(--blue-ink)", color: "oklch(0.92 0.02 225)", display: "flex", flexDirection: "column", padding: "22px 16px" }}>
        <div className="brand" style={{ marginBottom: 26, paddingLeft: 4 }}>
          <Link href="/super-admin" style={{ display: "block" }}>
            <svg className="logo-main" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 553.0305" style={{ height: "28px", width: "auto", display: "block" }}>
              <style>{`
                .logo-main .cls-1 { fill: #ffffff; }
                .logo-main .cls-2 { fill: #4083ae; }
                .logo-main .cls-3 { fill: var(--blue-ink); }
              `}</style>
              <g>
                <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
                <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
              </g>
              <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
            </svg>
          </Link>
        </div>

        <div className="admin-id" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "4px 8px" }}>
          <span className="pill" style={{ fontSize: "0.64rem", fontWeight: 800, textTransform: "uppercase", background: "oklch(1 0 0 / 0.1)", border: "1px solid oklch(1 0 0 / 0.16)", padding: "4px 9px", borderRadius: 99, color: "oklch(0.85 0.07 200)" }}>
            Super Admin
          </span>
          <span className="env" style={{ fontSize: "0.7rem", color: "oklch(0.66 0.03 230)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="d" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", display: "inline-block" }}></span> Live
          </span>
        </div>

        <nav className="nav" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "overview", label: "SaaS Overview", icon: "overview" },
            { id: "accounts", label: "Subscriber Base", icon: "users" },
            { id: "revenue", label: "Revenue & Ledger", icon: "revenue" },
            { id: "twilio", label: "Twilio Telemetry", icon: "cloud" },
            { id: "maileroo", label: "Maileroo Delivery", icon: "mail" },
            { id: "health", label: "System Health", icon: "health" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`nav-item ${view === item.id ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                border: "none",
                background: "none", // Managed by CSS styles
                color: "#fff",
                fontSize: "0.94rem",
                fontWeight: view === item.id ? 600 : 500,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <Icon name={item.icon as keyof typeof ICONS} style={{ color: "#fff" }} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            className="admin-footchip clickable"
            onClick={() => setShowProfileModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: "oklch(1 0 0 / 0.07)",
              border: "1px solid oklch(1 0 0 / 0.1)",
              borderRadius: "var(--r-md)",
              padding: "11px 12px",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(1 0 0 / 0.12)";
              e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "oklch(1 0 0 / 0.07)";
              e.currentTarget.style.borderColor = "oklch(1 0 0 / 0.1)";
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flex: "none" }}
              />
            ) : (
              <div
                className="ava"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  background: profile.avatarBg,
                  flex: "none"
                }}
              >
                {profile.initials}
              </div>
            )}
            <div className="who" style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: "0.86rem", color: "#fff", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</b>
              <span style={{ fontSize: "0.74rem", color: "oklch(0.7 0.02 225)", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.role}</span>
            </div>
            <span style={{ color: "oklch(0.7 0.02 225)", fontSize: "0.8rem", marginLeft: "auto", display: "flex" }}>✎</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "none",
              color: "oklch(0.85 0.02 225)",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s, color 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "oklch(1 0 0 / 0.05)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "oklch(0.85 0.02 225)";
            }}
          >
            <Icon name="logout" style={{ width: 18, height: 18, stroke: "currentColor" }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
        <header className="topbar" style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 30px", borderBottom: "1px solid var(--line-soft)", background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(12px)", boxShadow: "0 1px 2px rgba(0, 0, 0, 0.01)" }}>
          <div className="page-title">
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--ink)" }}>
              {view === "overview" && "SaaS Dashboard"}
              {view === "accounts" && "Subscriber Directory"}
              {view === "revenue" && "Financial Metrics"}
              {view === "twilio" && "Twilio Carrier Cost Engine"}
              {view === "maileroo" && "Maileroo Delivery Hub"}
              {view === "health" && "Core Reliability Control"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              {view === "overview" && "Early-stage metrics (487 paying base accounts)"}
              {view === "accounts" && "Active family numbers configuration registers"}
              {view === "revenue" && "Subscription transactions & monthly recurring revenue movement"}
              {view === "twilio" && "Telephony metered billing and prepaid balance control"}
              {view === "maileroo" && "SMTP queue logs, bounce analytics, and template statistics"}
              {view === "health" && "Uptime statistics, latency, and incident reports"}
            </p>
          </div>

          <div className="topbar-spacer" style={{ flex: 1 }}></div>

          <div className="gsearch" style={{ position: "relative", width: 280 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }}>
              <Icon name="search" style={{ width: 16, height: 16 }} />
            </span>
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              className="topbar-input"
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                fontSize: "0.88rem",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                outline: "none",
              }}
            />
          </div>
        </header>

        {/* Content Section */}
        <div className="content" style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
          <div className="content-inner wide" style={{ maxWidth: 1200, margin: "0 auto" }}>
            
            {/* VIEW: OVERVIEW */}
            {view === "overview" && (
              <>
                {/* KPI Metrics */}
                <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Monthly Recurring Revenue (MRR)</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtUSD(KPI.mrr)}</div>
                    <div className="trend trend-up" style={{ fontSize: "0.76rem", fontWeight: 600, color: "oklch(0.5 0.13 158)", marginTop: 6 }}>
                      +8.4% this month
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>ARR Run Rate</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtUSD(KPI.arr)}</div>
                    <div className="trend" style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                      Active projection
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Active Accounts Base</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtNum(KPI.accounts)}</div>
                    <div className="trend trend-up" style={{ fontSize: "0.76rem", fontWeight: 600, color: "oklch(0.5 0.13 158)", marginTop: 6 }}>
                      +{KPI.accountsNew} new signups
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Global Phone Lines</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtNum(KPI.activeNumbers)}</div>
                    <div className="trend" style={{ fontSize: "0.76rem", color: "oklch(0.5 0.13 158)", marginTop: 6 }}>
                      99.98% carrier uptime
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
                  {/* Growth History list chart simulation */}
                  <div className="card">
                    <div className="card-head">
                      <h2>Monthly Revenue Curve</h2>
                      <p>Trailing 12-month MRR growth trajectory</p>
                    </div>
                    <div className="card-pad">
                      <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
                        {MRR_SERIES.map((val, idx) => (
                          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div
                              style={{
                                width: "100%",
                                height: (val / 10000) * 140,
                                background: "linear-gradient(180deg, var(--blue) 0%, var(--teal) 100%)",
                                borderRadius: "3px 3px 0 0",
                              }}
                            ></div>
                            <span style={{ fontSize: "0.68rem", color: "var(--ink-faint)", marginTop: 4 }}>{MONTHS[idx]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Plan Segment Distribution */}
                  <div className="card">
                    <div className="card-head">
                      <h2>Product Pricing Split</h2>
                      <p>Distribution of active subscriber plans base</p>
                    </div>
                    <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {PLAN_SPLIT.map((plan) => (
                        <div key={plan.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <b>{plan.name} Tier</b>
                            <span>{plan.count} users ({fmtUSD(plan.mrr)} MRR)</span>
                          </div>
                          <div className="usage-bar bigbar" style={{ height: 12, background: "var(--tint)", borderRadius: 99, overflow: "hidden" }}>
                            <i style={{ display: "block", height: "100%", width: `${(plan.count / KPI.accounts) * 100}%`, background: plan.color }}></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* VIEW: ACCOUNTS */}
            {view === "accounts" && (
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2>Active Accounts Base Directory</h2>
                    <p>Showing {filteredAccounts.length} of {accounts.length} search records</p>
                  </div>
                </div>
                <div className="card-pad" style={{ padding: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                        <th style={{ padding: "14px 20px" }}>Account ID</th>
                        <th style={{ padding: "14px 20px" }}>Owner</th>
                        <th style={{ padding: "14px 20px" }}>Active Lines</th>
                        <th style={{ padding: "14px 20px" }}>MRR Value</th>
                        <th style={{ padding: "14px 20px" }}>Join Date</th>
                        <th style={{ padding: "14px 20px" }}>Status</th>
                        <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((acc) => (
                        <tr key={acc.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                          <td style={{ padding: "14px 20px", fontFamily: "var(--mono)", fontSize: "0.84rem" }}>{acc.id}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ width: 28, height: 28, borderRadius: "50%", background: acc.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.75rem" }}>
                                {acc.owner[0]}
                              </span>
                              <div>
                                <b style={{ color: "var(--ink)", display: "block" }}>{acc.owner}</b>
                                <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>{acc.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <b>{acc.numbers} line(s)</b>
                            <span style={{ fontSize: "0.78rem", color: "var(--ink-faint)", display: "block" }}>{acc.city} ({acc.area})</span>
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: 600 }}>{fmtUSD(acc.mrr, 2)}/mo</td>
                          <td style={{ padding: "14px 20px", color: "var(--ink-soft)" }}>{acc.joined}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: 99,
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                background: acc.status === "active" ? "oklch(0.95 0.05 158)" : "oklch(0.96 0.05 75)",
                                color: acc.status === "active" ? "oklch(0.42 0.13 158)" : "oklch(0.5 0.13 60)",
                              }}
                            >
                              {acc.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right" }}>
                            <button
                              onClick={() => {
                                if (typeof window !== "undefined") {
                                  localStorage.setItem("isLoggedIn", "true");
                                  localStorage.setItem("impersonatingUser", JSON.stringify(acc));
                                  window.location.href = "/dashboard";
                                }
                              }}
                              className="btn btn-soft btn-sm"
                              style={{ padding: "6px 12px", fontSize: "0.8rem", fontWeight: 600 }}
                            >
                              Impersonate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW: REVENUE */}
            {view === "revenue" && (
              <>
                {/* Movement grid */}
                <div className="card section-gap" style={{ marginBottom: 24 }}>
                  <div className="card-head">
                    <h2>Monthly Revenue Movements</h2>
                    <p>MRR additions and churn components this cycle</p>
                  </div>
                  <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
                    {MRR_MOVEMENT.map((mov, i) => (
                      <div key={i} style={{ background: "var(--surface-2)", border: "1px solid var(--line)", padding: 16, borderRadius: "var(--r-md)" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>{mov.label}</span>
                        <div style={{ fontSize: "1.45rem", fontWeight: 700, marginTop: 4, color: mov.kind === "pos" ? "oklch(0.45 0.13 158)" : "oklch(0.55 0.18 22)" }}>
                          {mov.amt > 0 ? "+" : ""}{fmtUSD(mov.amt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ledger Transactions */}
                <div className="card">
                  <div className="card-head">
                    <h2>Recent Ledger Transactions</h2>
                    <p>Credit card processing logs via Stripe/Creem Gateway</p>
                  </div>
                  <div className="card-pad" style={{ padding: 0 }}>
                    {TRANSACTIONS.map((tx) => (
                      <div key={tx.id} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                        <div>
                          <b style={{ color: "var(--ink)", display: "block" }}>{tx.acct}</b>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-faint)" }}>{tx.plan} &bull; ID: {tx.id}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 700, color: tx.kind === "paid" ? "oklch(0.42 0.13 158)" : "oklch(0.55 0.18 22)" }}>
                            {tx.kind === "paid" ? "" : "-"}{fmtUSD(tx.amt, 2)}
                          </span>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-faint)", display: "block", marginTop: 4 }}>{tx.when}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* VIEW: TWILIO */}
            {view === "twilio" && (
              <>
                {/* Twilio KPI row */}
                <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>MTD Telephony Spend</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtUSD(TWILIO.spend)}</div>
                    <div className="trend trend-up" style={{ fontSize: "0.76rem", fontWeight: 600, color: "oklch(0.55 0.18 22)", marginTop: 6 }}>
                      +8.6% MTD projected: {fmtUSD(TWILIO.projected)}
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Gross Operating Margin</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>
                      {((1 - TWILIO.spend / KPI.mrr) * 100).toFixed(1)}%
                    </div>
                    <div className="trend" style={{ fontSize: "0.76rem", color: "oklch(0.5 0.13 158)", marginTop: 6 }}>
                      {fmtUSD(KPI.mrr - TWILIO.spend)} retained / mo
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Prepaid Account Balance</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtUSD(TWILIO.balance)}</div>
                    <div className="trend" style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                      Recharges at {fmtUSD(TWILIO.autoRecharge)} threshold
                    </div>
                  </div>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Cost Per Inbound Call</div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>{fmtUSD(TWILIO.costPerCall, 3)}</div>
                    <div className="trend" style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                      {fmtUSD(TWILIO.costPerNumber, 2)}/number renewal fee
                    </div>
                  </div>
                </div>

                {/* Twilio breakdown & spend trend */}
                <div className="grid-7-5" style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 18, marginBottom: 24 }}>
                  <div className="card">
                    <div className="card-head">
                      <h2>Twilio Cost Breakdown</h2>
                      <p>Telemetry spend categories for active billing cycle</p>
                    </div>
                    <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {TWILIO.breakdown.map((b) => (
                        <div key={b.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <b>{b.label}</b>
                            <span>{fmtUSD(b.amt)} ({Math.round((b.amt / TWILIO.spend) * 100)}%)</span>
                          </div>
                          <div className="usage-bar" style={{ height: 10, background: "var(--tint)", borderRadius: 99, overflow: "hidden" }}>
                            <i style={{ display: "block", height: "100%", width: `${(b.amt / TWILIO.spend) * 100}%`, background: b.color }}></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-head">
                      <h2>Carrier Reliability</h2>
                      <p>Twilio delivery health &amp; API setup stats</p>
                    </div>
                    <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line-soft)", paddingBottom: 8 }}>
                        <span>Twilio API Success Rate</span>
                        <b style={{ color: "oklch(0.42 0.13 158)" }}>{TWILIO.reliability.apiSuccess}%</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line-soft)", paddingBottom: 8 }}>
                        <span>Call Setup Latency</span>
                        <b>{TWILIO.reliability.avgLatencyMs}ms</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line-soft)", paddingBottom: 8 }}>
                        <span>SMS Undelivered</span>
                        <b style={{ color: "oklch(0.55 0.18 22)" }}>{TWILIO.reliability.smsUndelivered}%</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Voice Call Fail Rate</span>
                        <b style={{ color: "oklch(0.42 0.13 158)" }}>{TWILIO.reliability.callErrorRate}%</b>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metered usage quantities */}
                <div className="card">
                  <div className="card-head">
                    <h2>Consumption Analytics</h2>
                    <p>Total metered traffic counts across the global Twilio pool</p>
                  </div>
                  <div className="card-pad">
                    <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 16, background: "var(--surface-2)" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{fmtNum(TWILIO.usage.voiceMin)}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)", marginTop: 6 }}>Voice Minutes Used</div>
                        <span style={{ fontSize: "0.74rem", color: "var(--ink-faint)", display: "block", marginTop: 2 }}>{fmtNum(TWILIO.usage.voiceIn)} in &bull; {fmtNum(TWILIO.usage.voiceOut)} out</span>
                      </div>
                      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 16, background: "var(--surface-2)" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{fmtNum(TWILIO.usage.sms)}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)", marginTop: 6 }}>SMS Dispatched</div>
                        <span style={{ fontSize: "0.74rem", color: "var(--ink-faint)", display: "block", marginTop: 2 }}>{fmtNum(TWILIO.usage.smsAlerts)} alerts &bull; {fmtNum(TWILIO.usage.sms2fa)} security</span>
                      </div>
                      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 16, background: "var(--surface-2)" }}>
                        <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{fmtNum(TWILIO.usage.transcriptions)}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--ink-faint)", marginTop: 6 }}>Voice Transcriptions</div>
                        <span style={{ fontSize: "0.74rem", color: "var(--ink-faint)", display: "block", marginTop: 2 }}>{fmtNum(TWILIO.usage.recordings)} recordings stored</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* VIEW: HEALTH */}
            {view === "health" && (
              <>
                {/* Incidents logs */}
                <div className="card section-gap" style={{ marginBottom: 24 }}>
                  <div className="card-head">
                    <div>
                      <h2>Operational Incident History</h2>
                      <p>Trailing incidents and carriers auto-failover reports</p>
                    </div>
                  </div>
                  <div className="card-pad" style={{ padding: 0 }}>
                    {HEALTH.incidents.map((inc) => (
                      <div key={inc.id} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                        <div>
                          <b style={{ color: "var(--ink)", display: "block" }}>{inc.title}</b>
                          <span style={{ fontSize: "0.78rem", color: "var(--ink-faint)" }}>{inc.detail} &bull; {inc.when}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: 99,
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              background: inc.sev === "resolved" ? "oklch(0.95 0.05 158)" : "oklch(0.96 0.05 75)",
                              color: inc.sev === "resolved" ? "oklch(0.42 0.13 158)" : "oklch(0.5 0.13 60)",
                            }}
                          >
                            {inc.sev}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regional health connects */}
                <div className="card">
                  <div className="card-head">
                    <h2>Active Inbound Connect Rates by Region</h2>
                    <p>Live stats of Twilio line connectors per city pool</p>
                  </div>
                  <div className="card-pad" style={{ padding: 0 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                      <thead>
                        <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                          <th style={{ padding: "14px 20px" }}>City Pool</th>
                          <th style={{ padding: "14px 20px" }}>Area Code</th>
                          <th style={{ padding: "14px 20px" }}>Configured Lines</th>
                          <th style={{ padding: "14px 20px" }}>Call Connect Success</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HEALTH.regions.map((reg) => (
                          <tr key={reg.code} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                            <td style={{ padding: "14px 20px", fontWeight: 600 }}>{reg.city}</td>
                            <td style={{ padding: "14px 20px", fontFamily: "var(--mono)" }}>{reg.code}</td>
                            <td style={{ padding: "14px 20px" }}>{reg.numbers} active lines</td>
                            <td style={{ padding: "14px 20px", fontWeight: 700, color: reg.connect > 94 ? "oklch(0.42 0.13 158)" : "oklch(0.5 0.13 60)" }}>
                              {reg.connect}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* VIEW: MAILEROO */}
            {view === "maileroo" && (
              <>
                {/* KPI metrics row */}
                <div className="stat-grid section-gap" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 22 }}>
                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="ic" style={{ background: "var(--tint)", color: "var(--blue-deep)", width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", marginBottom: 14 }}>
                      <Icon name="mail" style={{ width: 19, height: 19 }} />
                    </div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700 }}>{MAILEROO.totalSent}</div>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)", marginTop: 5 }}>Total Sent (30d)</div>
                  </div>

                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="ic" style={{ background: "oklch(0.95 0.05 158)", color: "oklch(0.45 0.13 158)", width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", marginBottom: 14 }}>
                      <Icon name="check" style={{ width: 19, height: 19 }} />
                    </div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700 }}>{MAILEROO.deliverySuccess}%</div>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)", marginTop: 5 }}>Delivery Success</div>
                  </div>

                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="ic" style={{ background: "oklch(0.96 0.05 22)", color: "var(--rose)", width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", marginBottom: 14 }}>
                      <Icon name="alert" style={{ width: 19, height: 19 }} />
                    </div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700 }}>{MAILEROO.bounceRate}%</div>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)", marginTop: 5 }}>Bounce Rate</div>
                  </div>

                  <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                    <div className="ic" style={{ background: "oklch(0.96 0.04 285)", color: "var(--violet)", width: 38, height: 38, borderRadius: 11, display: "grid", placeItems: "center", marginBottom: 14 }}>
                      <Icon name="health" style={{ width: 19, height: 19 }} />
                    </div>
                    <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700 }}>{MAILEROO.avgLatency}</div>
                    <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)", marginTop: 5 }}>Avg. Dispatch Latency</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 22 }}>
                  {/* Left: Queue Table */}
                  <div className="card">
                    <div className="card-head">
                      <div>
                        <h2>SMTP Delivery Queue Logs</h2>
                        <p>Real-time Maileroo API message statuses</p>
                      </div>
                      <span className="badge badge-green">SMTP: {MAILEROO.smtpQueueStatus}</span>
                    </div>
                    <div className="card-pad" style={{ padding: 0 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                        <thead>
                          <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                            <th style={{ padding: "12px 16px" }}>Recipient</th>
                            <th style={{ padding: "12px 16px" }}>Category</th>
                            <th style={{ padding: "12px 16px" }}>Message ID</th>
                            <th style={{ padding: "12px 16px", textAlign: "right" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MAILEROO.logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                              <td style={{ padding: "12px 16px" }}>
                                <b style={{ display: "block", color: "var(--ink)", fontSize: "0.88rem" }}>{log.email}</b>
                                <span style={{ fontSize: "0.76rem", color: "var(--ink-faint)" }}>{log.timestamp}</span>
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: "0.84rem", color: "var(--ink-soft)" }}>{log.category}</td>
                              <td style={{ padding: "12px 16px", fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--ink-faint)" }}>{log.msgId}</td>
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <span
                                  className={`badge ${log.status === "delivered" ? "badge-green" : "badge-rose"}`}
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Templates/Categories Breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <div>
                        <h2 style={{ fontSize: "1.08rem", fontWeight: 700 }}>Dispatch Distribution</h2>
                        <p style={{ fontSize: "0.84rem", color: "var(--ink-faint)", marginTop: 2 }}>Outbound volume segmented by transactional template</p>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {MAILEROO.categories.map((cat) => (
                          <div key={cat.name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.86rem" }}>
                              <b style={{ color: "var(--ink-soft)" }}>{cat.name}</b>
                              <span style={{ fontWeight: 600 }}>{cat.count} ({cat.pct}%)</span>
                            </div>
                            <div style={{ height: 8, background: "var(--tint)", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${cat.pct}%`, height: "100%", background: cat.color, borderRadius: 99 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="card card-pad" style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--surface-2)" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--tint)", color: "var(--blue-deep)", display: "grid", placeItems: "center", flex: "none" }}>
                        <Icon name="shield" style={{ width: 22, height: 22 }} />
                      </div>
                      <div>
                        <b style={{ display: "block", fontSize: "0.92rem" }}>SPF & DKIM Verified</b>
                        <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>Maileroo DNS alignment check: 100% compliant</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onSave={(newProfile) => {
            setProfile(newProfile);
            localStorage.setItem("adminProfile", JSON.stringify(newProfile));
            setShowProfileModal(false);
            showToast("Profile settings updated!");
          }}
        />
      )}
    </div>
  );
}
