import React from "react";

import { Button } from "icancall-fresh";

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
);

export const Variants = () => (
  <Row>
    <Button variant="primary">Add a contact</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="text">Skip for now</Button>
  </Row>
);

export const Large = () => (
  <Row>
    <Button variant="primary" large>Start free trial</Button>
    <Button variant="ghost" large>See how it works</Button>
  </Row>
);

export const Disabled = () => (
  <Row>
    <Button variant="primary" disabled>Saving…</Button>
    <Button variant="ghost" disabled>Cancel</Button>
  </Row>
);
