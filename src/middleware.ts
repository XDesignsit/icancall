import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";
  const baseHost = host.split(":")[0]; // remove port if any

  // Serve the Markdown edition of the homepage to clients that ask for it
  // (LLM agents and CLI tools sending Accept: text/markdown). Browsers never
  // send text/markdown, so a substring check is sufficient. /index.md is also
  // directly reachable without the header.
  const accept = request.headers.get("accept") || "";
  if (
    url.pathname === "/" &&
    (request.method === "GET" || request.method === "HEAD") &&
    accept.includes("text/markdown")
  ) {
    url.pathname = "/index.md";
    const response = NextResponse.rewrite(url);
    response.headers.set("Vary", "Accept");
    return response;
  }

  // 1. Detect if the request is loaded inside an iframe (e.g., in developer preview sandboxes)
  // where browsers block third-party cookies by default.
  const referer = request.headers.get("referer") || "";
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const isIframe = secFetchDest === "iframe" || secFetchDest === "frame" || (referer && !referer.includes(host));

  if (isIframe) {
    // Let client-side localStorage checks handle authentication in iframe previews
    return NextResponse.next();
  }

  // 2. Handle Preview Bypass Cookie and Parameters
  const hasPreviewParam = url.searchParams.get("preview") === "hellionz";
  const hasPreviewCookie = request.cookies.get("icancall_preview")?.value === "hellionz";
  const hasPreviewBypass = hasPreviewParam || hasPreviewCookie;

  if (hasPreviewParam) {
    url.searchParams.delete("preview");
    const response = NextResponse.redirect(url);
    response.cookies.set("icancall_preview", "hellionz", {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // 3. Enforce redirect to coming soon page for visitors on production/preview domains
  // const isProduction = baseHost.includes("icancall.co") || baseHost.includes("vercel.app");
  // if (isProduction && !hasPreviewBypass) {
  //   if (url.pathname !== "/coming-soon") {
  //     url.pathname = "/coming-soon";
  //     return NextResponse.redirect(url);
  //   }
  // }

  // 4. Only run proxy redirects on production domains containing 'icancall.co'
  // (Prevents iframe cookie-blocking loops in local development & Vercel preview environments)
  if (!baseHost.includes("icancall.co")) {
    return NextResponse.next();
  }

  // 3. Enforce Authentication & Route Authorization
  const isDashboardRoute = url.pathname.startsWith("/dashboard");
  const isSuperAdminRoute = url.pathname.startsWith("/super-admin");
  const isSignup = url.pathname.startsWith("/signup");

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
      const isProd = process.env.NODE_ENV === "production";
      response.cookies.set("session", "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
      });
      return response;
    }

    if (isSuperAdminRoute && session.role !== "admin") {
      // Prevent non-admins from accessing super-admin dashboard
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Only redirect away from signup if already logged in (never redirect away from /login)
  if (isSignup && session) {
    url.pathname = session.role === "admin" ? "/super-admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Clear session cookie when visiting login page to prevent auto-login
  if (url.pathname.startsWith("/login") && sessionCookie) {
    const response = NextResponse.next();
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("session", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    });
    return response;
  }

  const marketingDomain = "icancall.co";
  const appDomain = "app.icancall.co";

  const isAppRoute = isDashboardRoute || isSuperAdminRoute || url.pathname.startsWith("/login") || url.pathname.startsWith("/signup");

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
