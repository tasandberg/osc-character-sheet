// The inventory header's encumbrance line + load bar — the InventoryView story can't
// render (it needs the sheet context), so this is where the tier colours, threshold
// cuts, cn right-alignment, and popover are checked.
import type { EncumbranceVM } from "@domain/vm-types";
import { EncumbranceReadout } from "@features/inventory/EncumbranceReadout";
import { encBarStops } from "@features/inventory/inventory";
import { SectionTitle } from "@ui/SectionTitle";

export default { title: "Inventory / EncumbranceReadout" };

// Detailed variant: OSE cuts at 25% / 37.5% / 50% of max.
const STEPS = [25, 37.5, 50];

const vm = (tier: EncumbranceVM["tier"], value: number, status: string): EncumbranceVM => ({
  enabled: true, variant: "basic",
  value,
  max: 1600,
  pct: Math.min(1, value / 1600),
  tier,
  status,
  label: `${value} / 1600 cn`,
  // rates at each tier: base 120 -> x0.75 / x0.5 / x0.25 / 0
  moveBands: (() => {
    const base = [120, 90, 60, 30, 0][tier];
    return { encounter: base / 3, explore: base, travel: base / 5 };
  })(),
  bands: STEPS,
});

function Head({ e }: { e: EncumbranceVM }) {
  return (
    <div
      className="osc-inv-head enc-rule"
      style={
        { "--enc-pct": `${Math.round(e.pct * 100)}%`, "--enc-stops": encBarStops(e) } as React.CSSProperties
      }
    >
      <SectionTitle>Inventory</SectionTitle>
      <EncumbranceReadout e={e} />
    </div>
  );
}

const ROWS: EncumbranceVM[] = [
  vm(0, 300, "Unencumbered"),
  vm(1, 500, "Lightly encumbered"),
  vm(2, 700, "Heavily encumbered"),
  vm(3, 1200, "Severely encumbered"),
  vm(4, 1600, "Overloaded"),
];

export const Tiers = () => (
  <div className="osc-inv" style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16, width: 520 }}>
    {ROWS.map((e) => (
      <Head key={e.tier} e={e} />
    ))}
  </div>
);

// Full stack: bar + rates-left/load-right, then section headers — to check the load's
// cn lines up with the Equipped / All-Items / Wealth cn totals below.
export const FullHeader = () => {
  const e = vm(2, 690, "Heavily encumbered");
  return (
    <div className="osc-inv" style={{ padding: 16, width: 480 }}>
      <Head e={e} />
      {/* whead utilities mirror WealthSection.tsx — that component owns the real markup */}
      <button
        type="button"
        className="osc-whead tw:flex tw:w-full tw:items-center tw:gap-3 tw:px-[2px] tw:pt-[7px] tw:pb-[9px] tw:text-left"
      >
        <span className="key tw:font-sans tw:text-xs tw:font-semibold tw:tracking-[0.13em] tw:uppercase tw:text-text-mute">
          Wealth
        </span>
        <span className="v tw:font-display tw:text-lg tw:leading-flush tw:text-accent-alt">152 gp</span>
        <span className="wt tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-2xs tw:text-text-faint">
          140 cn
        </span>
      </button>
      {/* head/count utilities mirror SectionCount.tsx — that component owns the real markup */}
      <div className="osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute">
        <span className="section-title sub">Equipped items</span>
        <span className="osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">4 items · 230 cn</span>
      </div>
      <div className="osc-inv-sec-head tw:flex tw:w-full tw:items-center tw:gap-2 tw:pt-1 tw:pb-2 tw:bg-bg tw:text-text-mute">
        <span className="section-title sub">All items</span>
        <span className="osc-inv-sec-count tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">9 items · 306 cn</span>
      </div>
    </div>
  );
};

// The MOVE/enc popover is position:fixed, so it must render in full even when an
// ancestor scrolls/clips (mirrors the capped character rail). Hover the line — the
// popover should spill OUTSIDE this overflow:hidden box, not be cut off at its edge.
export const ClippedAncestor = () => {
  const e = vm(2, 690, "Heavily encumbered");
  return (
    <div style={{ padding: 40 }}>
      <div style={{ width: 260, height: 60, overflow: "hidden", outline: "1px dashed #a55", padding: 8 }}>
        <div className="osc-inv" style={{ width: "100%" }}>
          <Head e={e} />
        </div>
      </div>
    </div>
  );
};

// Basic encumbrance: the bar gauges carried TREASURE against the 1600 cap — green below
// the significant-treasure line (50%), yellow above, solid red once immobile at the cap.
const basicVm = (tier: EncumbranceVM["tier"], value: number, status: string): EncumbranceVM => {
  const immobile = value >= 1600;
  return {
    ...vm(tier, value, status),
    pct: Math.min(1, value / 1600),
    label: `${value} / 1600 cn`,
    bands: immobile ? [] : [50],
    barTier: immobile ? 3 : tier,
  };
};

export const BasicVariant = () => (
  <div className="osc-inv" style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16, width: 520 }}>
    {[
      basicVm(0, 0, "Unencumbered"),
      basicVm(0, 400, "Unencumbered"),
      basicVm(1, 800, "Lightly encumbered"),
      basicVm(1, 1200, "Lightly encumbered"),
      basicVm(4, 1600, "Overloaded"),
    ].map((e) => (
      <Head key={e.value} e={e} />
    ))}
  </div>
);
