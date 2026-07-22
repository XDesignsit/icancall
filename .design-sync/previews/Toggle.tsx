import React, { useState } from "react";

import { Toggle } from "icancall-fresh";

export const Availability = () => {
  const [on, setOn] = useState(true);
  return (
    <div className="admin">
      <Toggle on={on} onChange={setOn} label={on ? "Available" : "Busy"} />
    </div>
  );
};

export const BothStates = () => (
  <div className="admin" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Toggle on onChange={() => {}} label="Available" />
    <Toggle on={false} onChange={() => {}} label="Busy" />
  </div>
);

export const LandingVariant = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Toggle variant="avail" on onChange={() => {}} label="Available" />
    <Toggle variant="avail" on={false} onChange={() => {}} label="Busy" />
  </div>
);
