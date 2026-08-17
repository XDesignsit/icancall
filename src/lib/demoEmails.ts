// Demo login addresses, split out from src/lib/demoAccounts.ts so client
// components can ask "is this a demo account?" without pulling the
// server-only Supabase client into the browser bundle.

export const DEMO_EMAILS = [
  "support@icancall.co",
  "careteam@icancall.co",
  "admin@icancall.co",
] as const;

export function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return (DEMO_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}
