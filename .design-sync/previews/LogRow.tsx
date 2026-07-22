import React from "react";

import { LogRow } from "icancall-fresh";

const inbound = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);

const voicemail = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="7" cy="13" r="3.5" /><circle cx="17" cy="13" r="3.5" /><path d="M7 16.5h10" />
  </svg>
);

export const CallLog = () => (
  <div className="admin" style={{ maxWidth: 720 }}>
    <LogRow
      direction="in"
      icon={inbound}
      caller="Maria Delgado"
      callerMeta="(415) 555-0142"
      routedTo="Joseph Award"
      routedMeta="2nd in chain"
      duration="4m 12s"
      when="Today, 9:41"
    />
    <LogRow
      direction="miss"
      icon={inbound}
      caller="Unknown caller"
      callerMeta="(868) 555-0199"
      routedTo="Nobody answered"
      routedMeta="3 attempts"
      duration="—"
      when="Today, 8:02"
    />
    <LogRow
      direction="vm"
      icon={voicemail}
      caller="Dr Chen"
      callerMeta="(415) 555-0007"
      routedTo="Voicemail"
      routedMeta="transcribed"
      duration="0m 38s"
      when="Yesterday, 17:20"
    />
  </div>
);
