import React from "react";
import { cx } from "./cx";

interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** SVG mark for `.empty .ic`. Per house style this is a vector icon, never an emoji. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Call-to-action rendered below the copy. */
  action?: React.ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div className={cx("empty", className)} {...rest}>
      {icon && <div className="ic">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
