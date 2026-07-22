import React from "react";
import { cx } from "./cx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Applies `.card-pad`. Omit when the card supplies its own head/body padding. */
  padded?: boolean;
  /** Applies `.danger-zone`, the rose-bordered destructive-action treatment. */
  danger?: boolean;
}

export default function Card({
  padded = false,
  danger = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx("card", padded && "card-pad", danger && "danger-zone", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Trailing controls — rendered after the title block, which `.card-head` spaces apart. */
  actions?: React.ReactNode;
}

export function CardHead({
  title,
  subtitle,
  actions,
  className,
  ...rest
}: CardHeadProps) {
  return (
    <div className={cx("card-head", className)} {...rest}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("card-pad", className)} {...rest}>
      {children}
    </div>
  );
}
