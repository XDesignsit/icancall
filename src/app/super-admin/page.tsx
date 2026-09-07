"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const fmtUSD = (n: number, dp: number = 0) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

// Twilio reports a single signed figure. On a prepaid account it is credit
// remaining, counting down as usage and number renewals are billed against it,
// with the numbers going dead at zero. On an invoiced account, or a prepaid one
// that has been drawn past its credit, the same field goes negative and means
// money owed. The two read in opposite directions -- a small number is nearly
// out of credit, a negative one is a debt -- so the label, sign and tone are
// all derived rather than assumed.
const LOW_CREDIT = 20;
const CRITICAL_CREDIT = 5;

interface CreditState {
  label: string;
  amount: string;
  color: string;
  note: string;
}

function creditState(balance: number | undefined, currency: string | undefined): CreditState {
  const unit = currency ?? "USD";
  if (typeof balance !== "number" || Number.isNaN(balance)) {
    return {
      label: "Credit Remaining",
      amount: "—",
      color: "var(--ink-faint)",
      note: "Prepaid credit remaining",
    };
  }

  // Negative means owed, so show the magnitude under an "amount due" label
  // rather than a minus sign against a word that implies the opposite.
  if (balance < 0) {
    return {
      label: "Balance Due",
      amount: `${unit} ${Math.abs(balance).toFixed(2)}`,
      color: "oklch(0.55 0.18 22)",
      note: "Owed to Twilio — settle before the account is suspended.",
    };
  }

  const amount = `${unit} ${balance.toFixed(2)}`;
  if (balance <= CRITICAL_CREDIT) {
    return {
      label: "Credit Remaining",
      amount,
      color: "oklch(0.55 0.18 22)",
      note: "Critically low — numbers stop working at zero. Top up before testing.",
    };
  }
  if (balance <= LOW_CREDIT) {
    return {
      label: "Credit Remaining",
      amount,
      color: "oklch(0.62 0.15 65)",
      note: "Running low — top up before a long test session.",
    };
  }
  return {
    label: "Credit Remaining",
    amount,
    color: "var(--ink)",
    note: "Prepaid credit remaining, live from Twilio",
  };
}

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
  const [view, setView] = useState("accounts");

  interface TwilioNumber { phoneNumber: string; friendlyName: string }
  interface TwilioState {
    configured: boolean;
    reason?: string;
    sender?: string;
    balance?: number;
    currency?: string;
    balanceError?: string;
    spendThisMonth?: number;
    spendCurrency?: string;
    spendError?: string;
    numbers?: TwilioNumber[];
    numberCount?: number;
    numbersError?: string;
  }
  const [twilio, setTwilio] = useState<TwilioState | null>(null);
  const [twilioLoading, setTwilioLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setToast] = useState<string | null>(null);
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
    if (view !== "twilio" || twilio || twilioLoading) return;
    setTwilioLoading(true);
    fetch("/api/admin/twilio")
      .then((r) => r.json())
      .then((d) => setTwilio(d))
      .catch(() => setTwilio({ configured: false, reason: "Could not reach the Twilio status endpoint." }))
      .finally(() => setTwilioLoading(false));
  }, [view, twilio, twilioLoading]);

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
            { id: "accounts", label: "Subscriber Base", icon: "users" },
            { id: "twilio", label: "Twilio Account", icon: "cloud" },
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
              {view === "accounts" && "Subscriber Directory"}
              {view === "twilio" && "Twilio Account"}
            </h1>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              {view === "accounts" && "Active family numbers configuration registers"}
              {view === "twilio" && "Live balance, month-to-date spend and provisioned numbers"}
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

            {/* VIEW: TWILIO */}
            {view === "twilio" && (
              <>
                {twilioLoading && (
                  <div className="card" style={{ padding: 20, color: "var(--ink-soft)" }}>Loading Twilio account data…</div>
                )}

                {!twilioLoading && twilio && twilio.configured === false && (
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>Twilio is not configured in this environment</div>
                    <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>{twilio.reason}</div>
                  </div>
                )}

                {!twilioLoading && twilio && twilio.configured && (
                  <>
                    <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                      <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                        <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>
                          {creditState(twilio.balance, twilio.currency).label}
                        </div>
                        <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, marginTop: 6, color: creditState(twilio.balance, twilio.currency).color }}>
                          {creditState(twilio.balance, twilio.currency).amount}
                        </div>
                        <div className="trend" style={{ fontSize: "0.76rem", marginTop: 6, color: creditState(twilio.balance, twilio.currency).color }}>
                          {twilio.balanceError
                            ? `Unavailable: ${twilio.balanceError}`
                            : creditState(twilio.balance, twilio.currency).note}
                        </div>
                      </div>
                      <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                        <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Spend This Month</div>
                        <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>
                          {typeof twilio.spendThisMonth === "number" ? `${twilio.spendCurrency ?? "USD"} ${twilio.spendThisMonth.toFixed(2)}` : "—"}
                        </div>
                        <div className="trend" style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                          {twilio.spendError ? `Unavailable: ${twilio.spendError}` : "Month-to-date, all categories"}
                        </div>
                      </div>
                      <div className="stat" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                        <div className="lbl" style={{ fontSize: "0.82rem", color: "var(--ink-faint)" }}>Provisioned Numbers</div>
                        <div className="val" style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink)", marginTop: 6 }}>
                          {typeof twilio.numberCount === "number" ? twilio.numberCount : "—"}
                        </div>
                        <div className="trend" style={{ fontSize: "0.76rem", color: "var(--ink-faint)", marginTop: 6 }}>
                          {twilio.numbersError ? `Unavailable: ${twilio.numbersError}` : `A2P sender ${twilio.sender ?? "—"}`}
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-head" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                        <h2>Numbers on the Twilio Account</h2>
                      </div>
                      <div style={{ padding: "8px 20px 18px" }}>
                        {(twilio.numbers ?? []).length === 0 && (
                          <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)", padding: "12px 0" }}>
                            No numbers are provisioned on this Twilio account yet.
                          </div>
                        )}
                        {(twilio.numbers ?? []).map((n) => (
                          <div key={n.phoneNumber} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--line-soft)", fontSize: "0.9rem" }}>
                            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{n.phoneNumber}</span>
                            <span style={{ color: "var(--ink-soft)" }}>{n.friendlyName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
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
