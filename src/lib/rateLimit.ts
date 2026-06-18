// In-memory fallback cache for development/local execution
const memoryCache = new Map<string, { count: number; expiresAt: number }>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Clean up expired memory cache entries to prevent memory leaks
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Fixed window rate limiter with Redis (Upstash) support and in-memory fallback.
 * 
 * @param ip Client IP address
 * @param endpoint Endpoint name/identifier
 * @param limit Maximum allowed requests in the window
 * @param windowSeconds Window duration in seconds
 */
export async function rateLimit(
  ip: string,
  endpoint: string,
  limit = 5,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${ip}`;
  const now = Date.now();

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  // Use Upstash Redis / Vercel KV if available
  if (kvUrl && kvToken) {
    try {
      // Execute multi-command via REST API to increment and set expiration
      // Upstash pipeline: POST /pipeline with array of commands
      const res = await fetch(`${kvUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["TTL", key],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        // data looks like: [{ result: 1 }, { result: -1 }]
        const count = Number(data[0]?.result || 1);
        let ttl = Number(data[1]?.result || -1);

        // If TTL is not set (new key), set it
        if (ttl < 0) {
          await fetch(`${kvUrl}/expire/${key}/${windowSeconds}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${kvToken}` },
          });
          ttl = windowSeconds;
        }

        const remaining = Math.max(0, limit - count);
        const resetTime = Math.floor(now / 1000) + ttl;

        return {
          success: count <= limit,
          limit,
          remaining,
          reset: resetTime,
        };
      }
    } catch (err) {
      console.error("Redis Rate Limiter Error (falling back to memory):", err);
    }
  }

  // Fallback to memory Cache
  cleanupExpired();
  const cached = memoryCache.get(key);

  if (!cached || cached.expiresAt < now) {
    const expiresAt = now + windowSeconds * 1000;
    memoryCache.set(key, { count: 1, expiresAt });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.floor(expiresAt / 1000),
    };
  }

  cached.count += 1;
  const remaining = Math.max(0, limit - cached.count);
  const success = cached.count <= limit;

  return {
    success,
    limit,
    remaining,
    reset: Math.floor(cached.expiresAt / 1000),
  };
}

/**
 * Verify Cloudflare Turnstile CAPTCHA Token.
 * 
 * @param token Turnstile response token
 * @param ip Client IP address
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If not configured, skip verification (helpful for testing/local development)
    console.warn("TURNSTILE_SECRET_KEY is not set. Skipping CAPTCHA verification.");
    return true;
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}
