import React from "react";
import { cx } from "./cx";

interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  on: boolean;
  onChange?: (next: boolean) => void;
  /** Text beside the track. `.lbl` reserves a fixed width so it won't reflow. */
  label?: React.ReactNode;
  /**
   * `toggle` is the dashboard switch; `avail` is the narrower landing-page
   * availability switch. They are separate selectors with separate metrics.
   */
  variant?: "toggle" | "avail";
}

export default function Toggle({
  on,
  onChange,
  label,
  variant = "toggle",
  className,
  disabled,
  onClick,
  ...rest
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      className={cx(variant, on && "on", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onChange?.(!on);
      }}
      {...rest}
    >
      <span className="track" />
      {label != null && <span className="lbl">{label}</span>}
    </button>
  );
}
