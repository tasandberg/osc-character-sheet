// Section header (static — title + "N items · X cn", plus an optional control slot).
import type { ReactNode } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { sectionCountLabel } from "@features/inventory/groups";
import { SectionTitle } from "@ui/SectionTitle";

export function SectionCount({
  title,
  items,
  variant,
  cap,
  controls,
}: {
  title: string;
  items: InventoryItemVM[];
  /** Active encumbrance variant — picks the total's unit (slots vs cn). */
  variant?: string;
  /** Show the total against a limit ("5 / 9 slots"). Only for a section whose membership
   *  matches an encumbrance track: Equipped does, All Items doesn't (it holds both). */
  cap?: number;
  controls?: ReactNode;
}) {
  return (
    <div className="osc-inv-sec-head">
      <SectionTitle variant="sub">{title}</SectionTitle>
      {controls}
      <span className="osc-inv-sec-count">
        {sectionCountLabel(items, variant, cap)}
      </span>
    </div>
  );
}
