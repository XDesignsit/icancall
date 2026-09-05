// Demo login addresses, split out from src/lib/demoAccounts.ts so client
// components can ask "is this a demo account?" without pulling the
// server-only Supabase client into the browser bundle.

/**
 * Demo logins are a deliberate auth bypass: a fixed PIN (123456) skips email
 * verification, admin@icancall.co grants the super-admin role, and demo emails
 * skip Creem checkout. That is fine on localhost and preview deploys, and must
 * never be reachable in production.
 *
 * Fail closed: the flag has to be switched on explicitly. NEXT_PUBLIC_ so the
 * login page can hide the panel with the same answer the server enforces —
 * Next inlines it at build time, so both sides agree.
 */
export const DEMO_LOGINS_ENABLED = process.env.NEXT_PUBLIC_DEMO_LOGINS === "1";

export const DEMO_EMAILS = [
  "support@icancall.co",
  "careteam@icancall.co",
  "admin@icancall.co",
] as const;

export function isDemoEmail(email: string | undefined | null): boolean {
  if (!DEMO_LOGINS_ENABLED) return false;
  if (!email) return false;
  return (DEMO_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}
