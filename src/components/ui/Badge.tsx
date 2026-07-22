import React from "react";
import { cx } from "./cx";

type BadgeTone = "green" | "rose" | "amber" | "blue" | "gray";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Renders the leading status dot the tone classes already colour. */
  dot?: boolean;
}

export default function Badge({
  tone = "gray",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={cx("badge", `badge-${tone}`, className)} {...rest}>
      {dot && <i className="d" />}
      {children}
    </span>
  );
}
