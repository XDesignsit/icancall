import React from "react";

import { Button, Card, CardBody, CardHead } from "icancall-fresh";

export const WithHead = () => (
  <div className="admin" style={{ maxWidth: 520 }}>
    <Card>
      <CardHead
        title="Your numbers"
        subtitle="3 included in your plan"
        actions={<Button variant="ghost">Add number</Button>}
      />
      <CardBody>
        Calls to these numbers follow the routing you set up for each line.
      </CardBody>
    </Card>
  </div>
);

export const Padded = () => (
  <div className="admin" style={{ maxWidth: 520 }}>
    <Card padded>
      <strong style={{ display: "block", marginBottom: 6 }}>Minutes remaining</strong>
      <span style={{ color: "var(--ink-soft)" }}>
        420 of 500 minutes left this cycle. Rollover applies on the Pro plan.
      </span>
    </Card>
  </div>
);

export const Danger = () => (
  <div className="admin" style={{ maxWidth: 520 }}>
    <Card danger>
      <CardHead title="Close account" subtitle="This cannot be undone" />
      <CardBody>
        Closing your account releases every number on it after 30 days.
      </CardBody>
    </Card>
  </div>
);
