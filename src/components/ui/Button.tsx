import React from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "ghost" | "text";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  large?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  text: "btn-text",
};

export default function Button({
  variant = "primary",
  large = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", VARIANT_CLASS[variant], large && "btn-lg", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
