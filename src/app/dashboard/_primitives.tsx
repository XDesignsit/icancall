"use client";

import React, { useEffect } from "react";

import { ICONS, Icon } from "./_icons";

/* Dashboard-local primitives, shared by every view in this folder. */

export const initials = (name: string) =>
  (name || "").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export function Avatar({ name, color, size = 46, radius = "50%", fontSize }: { name: string; color: string; size?: number; radius?: string; fontSize?: number }) {
  return (
    <span
      className="ava"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        fontSize: fontSize || size * 0.38,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 700,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return (
    <span className={`badge badge-${kind}`}>
      <span className="d"></span>
      {children}
    </span>
  );
}

export function Toggle({
  on,
  onChange,
  labels = ["Busy", "Available"],
}: {
  on: boolean;
  onChange: (val: boolean) => void;
  labels?: [string, string];
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? "on" : ""}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="track"></span>
      <span className="lbl">{on ? labels[1] : labels[0]}</span>
    </button>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <Icon name="check" />
      {msg}
    </div>
  );
}

export function StatCard({
  icon,
  iconBg,
  iconColor,
  val,
  lbl,
  trend,
  trendDir,
}: {
  icon: keyof typeof ICONS;
  iconBg: string;
  iconColor: string;
  val: string | number;
  lbl: string;
  trend?: string;
  trendDir?: "up" | "down";
}) {
  return (
    <div className="stat">
      <div className="ic" style={{ background: iconBg, color: iconColor }}>
        <Icon name={icon} />
      </div>
      <div className="val">{val}</div>
      <div className="lbl">{lbl}</div>
      {trend && <div className={`trend trend-${trendDir}`}>{trend}</div>}
    </div>
  );
}
