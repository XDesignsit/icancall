import React from "react";

import { StatCard } from "icancall-fresh";

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="admin" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 520 }}>
    {children}
  </div>
);

const phone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);

const check = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5L20 6" />
  </svg>
);

export const Overview = () => (
  <Grid>
    <StatCard
      icon={phone}
      iconStyle={{ background: "var(--tint)", color: "var(--blue-deep)" }}
      value="11"
      label="Calls this week"
      trend="▲ 18%"
      trendDirection="up"
    />
    <StatCard
      icon={check}
      iconStyle={{ background: "oklch(0.95 0.05 158)", color: "oklch(0.42 0.13 158)" }}
      value="73%"
      label="Connected on first try"
      trend="▲ 6%"
      trendDirection="up"
    />
  </Grid>
);

export const Declining = () => (
  <Grid>
    <StatCard
      icon={phone}
      iconStyle={{ background: "oklch(0.96 0.05 22)", color: "oklch(0.5 0.18 22)" }}
      value="3"
      label="Missed → alerted"
      trend="▼ 2"
      trendDirection="down"
    />
    <StatCard value="3" label="Trusted contacts" />
  </Grid>
);
