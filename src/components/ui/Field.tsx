import React from "react";
import { cx } from "./cx";

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  /** Muted trailing text inside the label, e.g. "optional". */
  hint?: React.ReactNode;
  /** Message for `.field-err`; the element only shows while this is set. */
  error?: string | null;
  htmlFor?: string;
}

export default function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
  ...rest
}: FieldProps) {
  return (
    <div className={cx("field", className)} {...rest}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {hint && <span className="hint"> {hint}</span>}
        </label>
      )}
      {children}
      <div className={cx("field-err", error && "show")}>{error}</div>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Applies `.input.error`, the rose border state. */
  invalid?: boolean;
}

/**
 * The landing/signup input treatment (`.input`). Dashboard forms style bare
 * `input` elements through `.field input` and don't need this wrapper.
 */
export function Input({ invalid = false, className, ...rest }: InputProps) {
  return <input className={cx("input", invalid && "error", className)} {...rest} />;
}
