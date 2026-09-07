import { supabase } from "./supabase";
import { isDemoEmail } from "./demoEmails";
import { resolveAccount } from "./account";

/** Where an authenticated-but-unfinished account resumes the signup wizard. */
export const RESUME_SIGNUP_PATH = "/signup?resume=1";

/**
 * Has this user finished signup? Authentication alone (a Google consent or a
 * verified email PIN) is not an account: the wizard still has to collect a
 * plan, a phone number and a checkout. Until then the session is flagged
 * `onboarding` and only the wizard is reachable.
 *
 * "Finished" means any of: a demo login, an invited Care Team member acting on
 * an owner's account, a Creem customer/subscription recorded by the webhook,
 * or at least one phone line (the wizard seeds them right after checkout).
 *
 * Fails open on lookup errors: a paying customer must never be bounced into a
 * second checkout because a query hiccupped; the dashboard has its own error
 * state for that case.
 */
export async function isOnboarded(userId: string | null | undefined, email: string): Promise<boolean> {
  if (isDemoEmail(email)) return true;
  if (!userId) return false;

  try {
    const resolved = await resolveAccount(userId);
    if (resolved.role === "member") return true;

    const { data: profile } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();
    const settings = (profile?.settings || {}) as Record<string, unknown>;
    if (settings.creem_subscription_id || settings.creem_customer_id) return true;

    const { data: lines, error } = await supabase
      .from("phone_lines")
      .select("id")
      .eq("user_id", userId);
    if (error) throw error;
    return Array.isArray(lines) && lines.length > 0;
  } catch (err) {
    console.error("isOnboarded lookup failed, treating account as onboarded:", err);
    return true;
  }
}
