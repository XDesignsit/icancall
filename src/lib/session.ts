const JWT_SECRET = process.env.JWT_SECRET || "icancall_dev_fallback_secret_key_12345";

export interface SessionPayload {
  email: string;
  role: "admin" | "user";
  expiresAt: number;
}

// Get the correct crypto provider dynamically to avoid static bundling of Node.js "crypto" in Edge Runtime
async function getCryptoProvider(): Promise<Crypto> {
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto;
  }
  const { webcrypto } = await import("crypto");
  return webcrypto as unknown as Crypto;
}

// Convert string to base64url using Buffer (fully robust and standard in Node/Edge)
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

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper to get Web Crypto HMAC key
async function getHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  const crypto = await getCryptoProvider();
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Sign session payload to a base64url token (Edge Runtime compatible).
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  const data = stringToBase64url(JSON.stringify(payload));
  const key = await getHmacKey();
  const encoder = new TextEncoder();
  const crypto = await getCryptoProvider();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(data)
  );
  
  const signature = bufferToBase64url(signatureBuffer);
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
    
    const key = await getHmacKey();
    const encoder = new TextEncoder();
    const crypto = await getCryptoProvider();
    const expectedBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    );
    const expectedSig = bufferToBase64url(expectedBuffer);

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
