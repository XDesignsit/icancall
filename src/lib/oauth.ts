import { createClient } from "@supabase/supabase-js";
import { isMock } from "./supabase";

// Google sign-in runs through Supabase's PKCE flow, driven entirely from the
// server. The shared client in ./supabase.ts cannot do this: its default
// (implicit) flow makes Supabase hand the tokens back in the URL *fragment*,
// which never reaches /api/auth/callback -- the route saw no `code`, bounced
// every Google user to /login, and signup never happened.
//
// PKCE needs the code verifier generated at the start of the flow to be
// presented again at the callback. Each request gets its own throwaway client
// with an in-memory storage adapter; the verifier is carried between the two
// requests in a short-lived HttpOnly cookie owned by the route handlers.

export const OAUTH_VERIFIER_COOKIE = "oauth_verifier";
export const OAUTH_VERIFIER_MAX_AGE_SECONDS = 10 * 60;

const STORAGE_KEY = "icancall-oauth";
const VERIFIER_ITEM = `${STORAGE_KEY}-code-verifier`;

export interface OAuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

function memoryStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const adapter = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
  return { store, adapter };
}

function makeClient(storage: ReturnType<typeof memoryStorage>["adapter"]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // The anon key is the right credential for a user sign-in; fall back to the
  // service key, which GoTrue also accepts, so a deployment without the anon
  // key keeps working as it did before.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key, {
    auth: {
      flowType: "pkce",
      persistSession: true, // required for auth-js to honor the custom storage
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
      storageKey: STORAGE_KEY,
    },
  });
}

/**
 * Build the Google authorization URL. Returns the PKCE verifier the caller
 * must stash in a cookie for {@link exchangeGoogleCode}.
 */
export async function beginGoogleOAuth(redirectTo: string): Promise<{ url: string; verifier: string }> {
  if (isMock) {
    // No Supabase locally: skip Google and land straight on the callback.
    const sep = redirectTo.includes("?") ? "&" : "?";
    return { url: `${redirectTo}${sep}code=mock`, verifier: "mock" };
  }

  const { store, adapter } = memoryStorage();
  const client = makeClient(adapter);
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    throw error ?? new Error("Supabase returned no OAuth URL");
  }
  const verifier = store.get(VERIFIER_ITEM);
  if (!verifier) {
    throw new Error("PKCE code verifier was not generated");
  }
  return { url: data.url, verifier };
}

/** Exchange the callback's `code` (plus the stashed verifier) for the user. */
export async function exchangeGoogleCode(code: string, verifier: string): Promise<OAuthUser> {
  if (isMock) {
    return {
      id: "mock-user-google-demo",
      email: "google.demo@example.com",
      user_metadata: { full_name: "Google Demo", given_name: "Google" },
    };
  }

  const { adapter } = memoryStorage({ [VERIFIER_ITEM]: verifier });
  const client = makeClient(adapter);
  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    throw error ?? new Error("Code exchange returned no user");
  }
  return data.user;
}
