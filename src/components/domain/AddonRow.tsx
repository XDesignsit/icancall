import React from "react";
import { cx } from "../ui/cx";

interface AddonRowProps {
  /** SVG mark for the `.aic` tile. */
  icon?: React.ReactNode;
  name: React.ReactNode;
  /** Unit price line beside the name, e.g. "$4.99 / mo". */
  price?: React.ReactNode;
  description?: React.ReactNode;
  /** Quantity control — typically a QuantityStepper. */
  control?: React.ReactNode;
  /**
   * Running subtotal under the control. Show a free-of-charge note here when
   * the plan's included quota already covers the selection.
   */
  subtotal?: React.ReactNode;
  className?: string;
}

/** One purchasable add-on in the billing panel (`.addon`). */
export default function AddonRow({
  icon,
  name,
  price,
  description,
  control,
  subtotal,
  className,
}: AddonRowProps) {
  return (
    <div className={cx("addon", className)}>
      {icon && <div className="aic">{icon}</div>}
      <div className="abody">
        <div className="atop">
          <b>{name}</b>
          {price && <span className="price">{price}</span>}
        </div>
        {description && <p>{description}</p>}
      </div>
      <div className="actl">
        {control}
        {subtotal && <span className="sub">{subtotal}</span>}
      </div>
    </div>
  );
}
