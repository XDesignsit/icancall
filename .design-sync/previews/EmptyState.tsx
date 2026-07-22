import React from "react";

import { Button, EmptyState } from "icancall-fresh";

const PhoneIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);

export const NoCalls = () => (
  <div className="admin" style={{ maxWidth: 560 }}>
    <EmptyState
      icon={PhoneIcon}
      title="No calls yet"
      description="Once someone dials this number, every attempt shows up here — including the ones nobody picked up."
      action={<Button variant="primary">Make a test call</Button>}
    />
  </div>
);

export const WithoutAction = () => (
  <div className="admin" style={{ maxWidth: 560 }}>
    <EmptyState
      icon={PhoneIcon}
      title="No contacts on this line"
      description="Add the people who should be rung when this number is called."
    />
  </div>
);
