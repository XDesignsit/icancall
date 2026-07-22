import React from "react";
import { cx } from "../ui/cx";
import Avatar from "../ui/Avatar";

interface ContactRowProps {
  /** 1-based position in the call chain, shown in `.pos .num`. */
  position: number;
  name: string;
  relationship?: React.ReactNode;
  phone?: React.ReactNode;
  /** Avatar fill for this contact. */
  color?: string;
  /** Dims the row — used when the contact is unavailable. */
  dim?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /** Trailing controls, e.g. an availability Toggle and `.mini` icon buttons. */
  actions?: React.ReactNode;
  className?: string;
}

const CHEVRON_UP = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="m6 15 6-6 6 6" />
  </svg>
);

const CHEVRON_DOWN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** A single entry in the dashboard call chain (`.crow`). */
export default function ContactRow({
  position,
  name,
  relationship,
  phone,
  color,
  dim = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  actions,
  className,
}: ContactRowProps) {
  const reorderable = Boolean(onMoveUp || onMoveDown);

  return (
    <div className={cx("crow", dim && "dim", className)}>
      <div className="pos">
        <span className="num">{position}</span>
        {reorderable && (
          <div className="reorder">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              aria-label={`Move ${name} up`}
            >
              {CHEVRON_UP}
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              aria-label={`Move ${name} down`}
            >
              {CHEVRON_DOWN}
            </button>
          </div>
        )}
      </div>
      <Avatar name={name} color={color} />
      <div className="info">
        <b>{name}</b>
        {relationship && <div className="rel">{relationship}</div>}
        {phone && <div className="tel">{phone}</div>}
      </div>
      {actions && <div className="acts">{actions}</div>}
    </div>
  );
}
