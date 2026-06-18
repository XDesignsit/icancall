"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function TermsOfServicePage() {
  const [policyHtml, setPolicyHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const origin = window.location.href;
        const res = await fetch(
          `https://embed.termageddon.com/api/render/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09?origin=${encodeURIComponent(
            origin
          )}`
        );
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await res.text();
        setPolicyHtml(data);
      } catch (err) {
        console.error("Failed to load Termageddon terms of service:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
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
          Terms of Service
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
          id="VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
          className="policy_embed_div"
          aria-live="polite"
          aria-busy={loading ? "true" : "false"}
          style={{
            fontSize: "1rem",
            lineHeight: "1.7",
            color: "oklch(0.30 0.02 240)",
          }}
        >
          {loading && (
            <div>
              Please wait while the terms of service are loaded. If they do not load, please{" "}
              <a
                rel="nofollow"
                aria-label="click here to view the terms of service"
                href="https://policies.termageddon.com/api/policy/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
                target="_blank"
                style={{ color: "oklch(0.45 0.13 242)", textDecoration: "underline" }}
              >
                click here to view the terms of service
              </a>.
            </div>
          )}

          {!loading && error && (
            <div role="alert" style={{ color: "red" }}>
              There was an error loading the terms of service, please{" "}
              <a
                href="https://embed.termageddon.com/api/policy/VFRCelZUSjJPSEJEYkVKMVltYzlQUT09"
                target="_blank"
                style={{ color: "oklch(0.45 0.13 242)", textDecoration: "underline" }}
              >
                click here to view the terms of service
              </a>.
            </div>
          )}

          {!loading && !error && policyHtml && (
            <div dangerouslySetInnerHTML={{ __html: policyHtml }} />
          )}
        </div>
      </div>
    </div>
  );
}
