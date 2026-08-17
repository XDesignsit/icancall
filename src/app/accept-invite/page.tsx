"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type State =
  | { kind: "working" }
  | { kind: "success"; ownerName: string }
  | { kind: "error"; message: string };

function AcceptInviteInner() {
  const params = useSearchParams();
  const owner = params.get("owner");
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "working" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!owner || !token) {
      setState({ kind: "error", message: "This invitation link is incomplete or invalid." });
      return;
    }

    // A double-mount is already handled by the ref above. Nothing here may
    // persist a "we tried this token" marker across page loads: accepting an
    // invitation while signed out bounces through /login and comes straight
    // back, and that second visit must be allowed to run. (The route itself is
    // idempotent — a repeat accept by the same user re-asserts the seat.)

    (async () => {
      try {
        const res = await fetch("/api/caregiver/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, token }),
        });
        const data = await res.json();

        if (res.status === 401 && data.needsAuth) {
          // Send them to sign in, then bounce back here to finish accepting.
          const here = `/accept-invite?owner=${encodeURIComponent(owner)}&token=${encodeURIComponent(token)}`;
          window.location.href = `/login?next=${encodeURIComponent(here)}`;
          return;
        }

        if (!res.ok) {
          setState({ kind: "error", message: data.error || "We couldn't accept this invitation." });
          return;
        }

        setState({ kind: "success", ownerName: data.ownerName || "the account" });
        setTimeout(() => { window.location.href = "/dashboard"; }, 1800);
      } catch {
        setState({ kind: "error", message: "Something went wrong. Please try again." });
      }
    })();
  }, [owner, token]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f1f5f9" }}>
      <div style={{ maxWidth: 460, width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "36px 28px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e3a8a", letterSpacing: "-0.025em", marginBottom: 20 }}>iCanCall</div>

        {state.kind === "working" && (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Accepting your invitation…</h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>One moment while we connect you to the account.</p>
          </>
        )}

        {state.kind === "success" && (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>You&rsquo;re in!</h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", margin: "0 0 20px" }}>
              You now help manage <strong>{state.ownerName}</strong>&rsquo;s iCanCall account. Taking you to the dashboard…
            </p>
            <a href="/dashboard" style={{ display: "inline-block", padding: "12px 28px", background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.95rem" }}>Go to dashboard</a>
          </>
        )}

        {state.kind === "error" && (
          <>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>Invitation problem</h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", margin: "0 0 20px" }}>{state.message}</p>
            <a href="/login" style={{ display: "inline-block", padding: "12px 28px", background: "#2563eb", color: "#fff", textDecoration: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.95rem" }}>Go to sign in</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteInner />
    </Suspense>
  );
}
