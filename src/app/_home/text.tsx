import React from "react";

export { fill } from "@/lib/translations/home/format";

/** Render a translated string with one `{key}` placeholder replaced by a React node. */
export function rich(s: string, key: string, node: React.ReactNode): React.ReactNode {
  const parts = s.split(`{${key}}`);
  return parts.flatMap((p, i) => (i === 0 ? [p] : [<React.Fragment key={i}>{node}</React.Fragment>, p]));
}

/** Inline style carrying CSS custom properties (the design drives most motion through them). */
export function vars(v: Record<string, string | number>): React.CSSProperties {
  return v as React.CSSProperties;
}

/** Waveform bar heights from the design, reused by every waveform on the page. */
const WAVE = [
  0.7, 0.82, 0.83, 0.69, 0.93, 0.52, 0.99, 0.35, 1, 0.43, 0.96, 0.6, 0.89, 0.76, 0.77, 0.88, 0.62, 0.96, 0.45, 1, 0.33,
  0.99, 0.51, 0.94, 0.67, 0.84,
];

export function WaveBars({ n }: { n: number }) {
  return (
    <>
      {WAVE.slice(0, n).map((h, k) => (
        <i key={k} style={vars({ "--k": k, "--h": h.toFixed(2) })} />
      ))}
    </>
  );
}

/** `<svg class="i"><use href="#i-…"/></svg>` from the sprite. */
export function Icon({ id, className = "i", hidden = true }: { id: string; className?: string; hidden?: boolean }) {
  return (
    <svg className={className} aria-hidden={hidden || undefined}>
      <use href={`#${id}`} />
    </svg>
  );
}
