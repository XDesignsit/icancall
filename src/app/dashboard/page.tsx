"use client";

import React, { useState, useRef, useEffect } from "react";

import { dashboardExtraTranslations } from "@/lib/dashboardExtraTranslations";
import { dashboardTranslations } from "@/lib/dashboardTranslations";
import { isDemoEmail } from "@/lib/demoEmails";
import { planConfig } from "@/lib/planConfig";

import {
  AVATAR_COLORS,
  getLineDefaultLabel,
  getLocalizedLineLabel,
  getLocalizedPersonName,
} from "./_data";
import { ICONS, Icon } from "./_icons";
import { AreaFlag, fetchNumbersLive } from "./_numbers";
import { initials, Modal, Toast } from "./_primitives";
import type {
  Account,
  CallLogEntry,
  Contact,
  CoverageSlot,
  Line,
  PickerNumber,
} from "./_types";
import { AccountView } from "./views/AccountView";
import { CallLogView } from "./views/CallLogView";
import { ContactsView } from "./views/ContactsView";
import { OverviewView } from "./views/OverviewView";
import { RoutingView } from "./views/RoutingView";
import { SettingsView } from "./views/SettingsView";
import { TeamAdminView } from "./views/TeamAdminView";

/* ============ MAIN APPLICATION SHELL ============ */
// NAV and TITLES are built inside the component from translated strings; the
// English-only module-level copies were dead and have been removed.

const LINE_SCOPED = {
  overview: false,
  team: false,
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

interface StoredLineData {
  label: string;
  person: string;
  number: string;
  mode?: Line["mode"];
  minutesUsed?: number;
  contacts?: number | Contact[];
}

interface StoredAccountData {
  owner?: string;
  name?: string;
  area?: string;
  lines?: StoredLineData[];
}

interface ProfileSettings {
  role?: string;
  notifyEmail?: string;
  phone?: string;
  smsPhone?: string;
  address?: string;
  billingAddr?: string;
  timezone?: string;
  language?: string;
  twoFactor?: boolean;
  card?: Account["card"];
  plan?: Account["plan"];
  billingCycle?: Account["billingCycle"];
  addons?: Account["addons"];
  avatarUrl?: string;
}

interface ProfileRow {
  name?: string;
  preferred_name?: string;
  email?: string;
  settings?: ProfileSettings;
}

interface DbLineRow {
  id: string;
  number: string;
  name: string;
  type: string;
  contacts?: Contact[];
  settings?: {
    color?: string;
    mode?: Line["mode"];
    minutesUsed?: number;
    schedule?: CoverageSlot[];
    extraSettings?: Line["settings"];
  };
}

function generateDynamicLines(accountData: StoredAccountData | null): Line[] {
  if (!accountData || !accountData.lines) return [];
  const ownerName = accountData.owner || accountData.name || "";
  const ownerLastName = ownerName ? (ownerName.split(" ").slice(-1)[0] || "") : "";
  const areaCode = accountData.area || "415";

  return accountData.lines.map((ln, idx) => {
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

  // Stagger each line's timestamps so an account with several numbers doesn't
  // show the same clock time on every one of them.
  const stamp = (day: string, hour: number, minute: number, offset: number) => {
    const total = (hour * 60 + minute - offset + 1440) % 1440;
    const h24 = Math.floor(total / 60);
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${day} · ${h12}:${String(total % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
  };

  linesList.forEach((ln, lineIdx) => {
    const contacts = ln.contacts;
    const shift = lineIdx * 23;
    const logs: CallLogEntry[] = Array.from({ length: 5 }).map((_, lIdx) => {
      const status = statusOptions[lIdx % statusOptions.length];
      const contact = contacts[lIdx % contacts.length];
      const caller = contact ? `${contact.name} (mobile)` : callerNames[lIdx % callerNames.length];
      const when = lIdx === 0 ? stamp("Today", 14, 48, shift)
        : lIdx === 1 ? stamp("Today", 11, 2, shift)
        : lIdx === 2 ? stamp("Yesterday", 19, 14, shift)
        : lIdx === 3 ? stamp("Yesterday", 9, 30, shift)
        : stamp("Mon", 15, 20, shift);
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

  const [requestedView, setView] = useState("overview");
  const [activeVoicemail, setActiveVoicemail] = useState<{
    recordingUrl: string;
    transcription: string;
    caller: string;
    duration: string;
  } | null>(null);

  const [impersonatingUser, setImpersonatingUser] = useState<{ email: string; name: string } | null>(null);
  const [acctTab, setAcctTab] = useState("profile");
  const [autoOpenPlanModal, setAutoOpenPlanModal] = useState(false);
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
    plan: "pro",
    billingCycle: "monthly",
    addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 41, rolloverMin: 18 },
    avatarUrl: "",
  });

  const [lang, setLang] = useState<"en" | "es" | "fr" | "ja" | "zh" | "ar" | "hi" | "pt" | "de" | "it" | "ko">("en");

  // Whether the signed-in user owns this account or is an invited Care Team
  // caregiver ("member"). Members manage lines/contacts/routing but not billing.
  const [viewerRole, setViewerRole] = useState<"owner" | "member">("owner");

  // 1. Loading and Syncing States
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  // Only allow syncing back to the server after server data actually loaded;
  // otherwise a failed load would push the hardcoded placeholder account/lines
  // over the user's real data (the lines POST also deletes unlisted rows).
  const serverDataLoadedRef = useRef(false);

  // 2. Client-side profile to account mapping
  const mapProfileToAccount = (profile: ProfileRow): Account => {
    const settings = profile.settings || {};
    return {
      name: profile.name || "",
      preferred: profile.preferred_name || "",
      role: settings.role || "Primary caregiver",
      email: profile.email || "",
      notifyEmail: settings.notifyEmail || profile.email || "",
      phone: settings.phone || settings.smsPhone || "",
      address: settings.address || settings.billingAddr || "",
      timezone: settings.timezone || "Pacific (PT)",
      language: settings.language || "English",
      twoFactor: !!settings.twoFactor,
      card: settings.card || { brand: "Visa", last4: "4242", exp: "08 / 27" },
      billingAddr: settings.billingAddr || "",
      plan: settings.plan || "pro",
      billingCycle: settings.billingCycle || "monthly",
      addons: settings.addons || { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
      avatarUrl: settings.avatarUrl || "",
    };
  };

  const mapAccountToProfile = (account: Account) => {
    return {
      name: account.name,
      preferred_name: account.preferred,
      settings: {
        role: account.role,
        notifyEmail: account.notifyEmail,
        phone: account.phone,
        smsPhone: account.phone,
        address: account.address,
        timezone: account.timezone,
        language: account.language,
        twoFactor: account.twoFactor,
        card: account.card,
        billingAddr: account.billingAddr,
        plan: account.plan,
        billingCycle: account.billingCycle,
        addons: account.addons,
        avatarUrl: account.avatarUrl || ""
      }
    };
  };

  const mapDbLinesToFrontend = (dbLines: DbLineRow[]): Line[] => {
    return dbLines.map((row) => {
      const s = row.settings || {};
      return {
        id: row.id,
        number: row.number,
        label: row.name,
        person: row.type,
        contacts: row.contacts || [],
        color: s.color || "oklch(0.58 0.115 232)",
        mode: s.mode || "menu",
        minutesUsed: s.minutesUsed || 0,
        schedule: s.schedule || [],
        settings: s.extraSettings || {},
      };
    });
  };

  // Header Add-on configuration states
  const [headerAddonModalOpen, setHeaderAddonModalOpen] = useState(false);
  const [headerAreaCode, setHeaderAreaCode] = useState("470");
  const [headerNumbersList, setHeaderNumbersList] = useState<PickerNumber[]>([]);
  const [headerSelectedNumber, setHeaderSelectedNumber] = useState<PickerNumber | null>(null);
  const [headerIsSearching, setHeaderIsSearching] = useState(false);

  const loadHeaderNumbers = (ac: string) => {
    setHeaderIsSearching(true);
    fetchNumbersLive(ac, 6).then((nums) => {
      setHeaderNumbersList(nums);
      setHeaderIsSearching(false);
    });
  };

  const [headerRemovalLine, setHeaderRemovalLine] = useState<Line | null>(null);

  // 3. Load profile and phone lines from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch("/api/caregiver/profile");
        if (profileRes.status === 401) {
          localStorage.removeItem("isLoggedIn");
          window.location.href = "/login?unauthorized=true";
          return;
        }
        if (!profileRes.ok) throw new Error("profile_fetch_failed");
        const profileData = await profileRes.json();
        setViewerRole(profileData.role === "member" ? "member" : "owner");

        const linesRes = await fetch("/api/caregiver/lines");
        if (linesRes.status === 401) {
          localStorage.removeItem("isLoggedIn");
          window.location.href = "/login?unauthorized=true";
          return;
        }
        if (!linesRes.ok) throw new Error("lines_fetch_failed");
        const linesData = await linesRes.json();

        const currentAccount = profileData.profile ? mapProfileToAccount(profileData.profile) : null;
        if (currentAccount) {
          setAccount(currentAccount);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("ic_account_data", JSON.stringify(currentAccount));
        }

        if (Array.isArray(linesData.lines)) {
          const mappedLines = mapDbLinesToFrontend(linesData.lines);
          setLines(mappedLines);
          localStorage.setItem("ic_lines_data", JSON.stringify(mappedLines));
          if (mappedLines[0]) {
            setActiveLineId(mappedLines[0].id);
          }

          // Demo logins get sample call history keyed to their own numbers so
          // the call log and the team admin analytics have something to show.
          // Real accounts only ever see calls their own numbers received.
          if (currentAccount && isDemoEmail(currentAccount.email)) {
            setLog(generateDynamicLogs(mappedLines));
          }

          // Auto-heal extraNumbers out-of-sync states on load
          if (currentAccount) {
            const baseLinesLimit = planConfig(currentAccount.plan).includedLines;
            const correctExtraNumbers = Math.max(0, mappedLines.length - baseLinesLimit);
            if (currentAccount.addons && currentAccount.addons.extraNumbers !== correctExtraNumbers) {
              console.log(`[Auto-heal] Correcting extraNumbers from ${currentAccount.addons.extraNumbers} to ${correctExtraNumbers}`);
              currentAccount.addons.extraNumbers = correctExtraNumbers;
              setAccount({ ...currentAccount });
              localStorage.setItem("ic_account_data", JSON.stringify(currentAccount));
            }
          }
        }

        serverDataLoadedRef.current = true;
      } catch (err) {
        console.error("Error loading dashboard data, falling back to localStorage:", err);
        const cachedAcc = localStorage.getItem("ic_account_data");
        const cachedLines = localStorage.getItem("ic_lines_data");
        if (cachedAcc) {
          try {
            setAccount(JSON.parse(cachedAcc));
          } catch {}
        }
        if (cachedLines) {
          try {
            const parsedLines = JSON.parse(cachedLines);
            setLines(parsedLines);
            if (parsedLines[0]) {
              setActiveLineId(parsedLines[0].id);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }
    loadData();
  }, []);

  // 4. Synchronize profile/account updates to Supabase
  useEffect(() => {
    if (!initialLoadComplete || !serverDataLoadedRef.current) return;
    const imp = localStorage.getItem("impersonatingUser");
    if (imp) return; // Skip updating real user database if impersonating

    async function syncProfile() {
      try {
        await fetch("/api/caregiver/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mapAccountToProfile(account)),
        });
      } catch (err) {
        console.error("Error syncing profile to backend:", err);
      }
    }
    syncProfile();
  }, [account, initialLoadComplete]);

  // 5. Synchronize lines updates to Supabase
  useEffect(() => {
    if (!initialLoadComplete || !serverDataLoadedRef.current) return;
    const imp = localStorage.getItem("impersonatingUser");
    if (imp) return; // Skip updating real user database if impersonating

    async function syncLines() {
      try {
        await fetch("/api/caregiver/lines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines }),
        });
      } catch (err) {
        console.error("Error syncing phone lines to backend:", err);
      }
    }
    syncLines();
  }, [lines, initialLoadComplete]);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
    if (savedLang && validLangs.includes(savedLang)) {
      setLang(savedLang as typeof lang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const syncLang = () => {
      const savedLang = localStorage.getItem("lang");
      const validLangs = ["en", "es", "fr", "ja", "zh", "ar", "hi", "pt", "de", "it", "ko"];
      if (savedLang && validLangs.includes(savedLang)) {
        setLang(savedLang as typeof lang);
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
  const ext = dashboardExtraTranslations[lang] || dashboardExtraTranslations.en;

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
      items: [
        { id: "log", label: d.nav.log, icon: "log" as keyof typeof ICONS, badge: true },
        // Account-wide admin view: only plans with more than one caregiver seat
        // (Care Team) manage numbers on behalf of a whole team.
        ...(planConfig(account.plan).seats > 1
          ? [{ id: "team", label: ext.adminNav, icon: "shield" as keyof typeof ICONS }]
          : []),
      ],
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
    team: [ext.adminTitle, ext.adminSub],
    settings: [d.titles.settings, d.titles.settingsSub],
    account: [d.titles.account, d.titles.accountSub],
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if session is impersonated
      const imp = localStorage.getItem("impersonatingUser");
      if (imp) {
        try {
          const userObj = JSON.parse(imp);
          const ownerName = userObj.owner || userObj.name || "Test User";
          const ownerEmail = userObj.email || "";
          setImpersonatingUser({ name: ownerName, email: ownerEmail });

          const rawCycle = userObj.billing || userObj.billingCycle || "monthly";
          const mappedCycle = rawCycle === "annual" ? "yearly" : (rawCycle === "yearly" ? "yearly" : "monthly");

          setAccount((prev) => ({
            ...prev,
            name: ownerName,
            preferred: ownerName.split(" ")[0] || ownerName,
            email: ownerEmail,
            notifyEmail: ownerEmail,
            plan: userObj.plan || prev.plan,
            billingCycle: mappedCycle,
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
  const switchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (switchRef.current && !switchRef.current.contains(event.target as Node)) {
        setSwitchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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
    // Clear the HTTP-only session cookie server-side so the next visit
    // requires a fresh login instead of silently reusing the old session
    const clearSession = fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setTimeout(() => {
      clearSession.finally(() => {
        window.location.href = "/";
      });
    }, 750);
  };

  // The team admin view is Care Team only; a stale ?view=team link (or a
  // downgrade) falls back to the overview instead of an empty page.
  const supportsTeamAdmin = planConfig(account.plan).seats > 1;
  const view = requestedView === "team" && !supportsTeamAdmin ? "overview" : requestedView;

  const [t1, t2] = TITLES[view as keyof typeof TITLES] || ["Dashboard", "iCanCall Routing Panel"];

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
          <div style={{ color: "oklch(0.4 0.02 240)", fontSize: "0.95rem", fontWeight: 500 }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {impersonatingUser && (
        <div style={{ background: "oklch(0.35 0.08 28)", color: "#fff", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.88rem", zIndex: 1000, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flex: "none" }}>
          <div>
            Impersonation Mode: Active session for <strong>{impersonatingUser.name}</strong> ({impersonatingUser.email})
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
        <div className="brand" style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <svg
            id="logo"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 553.0305"
            style={{ width: "34px", height: "auto", display: "block", flexShrink: 0 }}
          >
            <style>{`
              #logo .cls-1 { fill: #ffffff; }
              #logo .cls-2 { fill: #a8e2ff; }
              #logo .cls-3 { fill: #ffffff; }
            `}</style>
            <g>
              <path className="cls-1" d="M707.4397,239.6996l-.4398-.6591c-31.0327-46.2476-71.4038-97.0542-117.1563-115.2897-5.2177-2.4717-6.9757-4.9985-2.5277-9.777,4.9441-5.1081,11.2601-11.0948,14.6112-17.796,20.8722-36.6356-8.074-84.4763-50.1482-82.2791-44.1058.769-68.9324,53.1134-43.0062,88.0463,4.1744,6.7561,14.6648,13.4569,16.3129,17.4664.8783,2.3621-.2749,3.9548-2.6913,5.8225-22.9037,11.9189-41.9093,33.4498-63.4398,49.1585-24.9366,18.51-48.3902.5495-73.1069-12.9625-9.777-4.6686-13.7865-8.4035-5.9311-18.8946,20.4873-28.2321-1.3195-70.5248-36.9651-68.438-25.7064.5495-45.2603,25.0466-40.866,50.0929.7147,4.449,2.0879,8.788,4.1744,12.7975,3.7896,8.0743,12.0285,14.226,11.8649,18.8946-.3299,6.0421-9.5584,9.1179-16.8077,15.2146-26.2548,20.4323-47.7867,57.5624-82.9938,31.088-4.7779-3.0758-9.9969-6.5362-14.8847-9.5571-4.6679-3.2404-8.6238-4.8335-9.2272-9.7767-.1649-4.6689,6.9757-11.3697,9.0623-19.7186,8.019-24.7167-16.1479-50.477-41.4694-43.5013-19.1142,4.1195-30.9227,25.7603-24.6617,44.2704,1.868,8.074,10.8752,16.4228,12.5233,20.4873,1.5931,3.6253-2.4714,6.3716-5.5476,8.3489-58.7156,40.4255-120.2325,184.3318-124.0771,280.7269-.6048,22.6295,5.2177,72.887,37.185,64.3185,28.6163-14.0611,45.0941-46.5225,70.4142-67.0098,19.7189-18.3454,45.369-26.3644,67.6693-7.1403,19.9925,14.7201,39.5465,46.2476,68.0528,35.8665,22.8501-8.6781,39.2729-36.4706,61.5719-45.6435,45.4803-17.1369,71.9536,61.7918,117.9274,42.4581,41.688-19.3341,72.832-82.1695,131.5476-53.6079,42.6227,18.7846,78.928,65.8563,121.0022,90.0235,22.1354,12.3584,49.1585,6.6462,64.8117-13.8961,52.9495-82.1145-12.7969-210.1471-52.7832-279.1342ZM687.1173,373.4994l-.3299.879c-27.408,71.2389-106.4474-33.8896-183.4524,14.2257-28.4527,15.7091-55.3659,48.3352-87.3332,28.6166-24.002-15.1047-45.5339-42.7326-76.4016-41.1395-44.6556-.4395-64.868,60.1441-101.7781,51.7952-24.6068-6.8658-46.7421-36.416-76.7315-30.7038-25.2665,1.8676-44.6556,25.8703-68.2727,30.8684-28.0128,1.9226-21.8605-44.5449-18.2358-62.3959,8.074-40.3155,54.4312-15.7057,104.0846-13.2393,25.1566,8.953,45.9188,46.6322,76.0731,31.3079,22.6288-11.7543,44.8192-46.4675,69.9757-58.4414,33.3941-16.972,63.055,12.6879,89.7483,28.8362,22.6852,13.4569,44.1607,4.6689,62.1767-12.6879,44.1607-44.5999,78.9294-77.7201,137.3701-25.2658,42.4027,43.2817,89.4198,108.8085,73.1069,178.3447Z"/>
              <path className="cls-3" d="M576.8254,252.827c2.9112,2.0322,5.6575,4.339,8.1839,6.8658-2.4714-2.5267-5.2177-4.8885-8.1839-6.8658ZM574.5189,251.289c-2.2515-1.4281-4.6143-2.6913-7.0857-3.7349,2.4164,1.0986,4.7779,2.3068,7.0857,3.7349ZM544.858,242.9951c-6.096-.1096-11.9735.879-17.4111,2.8013,5.4376-1.8673,11.3151-2.8559,17.4111-2.7463h.8247c5.7675-.055,11.4237.879,16.6977,2.5817-5.3277-1.7577-10.9302-2.6913-16.6977-2.6367h-.8247Z"/>
            </g>
            <path className="cls-2" d="M614.0104,195.1547c-58.4407-52.4543-93.2093-19.3341-137.3701,25.2658-18.0159,17.3568-39.4915,26.1448-62.1767,12.6879-26.6933-16.1483-56.3542-45.8081-89.7483-28.8362-25.1566,11.9738-47.3469,46.6871-69.9757,58.4414-30.1543,15.3242-50.9165-22.3549-76.0731-31.3079-49.6534-17.4664-96.0106,93.9237-104.0846,134.2393-3.6246,17.851-9.777,64.3185,18.2358,62.3959,23.6171-4.9981,43.0062-29.0008,68.2727-30.8684,29.9894-5.7122,52.1248,23.838,76.7315,30.7038,36.9101,8.3489,57.1225-52.2347,101.7781-51.7952,30.8677-1.5931,52.3997,26.0349,76.4016,41.1395,31.9673,19.7186,58.8806-12.9075,87.3332-28.6166,77.0051-48.1153,156.0444,57.0133,183.4524-14.2257l.3299-.879c16.3129-69.5362-30.7041-135.0629-73.1069-178.3447ZM161.9688,375.0375c-45.369-4.3394-43.2811-69.9757,2.1978-71.6238h.8783c48.6637,2.2522,45.8638,73.546-3.0762,71.6238ZM378.5432,327.0872c-15.051,43.9408-80.3025,36.9651-85.6302-9.2279-3.6246-25.3758,17.9059-49.653,43.446-49.3785h.7697c29.3296-.4392,51.575,31.0883,41.4144,58.6063ZM601.2122,303.5237c-4.7779,58.1668-84.4756,71.0193-107.5443,17.5764-16.0393-35.592,12.0835-78.6541,51.1901-78.05h.8247c31.8574-.2746,58.5507,28.6716,55.5295,60.4736Z"/>
          </svg>
          <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>iCanCall</span>
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
                  {"badge" in it && missedCount > 0 && <span className="badge-dot">{missedCount}</span>}
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}

        <div className="sidebar-foot">
          <div className="plan-card">
            <div className="row">
              <span className="pill">
                {account.plan === "careteam"
                  ? (lang === "ja" ? "ケアチームプラン"
                   : lang === "zh" ? "护理团队方案"
                   : lang === "ar" ? "باقة فريق الرعاية"
                   : lang === "hi" ? "केयर टीम प्लान"
                   : lang === "ko" ? "케어 팀 플랜"
                   : "CARE TEAM PLAN")
                  : account.plan === "pro"
                  ? (lang === "es" ? "PLAN PRO"
                   : lang === "fr" ? "FORFAIT PRO"
                   : lang === "ja" ? "プロプラン"
                   : lang === "zh" ? "专业版方案"
                   : lang === "ar" ? "باقة برو"
                   : lang === "hi" ? "प्रो प्लान"
                   : lang === "pt" ? "PLANO PRO"
                   : lang === "de" ? "PRO-TARIF"
                   : lang === "it" ? "PIANO PRO"
                   : lang === "ko" ? "프로 플랜"
                   : "PRO PLAN")
                  : (lang === "es" ? "PLAN ESENCIAL"
                   : lang === "fr" ? "FORFAIT ESSENTIEL"
                   : lang === "ja" ? "エッセンシャルプラン"
                   : lang === "zh" ? "基础版方案"
                   : lang === "ar" ? "الباقة الأساسية"
                   : lang === "hi" ? "एसेनशियल प्लान"
                   : lang === "pt" ? "PLANO ESSENCIAL"
                   : lang === "de" ? "ESSENTIAL-TARIF"
                   : lang === "it" ? "PIANO ESSENZIALE"
                   : lang === "ko" ? "에센셜 플랜"
                   : "ESSENTIAL PLAN")}
              </span>
              <span className="count">
                {lines.length}/{planConfig(account.plan).includedLines + (account.addons?.extraNumbers || 0)} {d.common.numbers}
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
            <p>{LINE_SCOPED[view as keyof typeof LINE_SCOPED] ? getLocalizedLineLabel(line.label, lang) + " · " + getLocalizedPersonName(line.person, lang) : t2}</p>
          </div>
          <div className="topbar-spacer"></div>

          <select
            value={lang}
            onChange={(e) => changeLanguage(e.target.value as typeof lang)}
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
          <div ref={switchRef} className={`numswitch ${switchOpen ? "open" : ""}`}>
            <button className="numswitch-btn" onClick={() => setSwitchOpen((o) => !o)}>
              <span className="ava" style={{ background: line.color }}>
                {initials(getLocalizedPersonName(line.person, lang))}
              </span>
              <span className="meta">
                <b>{getLocalizedLineLabel(line.label, lang)}</b>
                <span>{line.number}</span>
              </span>
              <span className="chev">
                <Icon name="chev" style={{ width: 16, height: 16 }} />
              </span>
            </button>
            {switchOpen && (
              <div className="numswitch-menu">
                 {lines.map((l, index) => (
                  <div
                    key={l.id}
                    className={`numswitch-opt ${l.id === activeLineId ? "sel" : ""}`}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}
                      onClick={() => {
                        setActiveLineId(l.id);
                        setSwitchOpen(false);
                      }}
                    >
                      <span className="ava" style={{ background: l.color }}>
                        {initials(getLocalizedPersonName(l.person, lang))}
                      </span>
                      <span className="meta">
                        <b>{getLocalizedLineLabel(l.label, lang)}</b>
                        <span>{l.number}</span>
                      </span>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {l.id === activeLineId && (
                        <span className="tick">
                          <Icon name="check" style={{ width: 17, height: 17 }} />
                        </span>
                      )}
                      {index >= (planConfig(account.plan).includedLines) && (
                        <button
                          className="btn-trash"
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "oklch(0.6 0.18 22)", padding: 4, display: "flex", alignItems: "center" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeaderRemovalLine(l);
                          }}
                          title="Delete Number"
                        >
                          <Icon name="trash" style={{ width: 15, height: 15 }} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  className="add-num"
                  onClick={() => {
                    setSwitchOpen(false);
                    if (account.plan !== "essential") {
                      loadHeaderNumbers(headerAreaCode);
                      setHeaderSelectedNumber(null);
                      setHeaderAddonModalOpen(true);
                    } else {
                      showToast(d.common.addNumberTip);
                    }
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
            <span className="ava" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
              ) : (
                initials(account.name)
              )}
            </span>
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
                  <p style={{ fontStyle: 'italic', margin: 0, color: 'var(--ink)', fontSize: '0.92rem', lineHeight: 1.5 }}>&ldquo;{activeVoicemail.transcription}&rdquo;</p>
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
            <ContactsView line={line} setLine={setLines} showToast={showToast} d={d} lang={lang} plan={account.plan} />
          )}
          {view === "routing" && (
            <RoutingView
              line={line}
              setLine={setLines}
              showToast={showToast}
              d={d}
              lang={lang}
              plan={account.plan}
              setView={go}
              setAcctTab={setAcctTab}
              setAutoOpenPlanModal={setAutoOpenPlanModal}
            />
          )}
          {view === "log" && <CallLogView line={line} log={log} d={d} lang={lang} />}
          {view === "team" && (
            <TeamAdminView
              lines={lines}
              log={log}
              account={account}
              viewerRole={viewerRole}
              setView={go}
              setActiveLineId={setActiveLineId}
              onManageSeats={() => {
                setAcctTab("billing");
                go("account");
              }}
              d={d}
              lang={lang}
            />
          )}
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
              lines={lines}
              setLines={setLines}
              autoOpenPlanModal={autoOpenPlanModal}
              setAutoOpenPlanModal={setAutoOpenPlanModal}
              viewerRole={viewerRole}
            />
          )}
        </div>
      </div>

      {headerAddonModalOpen && (
        <Modal
          title={lang === "es" ? "Configurar línea adicional" : lang === "fr" ? "Configurer une ligne supplémentaire" : "Configure Additional Line"}
          onClose={() => setHeaderAddonModalOpen(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
              <button className="btn btn-ghost" onClick={() => setHeaderAddonModalOpen(false)}>
                {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                className="btn btn-primary"
                disabled={!headerSelectedNumber}
                onClick={() => {
                  let updatedAccount = account;
                  setAccount((prev) => {
                    const baseLinesCount = planConfig(prev.plan).includedLines;
                    const needsAddon = lines.length >= baseLinesCount;
                    if (!needsAddon) return prev;

                    const updated = {
                      ...prev,
                      addons: {
                        ...(prev.addons || {}),
                        extraNumbers: (prev.addons?.extraNumbers || 0) + 1,
                      } as Account["addons"],
                    };
                    updatedAccount = updated;
                    localStorage.setItem("ic_account_data", JSON.stringify(updated));
                    return updated;
                  });

                  const index = lines.length;
                  const newLine: Line = {
                    id: "line_" + Date.now() + "_" + index,
                    label: getLineDefaultLabel(index, updatedAccount.plan, lang),
                    person: lang === "es" ? "Línea del círculo de confianza" : lang === "fr" ? "Ligne du cercle de confiance" : "Trusted contact line",
                    number: headerSelectedNumber!.number,
                    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
                    mode: "cascade",
                    minutesUsed: 0,
                    contacts: lines[0]?.contacts ? JSON.parse(JSON.stringify(lines[0].contacts)) : [],
                    settings: {
                      greeting: "",
                      bilingual: false,
                      language2: "es",
                      notifSMS: true,
                      notifEmail: true,
                      notifMissed: true,
                      notifWeekly: false,
                    },
                  };

                  const nextLines = [...lines, newLine];
                  setLines(nextLines);
                  localStorage.setItem("ic_lines_data", JSON.stringify(nextLines));
                  setActiveLineId(newLine.id);
                  setHeaderAddonModalOpen(false);
                  showToast(lang === "es" ? "¡Línea adicional configurada!" : lang === "fr" ? "Ligne supplémentaire configurée !" : "Additional line configured!");
                }}
              >
                {lang === "es" ? "Guardar" : lang === "fr" ? "Enregistrer" : "Confirm & Save"}
              </button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
                {lang === "es"
                  ? "Seleccione un número para su nueva línea prioritaria."
                  : lang === "fr"
                  ? "Sélectionnez un numéro pour votre nouvelle ligne prioritaire."
                  : "Select a phone number for your new priority line."}
              </p>

              {(() => {
                const baseLinesLimit = planConfig(account.plan).includedLines;
                const planName = account.plan === "careteam" ? "Care Team" : account.plan === "pro" ? "Pro" : "Essential";
                return lines.length >= baseLinesLimit ? (
                  <div style={{ background: "oklch(0.96 0.03 220 / 0.4)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                    {lang === "es"
                      ? "Nota: Esta línea se agregará como un complemento y se cobrará a su tarifa de $6.99/mes inmediatamente al confirmar y guardar."
                      : lang === "fr"
                      ? "Remarque : Cette ligne sera ajoutée en tant qu'option et facturée à votre tarif de 6,99 $/mois immédiatement après confirmation."
                      : "Note: This line will be added as an add-on and billed at your rate of $6.99/mo immediately upon confirming and saving."}
                  </div>
                ) : (
                  <div style={{ background: "oklch(0.96 0.03 140 / 0.1)", border: "1px solid oklch(0.8 0.1 140 / 0.3)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: 1.4 }}>
                    {lang === "es"
                      ? `Nota: Esta línea está incluida en su plan ${planName} sin costo adicional.`
                      : lang === "fr"
                      ? `Remarque : Cette ligne est incluse dans votre forfait ${planName} sans frais supplémentaires.`
                      : `Note: This line is included in your ${planName} plan at no additional cost.`}
                  </div>
                );
              })()}

              {/* Area Code Search */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                <input
                  type="text"
                  maxLength={3}
                  value={headerAreaCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setHeaderAreaCode(val);
                    if (val.length === 3) {
                      loadHeaderNumbers(val);
                    }
                  }}
                  placeholder="Area Code"
                  className="input"
                  style={{ width: 120, height: 38, padding: "0 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--bg)", color: "var(--ink)" }}
                />
                {headerAreaCode.length === 3 && <AreaFlag areaCode={headerAreaCode} height={15} showAbbr />}
                <button
                  className="btn btn-ghost"
                  disabled={headerAreaCode.length !== 3 || headerIsSearching}
                  onClick={() => loadHeaderNumbers(headerAreaCode)}
                  style={{ height: 38, padding: "0 16px" }}
                >
                  {headerIsSearching ? (
                    lang === "es" ? "Buscando..." : lang === "fr" ? "Recherche..." : "Searching..."
                  ) : (
                    lang === "es" ? "Buscar" : lang === "fr" ? "Rechercher" : "Search"
                  )}
                </button>
              </div>

              {/* Numbers list */}
              {headerIsSearching ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                  <div className="spinner" style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                </div>
              ) : headerNumbersList.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {(headerNumbersList[0]?.area === "787" || headerNumbersList[0]?.area === "939") && (
                    <div style={{ gridColumn: "1 / -1", fontSize: "0.8rem", color: "#92400e", background: "rgba(217, 119, 6, 0.07)", border: "1px solid rgba(217, 119, 6, 0.35)", borderRadius: "var(--r-md)", padding: "8px 12px" }}>
                      {lang === "es" ? "Estos son números de Puerto Rico. Las tarifas de llamada pueden ser más altas que las de números del territorio continental de EE. UU." : lang === "fr" ? "Ce sont des numéros de Porto Rico. Les tarifs d'appel peuvent être plus élevés que ceux des numéros des États-Unis continentaux." : "These are Puerto Rico phone numbers. Calling rates may be higher than mainland US numbers."}
                    </div>
                  )}
                  {headerNumbersList.map((num) => {
                    const isSelected = headerSelectedNumber?.number === num.number;
                    return (
                      <button
                        key={num.id || num.number}
                        onClick={() => setHeaderSelectedNumber(num)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "12px 8px",
                          borderRadius: "var(--r-md)",
                          border: isSelected ? "2px solid var(--blue)" : "1px solid var(--line)",
                          background: isSelected ? "var(--tint)" : "var(--surface)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          textAlign: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <AreaFlag areaCode={num.area} />
                          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>{num.number}</span>
                        </span>
                        {num.memorable ? (
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                            {num.memorable}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "var(--blue)" : "var(--ink-faint)" }}>
                            {lang === "es" ? "Número estándar" : lang === "fr" ? "Numéro standard" : "Standard Number"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--ink-soft)" }}>
                  {lang === "es" ? "Ingrese un código de área para buscar números." : lang === "fr" ? "Entrez un indicatif de zone pour rechercher des numéros." : "Enter a 3-digit area code to search for available numbers."}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {headerRemovalLine && (
        <Modal
          title={lang === "es" ? "Eliminar número de teléfono" : lang === "fr" ? "Supprimer le numéro de téléphone" : "Remove Phone Number"}
          onClose={() => setHeaderRemovalLine(null)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, width: "100%" }}>
              <button className="btn btn-ghost" onClick={() => setHeaderRemovalLine(null)}>
                {lang === "es" ? "Cancelar" : lang === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button
                className="btn btn-primary"
                style={{ background: "oklch(0.6 0.18 22)", borderColor: "oklch(0.6 0.18 22)", color: "#fff" }}
                onClick={() => {
                  const lineToDelete = headerRemovalLine;
                  
                  // Filter out the line
                  setLines((prev) => {
                    const nextLines = prev.filter((l) => l.id !== lineToDelete.id);
                    if (activeLineId === lineToDelete.id && nextLines[0]) {
                      setActiveLineId(nextLines[0].id);
                    }
                    return nextLines;
                  });

                  // Decrement extraNumbers add-on
                  setAccount((prev) => {
                    const updated = {
                      ...prev,
                      addons: {
                        ...(prev.addons || {}),
                        extraNumbers: Math.max(0, (prev.addons?.extraNumbers || 0) - 1),
                      } as Account["addons"],
                    };
                    return updated;
                  });

                  setHeaderRemovalLine(null);
                  showToast(lang === "es" ? "¡Número de teléfono eliminado!" : lang === "fr" ? "Numéro de téléphone supprimé !" : "Phone number removed successfully!");
                }}
              >
                {lang === "es" ? "Eliminar" : lang === "fr" ? "Supprimer" : "Remove Number"}
              </button>
            </div>
          }
        >
          <div style={{ padding: "10px 0" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "var(--ink)", fontWeight: 500 }}>
              {lang === "es"
                ? `¿Está seguro de que desea eliminar la línea "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number})?`
                : lang === "fr"
                ? `Êtes-vous sûr de vouloir supprimer la ligne "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number}) ?`
                : `Are you sure you want to remove the phone line "${getLocalizedLineLabel(headerRemovalLine.label, lang)}" (${headerRemovalLine.number})?`}
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "oklch(0.6 0.18 22)", fontWeight: 500 }}>
              {lang === "es"
                ? "Esta acción devolverá este número de forma permanente y eliminará todas sus configuraciones y contactos."
                : lang === "fr"
                ? "Cette action restituera définitivement ce numéro et effacera toutes ses configurations."
                : "This action will permanently return this number and delete all of its configurations and contacts."}
            </p>
          </div>
        </Modal>
      )}

      <Toast msg={toast} />
      </div>
    </div>
  );
}

