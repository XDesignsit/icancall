import React from "react";
import { cx } from "./cx";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/** Minus / value / plus control used for billing add-on quantities. */
export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  disabled = false,
  className,
  ...rest
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className={cx("stepper", className)} {...rest}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease"
      >
        &minus;
      </button>
      <span className="v">{value}</span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
