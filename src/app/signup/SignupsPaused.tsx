"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, Field, Input, buttonClass } from "@/components/ui";
import "./signups-paused.css";

// Shown in place of the signup wizard while new signups are paused (see
// signupsPaused() in src/lib/stripe.ts). Visitors leave an email on the
// Coming Soon waitlist so they hear when they can create an account.
export default function SignupsPaused() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <main className="sp">
      <Link className="brand sp-brand" href="/" aria-label="iCanCall home">
        <span className="mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
          </svg>
        </span>
        <span>iCan<b>Call</b></span>
      </Link>

      <section className="card sp-card">
        <span className="eyebrow">Signups open soon</span>
        {status === "done" ? (
          <>
            <h1 className="sp-title">You&rsquo;re on the list.</h1>
            <p className="sp-lead">
              We&rsquo;ll email <strong>{email.trim()}</strong> as soon as you can create your account.
            </p>
          </>
        ) : (
          <>
            <h1 className="sp-title">We&rsquo;re almost ready for you.</h1>
            <p className="sp-lead">
              We&rsquo;re finishing the last step of our payment setup, so new accounts can&rsquo;t be
              created just yet. Leave your email and we&rsquo;ll let you know the moment signups open.
            </p>
            <form className="sp-form" onSubmit={submit} noValidate>
              <Field label="Email address" htmlFor="sp-email" error={error}>
                <Input
                  id="sp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  invalid={!!error}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Button type="submit" className="sp-submit" disabled={status === "sending"}>
                {status === "sending" ? "Adding you…" : "Notify me"}
              </Button>
            </form>
          </>
        )}
        <div className="sp-foot">
          <span>
            Already have an account? <Link href="/login">Log in</Link>
          </span>
          <Link className={buttonClass({ variant: "text" })} href="/">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
