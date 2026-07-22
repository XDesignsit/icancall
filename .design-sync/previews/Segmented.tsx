import React, { useState } from "react";

import { Segmented } from "icancall-fresh";

const MODES = [
  { value: "cascade" as const, label: "Cascade" },
  { value: "simultaneous" as const, label: "All ring" },
  { value: "menu" as const, label: "Caller menu" },
];

export const RoutingMode = () => {
  const [mode, setMode] = useState<"cascade" | "simultaneous" | "menu">("cascade");
  return <Segmented options={MODES} value={mode} onChange={setMode} aria-label="Routing mode" />;
};

export const Billing = () => {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  return (
    <Segmented
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Annual" },
      ]}
      value={cycle}
      onChange={setCycle}
      aria-label="Billing cycle"
    />
  );
};

export const WithDisabled = () => (
  <Segmented
    options={[
      { value: "cascade", label: "Cascade" },
      { value: "simultaneous", label: "All ring" },
      { value: "schedule", label: "Schedule", disabled: true },
    ]}
    value="cascade"
    onChange={() => {}}
    aria-label="Routing mode with a locked option"
  />
);
