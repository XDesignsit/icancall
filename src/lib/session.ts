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
}

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
