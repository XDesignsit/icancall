import { SignJWT, jwtVerify } from "jose";

function getSecret(): Uint8Array {
  const secretStr = process.env.JWT_SECRET;
  if (!secretStr) {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.VERCEL_ENV === "preview" ||
      process.env.VERCEL_ENV === "development" ||
      !process.env.VERCEL ||
      !process.env.NOW_REGION
    ) {
      return new TextEncoder().encode("icancall_dev_only_insecure_secret");
    }
    throw new Error("JWT_SECRET environment variable must be set in production.");
  }
  return new TextEncoder().encode(secretStr);
}

export interface SessionPayload {
  email: string;
  role: "admin" | "user";
  expiresAt: number;
  userId?: string;
  /**
   * Set when the user is authenticated but has not finished signup (no plan
   * chosen, no number picked, no checkout). Such a session may only reach the
   * signup wizard; the proxy and the dashboard send it back there until
   * /api/auth/signup completes and re-issues the cookie without the flag.
   */
  onboarding?: boolean;
  /**
   * Id of this cookie's row in public.user_sessions (src/lib/userSessions.ts).
   * Lets the account page list signed-in devices and revoke one of them.
   * Absent on cookies issued before that table existed, or when recording
   * the row failed at sign-in.
   */
  sid?: string;
}

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Sign a fresh 7-day session token for a user. */
export async function issueSession(input: {
  email: string;
  role: "admin" | "user";
  userId?: string | null;
  onboarding?: boolean;
  sid?: string;
}): Promise<string> {
  return signSession({
    email: input.email,
    role: input.role,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    userId: input.userId || undefined,
    ...(input.onboarding ? { onboarding: true } : {}),
    ...(input.sid ? { sid: input.sid } : {}),
  });
}

/**
 * Cookie attributes for the session cookie. SameSite=None is required for
 * iframe preview sandboxes in production; Secure must accompany it.
 */
export function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  };
}
