import React from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ghost" | "text";

export interface ButtonStyleProps {
  variant?: ButtonVariant;
  large?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  text: "btn-text",
};

/**
 * The button class string on its own.
 *
 * Use this for elements that must stay anchors — `next/link`, external links —
 * where rendering a real `<button>` would break navigation semantics.
 */
export function buttonClass({
  variant = "primary",
  large = false,
  className,
}: ButtonStyleProps = {}): string {
  return cx("btn", VARIANT_CLASS[variant], large && "btn-lg", className);
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonStyleProps {}

export default function Button({
  variant = "primary",
  large = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, large, className })} {...rest}>
      {children}
    </button>
  );
}
