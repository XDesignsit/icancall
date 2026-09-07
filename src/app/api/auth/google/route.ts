import { NextResponse } from "next/server";
import { beginGoogleOAuth, OAUTH_VERIFIER_COOKIE, OAUTH_VERIFIER_MAX_AGE_SECONDS } from "@/lib/oauth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const redirectTo = `${appUrl}/api/auth/callback?next=${encodeURIComponent(next)}`;

  try {
    const { url, verifier } = await beginGoogleOAuth(redirectTo);
    const response = NextResponse.redirect(url);
    // The PKCE verifier must come back with the callback request. Lax (not
    // None) is deliberate: Google's redirect is a top-level navigation, which
    // Lax allows, and it keeps the cookie off cross-site subresource requests.
    response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: OAUTH_VERIFIER_MAX_AGE_SECONDS,
      path: "/api/auth/callback",
    });
    return response;
  } catch (error) {
    console.error("Google OAuth initiation error:", error);
    return NextResponse.redirect(`${appUrl}/login?error=Google+sign-in+is+unavailable+right+now`);
  }
}
