import { supabase } from "./supabase";

// Seeded demo logins used by the login page's "Demo accounts" panel. Each one
// self-heals: if the auth user or its profile row is missing (fresh Supabase
// project, wiped mock DB), the login/OTP routes recreate it from this seed.
//
// Keeping the seeds here means the password path (/api/auth/login), the PIN
// path (/api/auth/otp) and the Google callback all agree on who the demo users
// are and what plan they are on.

export type DemoRole = "admin" | "user";

interface DemoLine {
  number: string;
  name: string;
  type: string;
  contacts: Array<{ id: number; name: string; phone: string; rel: string; available: boolean }>;
}

interface DemoAccount {
  /** Password assigned when the auth user has to be created. */
  password: string;
  role: DemoRole;
  name: string;
  preferredName: string;
  settings: Record<string, unknown>;
  lines?: DemoLine[];
}

const CARD = { brand: "Visa", last4: "4242", exp: "12 / 28" };

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  "support@icancall.co": {
    password: "DemoPassword123!",
    role: "user",
    name: "Support Demo",
    preferredName: "Support",
    settings: {
      smsConsent: true,
      smsPhone: "",
      twoFactor: false,
      card: CARD,
      billingAddr: "123 Main St, Oakland, CA 94607",
      plan: "pro",
      billingCycle: "monthly",
      addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
    },
    lines: [
      {
        number: "+15005550006",
        name: "Priority cascaded line",
        type: "seniors",
        contacts: [
          { id: 1, name: "Support Demo", phone: "+14155550192", rel: "Primary Caregiver", available: true },
        ],
      },
    ],
  },

  // Care Team plan demo: 5 included lines, 15 contacts per line, 150 pooled
  // voice minutes and a second caregiver seat. Seeded with 3 of the 5 lines in
  // use and the extra seat left open so the invite flow can be demonstrated.
  "careteam@icancall.co": {
    password: "CareTeamDemo123!",
    role: "user",
    name: "Jordan Reyes",
    preferredName: "Jordan",
    settings: {
      smsConsent: true,
      smsPhone: "",
      twoFactor: false,
      card: CARD,
      billingAddr: "1420 Ocean Ave, Santa Monica, CA 90401",
      plan: "careteam",
      billingCycle: "monthly",
      addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 38, rolloverMin: 0 },
      seats: { members: [] },
    },
    lines: [
      {
        // Twilio's magic test number, so demo call flows still work end to end.
        number: "+15005550006",
        name: "Mom — Eleanor",
        type: "seniors",
        contacts: [
          { id: 1, name: "Jordan Reyes", phone: "+14155550192", rel: "Primary Caregiver", available: true },
          { id: 2, name: "Priya Reyes", phone: "+14155550143", rel: "Daughter", available: true },
          { id: 3, name: "Dr. Amelia Okafor", phone: "+14155550178", rel: "Primary Physician", available: false },
        ],
      },
      {
        number: "+14155550188",
        name: "Dad — Robert",
        type: "seniors",
        contacts: [
          { id: 1, name: "Jordan Reyes", phone: "+14155550192", rel: "Primary Caregiver", available: true },
          { id: 2, name: "Marcus Reyes", phone: "+14155550167", rel: "Son", available: true },
        ],
      },
      {
        number: "+14155550151",
        name: "Aunt Rosa",
        type: "seniors",
        contacts: [
          { id: 1, name: "Priya Reyes", phone: "+14155550143", rel: "Niece", available: true },
          { id: 2, name: "Hillside Care Center", phone: "+14155550109", rel: "Care Facility", available: true },
        ],
      },
    ],
  },

  "admin@icancall.co": {
    password: "AdminPassword123!",
    role: "admin",
    name: "Alex Delgado",
    preferredName: "Alex",
    settings: {
      role: "admin",
      plan: "pro",
    },
  },
};

export const DEMO_EMAILS = Object.keys(DEMO_ACCOUNTS);

export function demoAccount(email: string): DemoAccount | null {
  return DEMO_ACCOUNTS[email.trim().toLowerCase()] || null;
}

export function isDemoEmail(email: string): boolean {
  return demoAccount(email) !== null;
}

/** Session role for an email — demo admins are the only elevated accounts. */
export function roleForEmail(email: string): DemoRole {
  return demoAccount(email)?.role === "admin" ? "admin" : "user";
}

/**
 * Resolve a demo email to its auth user id, creating the auth user, profile row
 * and seeded phone lines if any of them are missing. Throws if the Supabase
 * admin API is unavailable so callers can decide how to degrade.
 */
export async function ensureDemoAccount(email: string): Promise<string> {
  const account = demoAccount(email);
  if (!account) throw new Error(`Not a demo account: ${email}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  let userId: string;
  const existingUser = (users || []).find((u) => u.email === email);
  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Dynamic registration & auto-confirmation
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      throw createError || new Error("User creation failed");
    }
    userId = created.user.id;
  }

  // Force self-healing profile row check
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: userId,
      email,
      name: account.name,
      preferred_name: account.preferredName,
      settings: { notifyEmail: email, ...account.settings },
    });

    if (account.lines?.length) {
      await supabase.from("phone_lines").insert(
        account.lines.map((line) => ({ user_id: userId, ...line }))
      );
    }
  }

  return userId;
}
