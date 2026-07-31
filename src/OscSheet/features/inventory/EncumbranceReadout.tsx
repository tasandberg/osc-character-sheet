// Encumbrance readout above the load bar: the three movement rates on the LEFT
// (terse, tinted by tier) and the numeric load (X / 1600 cn, muted) pushed to the
// RIGHT edge so it lines up with the cn totals on the section headers below. The
// rates replace the old tier WORD — the load number stays. Hover shows the shared
// MoveTooltip: same rows, same component as the header MOVE stat hover.
import type { EncumbranceVM } from "@domain/vm-types";
import { armorTierLabel, encTierClass, moveRatesLabel } from "@domain/format";
import { cx } from "@ui/cx";
import { MoveRates, MoveTooltip } from "@ui/MovePop";

export function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  const tier = encTierClass(e.tier);
  return (
    <span
      className={cx(
        "osc-enc-readout",
        // fills the header row so justify-end pushes the load to the right edge,
        // lining its cn up with the section headers' totals below. At xs it drops
        // onto its own line under the title, left-aligned.
        "tw:grow tw:shrink tw:basis-auto tw:flex tw:items-baseline tw:justify-end tw:gap-2",
        "tw:font-mono tw:text-2xs tw:tracking-normal tw:text-text-mute",
        "tw:whitespace-nowrap tw:cursor-default",
        "tw:@max-md/app:basis-full tw:@max-md/app:justify-start",
        // tier tint (.enc-t*, unlayered) still overrides the muted colour above
        tier,
      )}
    >
      {/* only the rates trigger the popover (not the Load number). tabIndex makes
          the trigger keyboard-reachable; MoveTooltip anchors to its parent, so it
          must stay a direct child of this span. */}
      <span
        // 2px gap keeps the three scores + tinted slashes reading as one group.
        // The dotted underline hints at the hover breakdown; it's a border, not
        // text-decoration, which doesn't render through an inline-flex.
        className="rates tw:inline-flex tw:items-baseline tw:gap-[2px] tw:border-b tw:border-dotted tw:border-text-faint"
        tabIndex={0}
        aria-label={`Movement: ${moveRatesLabel(e.moveBands)}${e.status ? `. ${e.status}` : ""}`}
      >
        <MoveRates bands={e.moveBands} />
        <MoveTooltip
          bands={e.moveBands}
          tier={e.tier}
          status={e.status}
          armor={e.armorTier ? armorTierLabel(e.armorTier) : undefined}
        />
      </span>
      {/* -mx-1 halves the flex gap flanking the middot so it pulls in */}
      <i className="fa fa-dot u-text-faint tw:-mx-1" />
      {e.label && <span className="load u-text-faint">{e.label}</span>}
    </span>
  );
}
