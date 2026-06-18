"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  const policyId = process.env.NEXT_PUBLIC_TERMAGEDDON_POLICY_ID || "YOUR_POLICY_KEY";

  useEffect(() => {
    // Dynamically inject the Termageddon embed script on client-side mount
    if (policyId === "YOUR_POLICY_KEY") {
      console.warn("Termageddon Policy ID is not configured. Please set NEXT_PUBLIC_TERMAGEDDON_POLICY_ID in your environment variables.");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://app.termageddon.com/api/v1/policy/${policyId}?type=js`;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when page unmounts
      document.body.removeChild(script);
    };
  }, [policyId]);

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
        {policyId === "YOUR_POLICY_KEY" ? (
          <div
            style={{
              padding: "32px",
              background: "oklch(0.96 0.02 220)",
              border: "1px dashed oklch(0.80 0.04 220)",
              borderRadius: 16,
              textAlign: "center",
              color: "oklch(0.50 0.02 240)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", color: "oklch(0.35 0.02 240)" }}>Termageddon Policy Placeholder</h3>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.5" }}>
              To display your live Privacy Policy, please configure the <b>`NEXT_PUBLIC_TERMAGEDDON_POLICY_ID`</b> environment variable in your Vercel project settings with your Termageddon policy key.
            </p>
          </div>
        ) : (
          <div
            data-name="termageddon-embed"
            id={policyId}
            style={{
              fontSize: "1rem",
              lineHeight: "1.7",
              color: "oklch(0.30 0.02 240)",
            }}
          >
            {/* The policy content will be injected here dynamically by Termageddon's script */}
            <p style={{ textAlign: "center", color: "oklch(0.60 0.015 240)" }}>Loading Privacy Policy...</p>
          </div>
        )}
      </div>
    </div>
  );
}
