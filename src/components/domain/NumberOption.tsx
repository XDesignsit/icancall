import React from "react";
import { cx } from "../ui/cx";

interface NumberOptionProps {
  /** Formatted phone number, e.g. "(868) 555-0142". */
  number: React.ReactNode;
  /** Locality line under the number. */
  meta?: React.ReactNode;
  /** Flags an easy-to-remember pattern with the `.memorable` pill. */
  memorable?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}

const TICK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

/** Selectable phone number in the picker grid (`.num-opt`). */
export default function NumberOption({
  number,
  meta,
  memorable,
  selected = false,
  disabled = false,
  onSelect,
  className,
}: NumberOptionProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cx("num-opt", selected && "sel", disabled && "disabled", className)}
    >
      <span className="tick">{TICK}</span>
      <span className="nlabel">
        <span className="nnum">{number}</span>
        {meta && <span className="nmeta">{meta}</span>}
        {memorable && <span className="memorable">{memorable}</span>}
      </span>
    </button>
  );
}
