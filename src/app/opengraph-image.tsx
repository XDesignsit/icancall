import { ImageResponse } from "next/og";
import { SYMBOLS } from "./_home/IconSprite";

// The link preview for every page that sets no image of its own, including the
// dashboard links in call alert and welcome texts: a preview fetcher has no
// session, so /dashboard redirects it to /login, which inherits this image.
export const alt = "iCanCall: one number your loved one will never forget";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens from globals.css, converted from oklch (which the renderer
// does not support) to hex.
const INK = "#192531";
const INK_SOFT = "#4b5761";
const BLUE_DEEP = "#005886";
const BG = "#f9fdff";
const TINT = "#e7f7fc";
const TINT_2 = "#d8f2f7";

// The homepage wordmark, made standalone: the renderer resolves neither
// <use href> nor CSS variables, so the var() fills fall back to their colors.
function wordmarkDataUrl() {
  const [, viewBox, paths] = SYMBOLS.match(/<symbol id="logo" viewBox="([^"]+)">([\s\S]*?)<\/symbol>/)!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${paths.replace(/var\(--lg-[ab],(#[0-9a-f]+)\)/gi, "$1")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default function Image() {
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
        {/* 800 x 154.5652 viewBox */}
        <img src={wordmarkDataUrl()} width={352} height={68} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 72, letterSpacing: "-0.03em", lineHeight: 1.08 }}>
            <span>One number your loved one will&nbsp;</span>
            <span style={{ color: BLUE_DEEP }}>never forget.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 32, color: INK_SOFT, lineHeight: 1.35 }}>
            Calls reach your trusted contacts until someone answers.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: BLUE_DEEP }}>icancall.co</div>
      </div>
    ),
    size,
  );
}
