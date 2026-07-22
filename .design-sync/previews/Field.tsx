import React from "react";

import { Field, Input } from "icancall-fresh";

export const Basic = () => (
  <div style={{ maxWidth: 420 }}>
    <Field label="Full name" htmlFor="nm">
      <Input id="nm" placeholder="e.g. Maria Delgado" defaultValue="Maria Delgado" />
    </Field>
  </div>
);

export const WithHint = () => (
  <div style={{ maxWidth: 420 }}>
    <Field label="Relationship" hint="optional" htmlFor="rel">
      <Input id="rel" placeholder="Daughter" />
    </Field>
  </div>
);

export const WithError = () => (
  <div style={{ maxWidth: 420 }}>
    <Field label="Phone to ring" htmlFor="tel" error="Enter a number including the area code.">
      <Input id="tel" invalid defaultValue="555-0100" />
    </Field>
  </div>
);
