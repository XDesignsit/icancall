import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signSession } from "@/lib/session";
import { roleForEmail } from "@/lib/demoAccounts";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=No+authorization+code+provided`);
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error("Code exchange failed:", error);
      return NextResponse.redirect(`${appUrl}/login?error=Authentication+failed`);
    }

    const { email, id: userId, user_metadata } = data.user;

    // Check if user profile already exists; if not, seed a default one
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      // Seed default profile for the user
      await supabase.from("profiles").insert({
        id: userId,
        email: email || "",
        name: user_metadata?.full_name || "New Caregiver",
        preferred_name: user_metadata?.given_name || "Caregiver",
        settings: {
          notifyEmail: email || "",
          smsConsent: false,
          smsPhone: "",
          twoFactor: false,
          card: { brand: "Visa", last4: "4242", exp: "12 / 28" },
          billingAddr: "",
          plan: "pro",
          billingCycle: "monthly",
          addons: { extraNumbers: 0, minuteBlocks: 0, usedMin: 0, rolloverMin: 0 },
        }
      });
    }

    const role = roleForEmail(email || "");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const sessionToken = await signSession({ email: email || "", role, expiresAt, userId });
    const response = NextResponse.redirect(`${appUrl}${next}`);

    // Set secure HTTP-only session cookie (SameSite=None is required for iframe previews in prod)
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("OAuth callback processing error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=Unexpected+callback+error`);
  }
}
