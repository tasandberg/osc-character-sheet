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
  // bg-bg is load-bearing: this head sits inside the sticky block and must be opaque.
  return (
    <div className="osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute">
      <SectionTitle variant="sub">{title}</SectionTitle>
      {controls}
      <span className="tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">
        {sectionCountLabel(items, variant, cap)}
      </span>
    </div>
  );
}
