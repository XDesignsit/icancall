"use client";

import React, { useState } from "react";
import { PET_TERMS, isPetTerm } from "@/lib/pets";
import { minutePool } from "@/lib/minutesCycle";
import { Badge } from "../_primitives";
import type { Account } from "../_types";
import { formatEndDate } from "./cancelStrings";
import { petsCopy } from "./petsStrings";

// The billing card for a pet plan (lib/pets), in place of the plan, cycle and
// add-on controls the other plans have: pet plans have one price per term, no
// plan switching and no add-ons. When the line is out of its 30 minutes for
// the year, Pets Annual offers "Renew now" (api/billing/renew-pets); one-time
// terms wait for the yearly reset on the purchase anniversary.
export function PetBillingCard({ account, lang, title, showToast }: { account: Account; lang: string; title: string; showToast: (msg: string) => void }) {
  const c = petsCopy(lang);
  const term = isPetTerm(account.petTerm) ? account.petTerm : "annual";
  const cfg = PET_TERMS[term];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const used = Number(account.addons?.usedMin || 0);
  const outOfMinutes = used >= minutePool("pets", account.addons || {});
  const date = (iso: string | null | undefined) => (iso ? formatEndDate(iso, lang) : "");
  const subtitle = cfg.oneTime
    ? account.petCoverEndsAt ? c.coversUntil.replace("{date}", date(account.petCoverEndsAt)) : ""
    : account.billingRenewsAt ? c.renews.replace("{date}", date(account.billingRenewsAt)) : "";

  const renewNow = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/renew-pets", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Renewal failed");
      showToast(c.renewed);
      // The paid renewal resets the minutes in the webhook; reload to show it.
      setTimeout(() => window.location.reload(), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renewal failed");
      setBusy(false);
    }
  };

  return (
    <div className="card section-gap">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Badge kind="blue">{c.names[term]}</Badge>
      </div>
      <div className="card-pad">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: "2.4rem", fontWeight: 700, letterSpacing: "-0.03em" }}>${cfg.amount}</span>
          <span style={{ color: "var(--ink-faint)" }}>{cfg.oneTime ? c.oneTime : c.perYear}</span>
        </div>
        <p style={{ fontSize: "0.92rem", color: "var(--ink-soft)", margin: 0 }}>
          {c.minutes}
          {account.minutesResetsAt ? ` · ${c.minutesReset.replace("{date}", date(account.minutesResetsAt))}` : ""}
        </p>

        {outOfMinutes && (
          <div role="status" style={{ marginTop: 16, padding: "14px 16px", background: "var(--tint)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
            <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.5, color: "var(--ink)" }}>
              {term === "annual" ? c.outRenew : c.outWait.replace("{date}", date(account.minutesResetsAt))}
            </p>
            {term === "annual" && (
              <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={busy} onClick={renewNow}>
                {busy ? c.renewing : c.renewNow}
              </button>
            )}
            {error && <p style={{ margin: "10px 0 0", fontSize: "0.88rem", color: "oklch(0.50 0.18 25)" }}>{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
