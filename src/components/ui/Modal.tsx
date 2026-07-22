"use client";

import React, { useEffect } from "react";
import { cx } from "./cx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Buttons for `.modal-foot`. The footer is omitted when absent. */
  footer?: React.ReactNode;
  /** Escape and backdrop clicks stop closing — for in-flight operations. */
  dismissible?: boolean;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="overlay"
      onClick={() => {
        if (dismissible) onClose();
      }}
    >
      <div
        className={cx("modal", className)}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          {dismissible && (
            <button type="button" className="x" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
