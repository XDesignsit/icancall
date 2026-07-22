import React from "react";
import { cx } from "../ui/cx";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** SVG mark for `.stat .ic`; pass `iconStyle` to tint the tile. */
  icon?: React.ReactNode;
  iconStyle?: React.CSSProperties;
  value: React.ReactNode;
  label: React.ReactNode;
  /** Delta line under the label. */
  trend?: React.ReactNode;
  trendDirection?: "up" | "down";
}

export default function StatCard({
  icon,
  iconStyle,
  value,
  label,
  trend,
  trendDirection = "up",
  className,
  ...rest
}: StatCardProps) {
  return (
    <div className={cx("stat", className)} {...rest}>
      {icon && (
        <div className="ic" style={iconStyle}>
          {icon}
        </div>
      )}
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
      {trend && <div className={cx("trend", `trend-${trendDirection}`)}>{trend}</div>}
    </div>
  );
}
