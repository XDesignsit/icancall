import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";
  const baseHost = host.split(":")[0]; // remove port if any

  // Only run subdomain routing if we are on the production domains containing 'icancall.co'
  if (!baseHost.includes("icancall.co")) {
    return NextResponse.next();
  }

  const marketingDomain = "icancall.co";
  const appDomain = "app.icancall.co";

  // App routes classification
  const isAppRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/super-admin") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/onboarding");

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
