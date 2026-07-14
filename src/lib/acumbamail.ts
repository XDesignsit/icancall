const ACUMBAMAIL_API = "https://acumbamail.com/api/1";

interface AddSubscriberArgs {
  /** Acumbamail list id to add the subscriber to. */
  listId: string | undefined;
  email: string;
  /** Extra merge fields (e.g. { name: "Jane Doe" }). `email` is always sent. */
  mergeFields?: Record<string, string | undefined>;
  /** When true, triggers the list's configured welcome autoresponder. */
  welcomeEmail?: boolean;
  /** When true, updates the subscriber if the email already exists on the list. */
  updateSubscriber?: boolean;
}

interface AddSubscriberResult {
  success: boolean;
  subscriberId?: number;
  error?: string;
}

/**
 * Adds (or updates) a subscriber on an Acumbamail list via the legacy
 * form-urlencoded addSubscriber endpoint. Fails soft: when credentials are
 * missing (local/preview) or the API errors, it logs and returns
 * { success: false } instead of throwing, so callers never break their own
 * flow over a marketing-list side effect.
 */
export async function addAcumbamailSubscriber({
  listId,
  email,
  mergeFields = {},
  welcomeEmail = false,
  updateSubscriber = true,
}: AddSubscriberArgs): Promise<AddSubscriberResult> {
  const authToken = process.env.ACUMBAMAIL_AUTH_TOKEN;

  if (!authToken || !listId || authToken === "your_auth_token_here") {
    console.warn("[Acumbamail] Not configured (missing auth token or list id); skipping subscriber import.");
    return { success: false, error: "not_configured" };
  }

  const cleanEmail = email.trim();
  const form = new URLSearchParams();
  form.append("auth_token", authToken);
  form.append("list_id", listId);
  form.append("response_type", "json");
  form.append("email", cleanEmail);
  form.append("merge_fields[email]", cleanEmail);
  for (const [key, value] of Object.entries(mergeFields)) {
    const trimmed = value?.trim();
    if (trimmed) form.append(`merge_fields[${key}]`, trimmed);
  }
  if (welcomeEmail) form.append("welcome_email", "1");
  if (updateSubscriber) form.append("update_subscriber", "1");

  try {
    const response = await fetch(`${ACUMBAMAIL_API}/addSubscriber/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const raw = await response.text();
    if (!response.ok) {
      console.error("[Acumbamail] addSubscriber HTTP error:", response.status, raw);
      return { success: false, error: `http_${response.status}` };
    }

    let result: unknown;
    try {
      result = JSON.parse(raw);
    } catch {
      result = raw;
    }

    if (result && typeof result === "object" && "error" in result) {
      console.error("[Acumbamail] addSubscriber returned error payload:", result);
      return { success: false, error: JSON.stringify((result as { error: unknown }).error) };
    }

    const subscriberId =
      result && typeof result === "object" && "subscriber_id" in result
        ? Number((result as { subscriber_id: unknown }).subscriber_id)
        : undefined;

    return { success: true, subscriberId };
  } catch (err) {
    console.error("[Acumbamail] addSubscriber exception:", err);
    return { success: false, error: "exception" };
  }
}
