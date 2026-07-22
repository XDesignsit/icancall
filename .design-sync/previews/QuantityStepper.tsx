import React, { useState } from "react";

import { QuantityStepper } from "icancall-fresh";

export const Interactive = () => {
  const [n, setN] = useState(2);
  return (
    <div className="admin" style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <QuantityStepper value={n} onChange={setN} min={0} max={5} />
      <span style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>
        {n} extra number{n === 1 ? "" : "s"}
      </span>
    </div>
  );
};

export const AtMinimum = () => (
  <div className="admin">
    <QuantityStepper value={0} onChange={() => {}} min={0} max={5} />
  </div>
);

export const AtMaximum = () => (
  <div className="admin">
    <QuantityStepper value={5} onChange={() => {}} min={0} max={5} />
  </div>
);
