import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { issueSession, sessionCookieOptions } from "@/lib/session";
import { resolveSessionRole } from "@/lib/roles";
import { isOnboarded, RESUME_SIGNUP_PATH } from "@/lib/onboarding";
import { exchangeGoogleCode, OAUTH_VERIFIER_COOKIE } from "@/lib/oauth";

// Only same-origin relative paths may be used as a post-login destination.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Supabase reports provider/consent failures on the redirect itself.
  const providerError = searchParams.get("error_description") || searchParams.get("error");
  if (providerError) {
    console.error("Google OAuth provider error:", providerError);
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent("Google sign-in was cancelled or failed")}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=No+authorization+code+provided`);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const verifier = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${OAUTH_VERIFIER_COOKIE}=`))
    ?.slice(OAUTH_VERIFIER_COOKIE.length + 1);

  if (!verifier) {
    // The 10-minute verifier cookie expired or the callback was opened in a
    // different browser than the one that started the flow.
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent("Sign-in took too long. Please try again.")}`);
  }

  try {
    const user = await exchangeGoogleCode(code, decodeURIComponent(verifier));
    const { email, id: userId, user_metadata } = user;
    const meta = (user_metadata || {}) as Record<string, unknown>;

    // First sign-in: create the profile row with what Google told us and
    // nothing else. No plan, card or address -- the wizard collects those,
    // and inventing a "pro" plan here is what let unpaid accounts into the
    // dashboard.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const fullName = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
      const givenName = typeof meta.given_name === "string" ? meta.given_name : fullName.split(" ")[0] || "";
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        email: email || "",
        name: fullName,
        preferred_name: givenName,
        settings: {
          notifyEmail: email || "",
          smsConsent: false,
          smsPhone: "",
          twoFactor: false,
          addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
        },
      });
      if (insertError) {
        console.error("Failed to create profile for Google user:", insertError);
      }
    }

    const role = await resolveSessionRole(userId, email || "");
    const onboarded = await isOnboarded(userId, email || "");
    const sessionToken = await issueSession({ email: email || "", role, userId, onboarding: !onboarded });

    // An unfinished account goes to the wizard to pick a plan and a number,
    // whatever `next` asked for; a finished one goes where it was headed.
    const destination = onboarded ? next : RESUME_SIGNUP_PATH;
    const response = NextResponse.redirect(`${appUrl}${destination}`);
    response.cookies.set("session", sessionToken, sessionCookieOptions());
    response.cookies.set(OAUTH_VERIFIER_COOKIE, "", { path: "/api/auth/callback", maxAge: 0 });
    return response;
  } catch (err) {
    console.error("OAuth callback processing error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=Authentication+failed`);
  }
}
