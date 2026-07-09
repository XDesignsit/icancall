import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "icancall_dev_only_insecure_secret"
    : undefined);

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable must be set in production.");
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  email: string;
  role: "admin" | "user";
  expiresAt: number;
  userId?: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(new Date(payload.expiresAt))
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
