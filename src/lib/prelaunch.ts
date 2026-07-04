import type { NextRequest } from "next/server";

// Single launch switch: flip to false at launch to disable the coming-soon
// gate everywhere (middleware redirect + markdown/llms.txt AI surfaces).
export const PRELAUNCH = true;

// True when this request should see prelaunch (coming-soon) content:
// production hosts only, unless the preview bypass cookie is present.
// Mirrors the middleware gate in src/middleware.ts.
export function isPrelaunchGated(request: NextRequest): boolean {
  if (!PRELAUNCH) return false;
  const host = (request.headers.get("host") || "").split(":")[0];
  const isProduction = host.includes("icancall.co") || host.includes("vercel.app");
  if (!isProduction) return false;
  return request.cookies.get("icancall_preview")?.value !== "hellionz";
}
