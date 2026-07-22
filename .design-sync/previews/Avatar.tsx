import React from "react";

import { Avatar } from "icancall-fresh";

export const Colours = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Avatar name="Maria Delgado" color="oklch(0.58 0.115 232)" />
    <Avatar name="Joseph Award" color="oklch(0.62 0.10 198)" />
    <Avatar name="Aunt Rosa" color="oklch(0.55 0.13 285)" />
    <Avatar name="Dr Chen" color="oklch(0.66 0.14 158)" />
  </div>
);

export const SingleName = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Avatar name="Support" color="oklch(0.58 0.115 232)" />
    <Avatar name="Neighbour" color="oklch(0.74 0.13 70)" />
  </div>
);
