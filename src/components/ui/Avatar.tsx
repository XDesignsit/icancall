import React from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  /** Background fill. The surrounding selector supplies size and radius. */
  color?: string;
  /**
   * Contextual selector for the slot this sits in — `.avatar` in the landing
   * call chain, `.ava` in dashboard rows, `.big-ava` on the account page.
   */
  className?: string;
}

/** First letters of the first two words, e.g. "Ada Lovelace" -> "AL". */
export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Avatar({
  name,
  color,
  className = "ava",
  style,
  ...rest
}: AvatarProps) {
  return (
    <span
      className={className}
      style={color ? { background: color, ...style } : style}
      aria-hidden="true"
      {...rest}
    >
      {initialsOf(name)}
    </span>
  );
}
