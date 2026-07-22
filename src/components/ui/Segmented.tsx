import React from "react";
import { cx } from "./cx";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Pill segmented control. Buttons carry `.seg-btn` so this renders correctly in
 * both scopes: the landing page styles `.seg-btn`, the dashboard styles
 * `.seg button` with its own tighter metrics.
 */
export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedProps<T>) {
  return (
    <div className={cx("seg", className)} role="tablist" {...rest}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className={cx("seg-btn", option.value === value && "active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
