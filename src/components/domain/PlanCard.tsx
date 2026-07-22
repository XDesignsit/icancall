import React from "react";
import { cx } from "../ui/cx";

export interface PlanFeature {
  id: string;
  label: React.ReactNode;
}

interface PlanCardProps {
  name: React.ReactNode;
  description?: React.ReactNode;
  /** Formatted headline price, e.g. "$49.99". */
  price: React.ReactNode;
  /** Cadence line under the price, e.g. "per month". */
  cadence?: React.ReactNode;
  /** Yearly-saving line; `.yearly` renders it in the positive green. */
  savings?: React.ReactNode;
  /** Corner ribbon, e.g. "Most popular". */
  tag?: React.ReactNode;
  features?: ReadonlyArray<PlanFeature>;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <path d="m5 13 4 4L19 7" />
  </svg>
);

/**
 * Selectable plan row used by the signup wizard and the dashboard plan picker.
 * `.plan-card` is a three-column grid: radio, copy, price.
 */
export default function PlanCard({
  name,
  description,
  price,
  cadence,
  savings,
  tag,
  features,
  selected = false,
  onSelect,
  className,
}: PlanCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx("plan-card", selected && "sel", className)}
    >
      <span className="radio" />
      <span className="pname">
        {name}
        {tag && <span className="ptag">{tag}</span>}
      </span>
      <span className="pprice">
        <b>{price}</b>
        {cadence && <span>{cadence}</span>}
        {savings && <span className="yearly">{savings}</span>}
      </span>
      {description && <span className="pdesc">{description}</span>}
      {features && features.length > 0 && (
        <ul className="plan-feats">
          {features.map((feature) => (
            <li key={feature.id}>
              {CHECK}
              {feature.label}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
