import { ImageResponse } from "next/og";
import { SYMBOLS } from "@/app/_home/IconSprite";
import type { LinkKind } from "@/lib/linkKinds";

// Link previews (Open Graph cards) for the links iCanCall sends by text. Each
// text links to /dashboard?n=<kind>; a preview fetcher has no session, so the
// proxy sends it to /login?n=<kind>, whose metadata picks the matching card
// from /api/og/<kind>. Pages without a kind use the root opengraph-image.

export const OG_SIZE = { width: 1200, height: 630 };

// Brand tokens from globals.css, converted from oklch (which the renderer
// does not support) to hex.
const INK = "#192531";
const INK_SOFT = "#4b5761";
const BLUE_DEEP = "#005886";
const BG = "#f9fdff";
const TINT = "#e7f7fc";
const TINT_2 = "#d8f2f7";

type Preview = {
  title: string;
  headline: [start: string, accent: string];
  tagline: string;
  badge?: { label: string; icon: string; color: string };
};

export const DEFAULT_PREVIEW: Preview = {
  title: "iCanCall",
  headline: ["One number your loved one will ", "never forget."],
  tagline: "Calls reach your trusted contacts until someone answers.",
};

export const LINK_PREVIEWS = {
  connected: {
    title: "Call answered",
    headline: ["Someone in your circle ", "picked up."],
    tagline: "See who answered and how long the call lasted in your call log.",
    badge: { label: "Call answered", icon: "i-in", color: "#2cab70" },
  },
  voicemail: {
    title: "New voicemail",
    headline: ["You have a ", "new voicemail."],
    tagline: "Listen to it and read the transcript in your call log.",
    badge: { label: "Voicemail", icon: "i-vm", color: "#0f85b2" },
  },
  missed: {
    title: "Missed call",
    headline: ["A call to your line ", "went unanswered."],
    tagline: "See who called and when in your call log.",
    badge: { label: "Missed call", icon: "i-miss", color: "#dd4c5c" },
  },
  welcome: {
    title: "Welcome to iCanCall",
    headline: ["Your iCanCall line ", "is active."],
    tagline: "Add trusted contacts and manage your lines from your dashboard.",
    badge: { label: "Welcome", icon: "i-check", color: "#1c989c" },
  },
} satisfies Record<LinkKind, Preview>;

// A sprite symbol as a standalone SVG data URL: the renderer resolves neither
// <use href> nor CSS variables, so the var() fills fall back to their colors.
function symbolDataUrl(id: string, attrs = "") {
  const [, viewBox, inner] = SYMBOLS.match(new RegExp(`<symbol id="${id}" viewBox="([^"]+)"[^>]*>([\\s\\S]*?)</symbol>`))!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${attrs}>${inner.replace(/var\(--lg-[ab],(#[0-9a-f]+)\)/gi, "$1")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function previewImage({ headline, tagline, badge }: Preview) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${BG} 0%, ${TINT} 60%, ${TINT_2} 100%)`,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* 800 x 154.5652 viewBox */}
          <img src={symbolDataUrl("logo")} width={352} height={68} alt="" />
          {badge && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 28px 12px 12px",
                borderRadius: 999,
                background: "#ffffff",
                border: `2px solid ${badge.color}`,
                fontSize: 30,
                color: badge.color,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  marginRight: 16,
                  borderRadius: 999,
                  background: badge.color,
                }}
              >
                <img
                  src={symbolDataUrl(badge.icon, 'fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"')}
                  width={32}
                  height={32}
                  alt=""
                />
              </div>
              {badge.label}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
            <span>{headline[0].replace(/ $/, " ")}</span>
            <span style={{ color: BLUE_DEEP }}>{headline[1]}</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: INK_SOFT, lineHeight: 1.35 }}>{tagline}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: BLUE_DEEP }}>icancall.co</div>
      </div>
    ),
    OG_SIZE,
  );
}
