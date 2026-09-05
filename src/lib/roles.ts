import { supabase } from "./supabase";
import { demoAccount, type DemoRole } from "./demoAccounts";

/**
 * Resolve the role to sign into a session.
 *
 * Super-admin used to come from two places, both of them dead ends in
 * production: the seeded demo account (gated off there) and a hardcoded
 * `email === "admin@icancall.co"` check in the admin API (removed, since it
 * granted admin to any session for that address regardless of role). Elevation
 * now comes from data -- `profiles.settings.role === "admin"` -- so granting or
 * revoking it is a row update rather than a deploy, and it works in production
 * with demo logins switched off.
 *
 * Demo accounts still win when demo logins are enabled, so local and preview
 * keep their one-click admin.
 */
export async function resolveSessionRole(
  userId: string | null | undefined,
  email: string,
): Promise<DemoRole> {
  if (demoAccount(email)?.role === "admin") return "admin";
  if (!userId) return "user";

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return "user";
    const settings = (data as { settings?: { role?: unknown } }).settings;
    return settings?.role === "admin" ? "admin" : "user";
  } catch {
    // Never let a lookup failure escalate anyone -- fail closed to "user".
    return "user";
  }
}
