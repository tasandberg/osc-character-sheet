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
  enabled: true,
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
      <button type="button" className="osc-whead" style={{ display: "flex", width: "100%" }}>
        <span className="key">Wealth</span>
        <span className="v">152 gp</span>
        <span className="wt">140 cn</span>
      </button>
      <div className="osc-inv-sec-head">
        <span className="section-title sub">Equipped items</span>
        <span className="osc-inv-sec-count">4 items · 230 cn</span>
      </div>
      <div className="osc-inv-sec-head">
        <span className="section-title sub">All items</span>
        <span className="osc-inv-sec-count">9 items · 306 cn</span>
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

// Basic encumbrance: no weight axis, so the bar paints solid in the tier colour.
export const BasicVariant = () => {
  const e: EncumbranceVM = { ...vm(2, 0, "Heavily encumbered"), pct: 2 / 3, label: "", bands: [] };
  return (
    <div className="osc-inv" style={{ padding: 16, width: 520 }}>
      <Head e={e} />
    </div>
  );
};
