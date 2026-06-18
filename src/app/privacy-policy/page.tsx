"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    // Inject the specific Termageddon script provided
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/WVdVNVRHaENhRXczVkUwcmJHYzlQUT09.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when page unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.985 0.005 220)",
        fontFamily: '"Outfit", "Helvetica Neue", Arial, sans-serif',
        padding: "48px 24px",
        color: "oklch(0.25 0.02 240)",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid oklch(0.92 0.01 225)",
          boxShadow: "0 10px 30px oklch(0.4 0.05 240 / 0.04)",
          padding: "40px 32px",
        }}
      >
        {/* Navigation */}
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "oklch(0.45 0.13 242)", // Brand accent color
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Header */}
        <h1
          style={{
            fontSize: "2.4rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: 8,
            color: "oklch(0.20 0.02 245)",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "oklch(0.55 0.015 240)",
            marginBottom: 40,
            borderBottom: "1px solid oklch(0.92 0.01 225)",
            paddingBottom: 20,
          }}
        >
          Last updated: June 18, 2026
        </p>

        {/* Termageddon Embed Container */}
        <div
          id="WVdVNVRHaENhRXczVkUwcmJHYzlQUT09"
          className="policy_embed_div"
          aria-live="polite"
          aria-busy="true"
          style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            color: "oklch(0.30 0.02 240)",
          }}
        >
          Please wait while the policy is loaded. If it does not load, please{" "}
          <a
            rel="nofollow"
            aria-label="click here to view the policy"
            href="https://policies.termageddon.com/api/policy/WVdVNVRHaENhRXczVkUwcmJHYzlQUT09"
            target="_blank"
            style={{ color: "oklch(0.45 0.13 242)", textDecoration: "underline" }}
          >
            click here to view the policy
          </a>.
        </div>
      </div>
    </div>
  );
}
