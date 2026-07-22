import React from "react";

import { Button, Field, Input, Modal } from "icancall-fresh";

/**
 * `.overlay` is `position: fixed`, so on its own the dialog escapes the preview
 * card and centres on the viewport. A `transform` on an ancestor makes it the
 * containing block for fixed descendants, pinning the overlay inside this box
 * instead — the only way to show the open state inside a card.
 */
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div
    className="admin"
    style={{
      position: "relative",
      transform: "translateZ(0)",
      height: 420,
      width: "100%",
      borderRadius: 12,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

export const AddContact = () => (
  <Stage>
    <Modal
      open
      onClose={() => {}}
      title="Add a contact"
      footer={
        <>
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Add a contact</Button>
        </>
      }
    >
      <Field label="Full name" htmlFor="m-name">
        <Input id="m-name" placeholder="e.g. Maria Delgado" />
      </Field>
      <Field label="Phone to ring" htmlFor="m-tel">
        <Input id="m-tel" placeholder="(415) 555-0100" />
      </Field>
    </Modal>
  </Stage>
);

export const Confirm = () => (
  <Stage>
    <Modal
      open
      onClose={() => {}}
      title="Remove this number?"
      footer={
        <>
          <Button variant="ghost">Keep it</Button>
          <Button variant="primary">Remove</Button>
        </>
      }
    >
      Calls to (868) 555-0142 will stop being routed straight away. This cannot be undone.
    </Modal>
  </Stage>
);
