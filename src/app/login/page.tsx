"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("support@icancall.co");
  const [password, setPassword] = useState("••••••••");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard automatically
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "/dashboard";
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate login network latency
    setTimeout(() => {
      if (!email.includes("@")) {
        setError("Please enter a valid email address.");
        setIsLoading(false);
        return;
      }
      if (password.length < 4) {
        setError("Password must be at least 4 characters.");
        setIsLoading(false);
        return;
      }

      // Save session simulation
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "/dashboard";
    }, 800);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "oklch(0.975 0.008 220)",
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid oklch(0.905 0.012 225)",
          borderRadius: 18,
          boxShadow: "0 10px 25px oklch(0.4 0.05 240 / 0.08)",
          padding: "36px 30px",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(150deg, oklch(0.58 0.115 232), oklch(0.62 0.10 198))",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 12px auto",
              boxShadow: "0 4px 10px oklch(0.58 0.115 232 / 0.2)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 22, height: 22 }}
            >
              <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, letterSpacing: "-0.03em", margin: 0, color: "oklch(0.26 0.028 248)" }}>
            Sign in to iCanCall
          </h1>
          <p style={{ fontSize: "0.85rem", color: "oklch(0.60 0.018 242)", marginTop: 6, margin: 0 }}>
            Enter your credentials to access your routing dashboard
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div
            style={{
              background: "oklch(0.96 0.05 22 / 0.1)",
              border: "1px solid oklch(0.96 0.05 22 / 0.2)",
              color: "oklch(0.5 0.18 22)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: "0.82rem",
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.46 0.022 245)" }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 13px",
                fontSize: "0.94rem",
                borderRadius: 8,
                border: "1px solid oklch(0.905 0.012 225)",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "oklch(0.46 0.022 245)" }}>Password</label>
              <a href="#" style={{ fontSize: "0.78rem", color: "oklch(0.58 0.115 232)", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 13px",
                fontSize: "0.94rem",
                borderRadius: 8,
                border: "1px solid oklch(0.905 0.012 225)",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "0.9rem",
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: "oklch(0.58 0.115 232)",
              color: "#ffffff",
              cursor: "pointer",
              marginTop: 6,
              boxShadow: "0 4px 10px oklch(0.58 0.115 232 / 0.2)",
              transition: "background 0.15s",
            }}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: "0.84rem", color: "oklch(0.46 0.022 245)" }}>
          Don't have an account?{" "}
          <Link href="/onboarding" style={{ color: "oklch(0.58 0.115 232)", textDecoration: "none", fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
