import React from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  /** Background fill — normally one of the palette entries in the line/contact data. */
  color?: string;
  /** Diameter in px. */
  size?: number;
  /** Defaults to a circle; pass a length for the squared-off dashboard slots. */
  radius?: string;
  /** Defaults to 38% of `size`, which is what the dashboard slots use. */
  fontSize?: number;
  /**
   * Contextual selector for the slot this sits in — `.ava` in dashboard rows,
   * `.avatar` in the landing call chain, `.big-ava` on the account page.
   */
  className?: string;
}

/** First letters of the first two words, e.g. "Ada Lovelace" -> "AL". */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/**
 * Initials avatar.
 *
 * Sizing is inline rather than from the stylesheet on purpose: `.ava` has no
 * standalone rule — it is only ever styled as a descendant (`.crow .ava`,
 * `.user-chip .ava`, `.cp-slot .ava`). Without these styles the avatar renders
 * as unstyled text anywhere outside those parents.
 */
export default function Avatar({
  name,
  color,
  size = 46,
  radius = "50%",
  fontSize,
  className = "ava",
  style,
  ...rest
}: AvatarProps) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: fontSize ?? size * 0.38,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
        flex: "none",
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    >
      {initialsOf(name)}
    </span>
  );
}
