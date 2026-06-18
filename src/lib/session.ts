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
  // Dynamic import prevents Edge Runtime bundler from throwing module errors
  const { webcrypto } = await import("crypto");
  return webcrypto as unknown as Crypto;
}

// Helper to pad base64url string back to standard base64 for decoding
function base64urlToBase64(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
}

// Convert ArrayBuffer to base64url string
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
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
  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
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

    const decoded = atob(base64urlToBase64(data));
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
