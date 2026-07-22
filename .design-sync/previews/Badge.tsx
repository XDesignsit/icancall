import React from "react";

import { Badge } from "icancall-fresh";

export const Tones = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
    <Badge tone="green" dot>Connected</Badge>
    <Badge tone="rose" dot>Missed</Badge>
    <Badge tone="amber" dot>Ringing</Badge>
    <Badge tone="blue" dot>Voicemail</Badge>
    <Badge tone="gray" dot>Unavailable</Badge>
  </div>
);

export const WithoutDot = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
    <Badge tone="blue">Pro</Badge>
    <Badge tone="green">Care Team</Badge>
    <Badge tone="gray">Essential</Badge>
  </div>
);

export const InContext = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <span style={{ fontWeight: 600 }}>Priority cascaded line</span>
    <Badge tone="green" dot>All ring</Badge>
  </div>
);
