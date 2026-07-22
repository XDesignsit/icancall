import React, { useState } from "react";

import { AddonRow, QuantityStepper } from "icancall-fresh";

const phone = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4h4l1.5 4-2 1.4a11 11 0 0 0 5 5l1.4-2 4 1.5v4a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </svg>
);

const clock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

export const Billing = () => {
  const [numbers, setNumbers] = useState(1);
  const [blocks, setBlocks] = useState(2);
  return (
    <div className="admin" style={{ maxWidth: 640 }}>
      <AddonRow
        icon={phone}
        name="Additional phone number"
        price="$6.99 / mo each"
        description="Another dedicated iCanCall number for another loved one, each with its own contacts and routing."
        control={<QuantityStepper value={numbers} onChange={setNumbers} min={0} max={5} />}
        subtotal={`$${(numbers * 6.99).toFixed(2)}/mo`}
      />
      <AddonRow
        icon={clock}
        name="Extra voice minutes"
        price="$4.99 per 100 min"
        description="Unused minutes roll over for one cycle on the Pro and Care Team plans."
        control={<QuantityStepper value={blocks} onChange={setBlocks} min={0} max={10} />}
        subtotal={`$${(blocks * 4.99).toFixed(2)}/mo`}
      />
    </div>
  );
};

export const IncludedFree = () => (
  <div className="admin" style={{ maxWidth: 640 }}>
    <AddonRow
      icon={phone}
      name="Additional phone number"
      price="Included in your plan"
      description="Your Pro plan covers a second number at no extra cost."
      control={<QuantityStepper value={1} onChange={() => {}} min={0} max={2} />}
      subtotal="Free"
    />
  </div>
);
