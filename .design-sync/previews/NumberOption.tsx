import React, { useState } from "react";

import { NumberOption } from "icancall-fresh";

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 620 }}>{children}</div>
);

export const PickerGrid = () => {
  const [sel, setSel] = useState("a");
  return (
    <Grid>
      <NumberOption
        number="(868) 555-0142"
        meta="Port of Spain, Trinidad"
        selected={sel === "a"}
        onSelect={() => setSel("a")}
      />
      <NumberOption
        number="(868) 555-0188"
        meta="Port of Spain, Trinidad"
        selected={sel === "b"}
        onSelect={() => setSel("b")}
      />
    </Grid>
  );
};

export const Memorable = () => (
  <Grid>
    <NumberOption number="(415) 555-CARE" meta="San Francisco, CA" memorable="Easy to remember" />
    <NumberOption number="(415) 555-0100" meta="San Francisco, CA" />
  </Grid>
);

export const Unavailable = () => (
  <Grid>
    <NumberOption number="(246) 555-0140" meta="Bridgetown, Barbados" disabled />
    <NumberOption number="(246) 555-0141" meta="Bridgetown, Barbados" selected />
  </Grid>
);
