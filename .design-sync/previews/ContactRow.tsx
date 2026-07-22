import React from "react";

import { ContactRow, Toggle } from "icancall-fresh";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="admin" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 620 }}>
    {children}
  </div>
);

export const CallChain = () => (
  <Wrap>
    <ContactRow
      position={1}
      name="Maria Delgado"
      relationship="Daughter"
      phone="(415) 555-0142"
      color="oklch(0.58 0.115 232)"
      canMoveUp={false}
      onMoveUp={() => {}}
      onMoveDown={() => {}}
      actions={<Toggle on onChange={() => {}} label="Available" />}
    />
    <ContactRow
      position={2}
      name="Joseph Award"
      relationship="Son"
      phone="(415) 555-0188"
      color="oklch(0.62 0.10 198)"
      onMoveUp={() => {}}
      onMoveDown={() => {}}
      actions={<Toggle on onChange={() => {}} label="Available" />}
    />
    <ContactRow
      position={3}
      name="Aunt Rosa"
      relationship="Neighbour"
      phone="(415) 555-0110"
      color="oklch(0.55 0.13 285)"
      dim
      canMoveDown={false}
      onMoveUp={() => {}}
      onMoveDown={() => {}}
      actions={<Toggle on={false} onChange={() => {}} label="Busy" />}
    />
  </Wrap>
);

export const Single = () => (
  <Wrap>
    <ContactRow
      position={1}
      name="Dr Chen"
      relationship="Family doctor"
      phone="(415) 555-0007"
      color="oklch(0.66 0.14 158)"
    />
  </Wrap>
);
