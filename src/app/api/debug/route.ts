import { NextResponse } from "next/server";

export async function GET() {
  const envKeys = Object.keys(process.env).filter(k => k.startsWith("NEXT_PUBLIC_"));
  const envData = envKeys.reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {} as Record<string, any>);

  return NextResponse.json({
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    allPublicEnv: envData,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}
