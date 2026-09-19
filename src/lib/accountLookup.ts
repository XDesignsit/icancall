import { cookies } from "next/headers";
import { isMock, supabase } from "@/lib/supabase";
import { verifySession } from "@/lib/session";

/**
 * Whether the signup wizard should turn this address away because it already
 * has an account. An address that belongs to the signed-in user is not a
 * conflict: that is someone resuming their own unfinished signup.
 *
 * Looks at profiles, which every finished account has. A bare auth user with
 * no profile slips through here and is caught by /api/auth/signup itself.
 * Fails open: a lookup error must never block a new customer from signing up.
 */
export async function isEmailTakenForSignup(email: string): Promise<boolean> {
  const wanted = email.trim().toLowerCase();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = token ? await verifySession(token) : null;
    if (session?.email?.toLowerCase() === wanted) return false;

    // Profile emails keep the casing they were typed with, so match
    // case-insensitively ("_" and "%" are wildcards in LIKE and need escaping).
    // The local mock client only implements eq.
    const query = supabase.from("profiles").select("id");
    const { data, error } = isMock
      ? await query.eq("email", wanted)
      : await query.ilike("email", wanted.replace(/[\\%_]/g, "\\$&")).limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error("isEmailTakenForSignup lookup failed, letting signup continue:", err);
    return false;
  }
}

export const ACCOUNT_EXISTS_RESPONSE = {
  error: "An account with this email already exists. Please sign in to continue.",
  code: "account_exists",
} as const;
