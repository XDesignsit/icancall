const JWT_SECRET = process.env.JWT_SECRET || "icancall_dev_fallback_secret_key_12345";

export interface SessionPayload {
  email: string;
  role: "admin" | "user";
  expiresAt: number;
  userId?: string;
}

// A foolproof, cross-runtime hashing function (DJB2) to avoid Web Crypto & Node.js crypto module issues
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

// Convert string to base64url using Buffer (Edge & Node compatible)
function stringToBase64url(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Convert base64url back to standard UTF-8 string
function base64urlToString(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Sign session payload to a base64url token (Edge Runtime compatible).
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const data = stringToBase64url(JSON.stringify(payload));
  const signature = djb2Hash(data + JWT_SECRET);
  return `${data}.${signature}`;
}

/**
 * Verify base64url token signature and expiration (Edge Runtime compatible).
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    
    const expectedSig = djb2Hash(data + JWT_SECRET);

    if (signature !== expectedSig) {
      console.warn("Session verification failed: Signature mismatch.");
      return null;
    }

    const decoded = base64urlToString(data);
    const payload = JSON.parse(decoded) as SessionPayload;
    if (payload.expiresAt < Date.now()) {
      console.warn("Session verification failed: Token expired.");
      return null;
    }
    return payload;
  } catch (err) {
    console.error("Session verification failed with error:", err);
    return null;
  }
}
