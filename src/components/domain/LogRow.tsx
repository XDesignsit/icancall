import React from "react";
import { cx } from "../ui/cx";

export type CallDirection = "in" | "miss" | "vm";

interface LogRowProps {
  direction: CallDirection;
  /** SVG mark for the `.dir` tile; the direction class supplies its colours. */
  icon?: React.ReactNode;
  caller: React.ReactNode;
  callerMeta?: React.ReactNode;
  /** Who the call was routed to. */
  routedTo?: React.ReactNode;
  routedMeta?: React.ReactNode;
  /** Formatted duration, e.g. "2m 14s". Hidden under 820px by the stylesheet. */
  duration?: React.ReactNode;
  when?: React.ReactNode;
  className?: string;
}

/** One row of the dashboard call log (`.logrow`). */
export default function LogRow({
  direction,
  icon,
  caller,
  callerMeta,
  routedTo,
  routedMeta,
  duration,
  when,
  className,
}: LogRowProps) {
  return (
    <div className={cx("logrow", className)}>
      <div className={cx("dir", `dir-${direction}`)}>{icon}</div>
      <div className="who">
        <b>{caller}</b>
        {callerMeta && <span>{callerMeta}</span>}
      </div>
      <div className="routed">
        {routedTo && <b>{routedTo}</b>}
        {routedMeta}
      </div>
      <div className="dur">{duration}</div>
      <div className="when">{when}</div>
    </div>
  );
}
