import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";
  const baseHost = host.split(":")[0]; // remove port if any

  // 1. Detect if the request is loaded inside an iframe (e.g., in developer preview sandboxes)
  // where browsers block third-party cookies by default.
  const referer = request.headers.get("referer") || "";
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const isIframe = secFetchDest === "iframe" || secFetchDest === "frame" || (referer && !referer.includes(host));

  if (isIframe) {
    // Let client-side localStorage checks handle authentication in iframe previews
    return NextResponse.next();
  }

  // 2. Only run proxy redirects on production domains containing 'icancall.co'
  // (Prevents iframe cookie-blocking loops in local development & Vercel preview environments)
  if (!baseHost.includes("icancall.co")) {
    return NextResponse.next();
  }

  // 3. Enforce Authentication & Route Authorization
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isSuperAdminRoute = url.pathname.startsWith("/super-admin");
  const isOnboarding = url.pathname.startsWith("/onboarding");

  // Read session cookie
  const sessionCookie = request.cookies.get("session")?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (isDashboardRoute || isSuperAdminRoute) {
    if (!session) {
      // Redirect unauthenticated users to login
      url.pathname = "/login";
      url.searchParams.set("unauthorized", "true");
      // Clear any invalid session cookie if present
      const response = NextResponse.redirect(url);
      response.cookies.delete("session");
      return response;
    }

    if (isSuperAdminRoute && session.role !== "admin") {
      // Prevent non-admins from accessing super-admin dashboard
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Only redirect away from onboarding if already logged in (never redirect away from /login)
  if (isOnboarding && session) {
    url.pathname = session.role === "admin" ? "/super-admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Clear session cookie when visiting login page to prevent auto-login
  if (url.pathname.startsWith("/login") && sessionCookie) {
    const response = NextResponse.next();
    response.cookies.delete("session");
    return response;
  }

  const marketingDomain = "icancall.co";
  const appDomain = "app.icancall.co";

  const isAppRoute = isDashboardRoute || isSuperAdminRoute || url.pathname.startsWith("/login") || url.pathname.startsWith("/onboarding");

  // Redirect marketing domain accessing app routes to the app subdomain
  if ((baseHost === marketingDomain || baseHost === "www.icancall.co") && isAppRoute) {
    url.host = appDomain;
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  // Redirect app subdomain accessing marketing routes back to the main website
  if (baseHost === appDomain && !isAppRoute) {
    url.host = marketingDomain;
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, etc. (static files in public)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)",
  ],
};
