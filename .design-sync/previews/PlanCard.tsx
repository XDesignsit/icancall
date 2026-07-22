import React, { useState } from "react";

import { PlanCard } from "icancall-fresh";

const FEATURES = {
  essential: [
    { id: "n", label: "1 dedicated number" },
    { id: "c", label: "3 routable contacts" },
  ],
  pro: [
    { id: "n", label: "2 dedicated numbers" },
    { id: "c", label: "6 routable contacts" },
    { id: "m", label: "Caller menu routing" },
  ],
  care: [
    { id: "n", label: "5 dedicated numbers" },
    { id: "s", label: "2 caregiver seats" },
    { id: "a", label: "Shared admin dashboard" },
  ],
};

export const PlanPicker = () => {
  const [plan, setPlan] = useState("pro");
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 620 }}>
      <PlanCard
        name="Essential"
        description="One number for one loved one."
        price="$14.99"
        cadence="/ month"
        features={FEATURES.essential}
        selected={plan === "essential"}
        onSelect={() => setPlan("essential")}
      />
      <PlanCard
        name="Pro"
        description="Two numbers with full routing control."
        price="$24.99"
        cadence="/ month"
        savings="Save 17% on annual"
        tag="Most popular"
        features={FEATURES.pro}
        selected={plan === "pro"}
        onSelect={() => setPlan("pro")}
      />
      <PlanCard
        name="Care Team"
        description="For families sharing the load."
        price="$49.99"
        cadence="/ month"
        features={FEATURES.care}
        selected={plan === "care"}
        onSelect={() => setPlan("care")}
      />
    </div>
  );
};

export const Selected = () => (
  <div style={{ maxWidth: 620 }}>
    <PlanCard
      name="Care Team"
      tag="New"
      description="For families sharing the load."
      price="$49.99"
      cadence="/ month"
      savings="Save 17% on annual"
      features={FEATURES.care}
      selected
    />
  </div>
);
