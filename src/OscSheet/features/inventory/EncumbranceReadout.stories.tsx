// The inventory header's encumbrance line + load bar, one row per tier — the
// InventoryView story can't render (it needs the sheet context), so this is where
// the tier colours and the bar's threshold cuts are checked visually.
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
  // rates at each tier: base 120 → ×0.75 / ×0.5 / ×0.25 / 0
  moveBands: (() => {
    const base = [120, 90, 60, 30, 0][tier];
    return { encounter: base / 3, explore: base, travel: base / 5 };
  })(),
  bands: STEPS,
});

const ROWS: EncumbranceVM[] = [
  vm(0, 300, "Unencumbered"),
  vm(1, 500, "Lightly encumbered"),
  vm(2, 700, "Heavily encumbered"),
  vm(3, 1200, "Severely encumbered"),
  vm(4, 1600, "Overloaded"),
];

export const Tiers = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16, minWidth: 520 }}>
    {ROWS.map((e) => (
      <div
        key={e.tier}
        className="osc-inv-head enc-rule"
        style={
          {
            "--enc-pct": `${Math.round(e.pct * 100)}%`,
            "--enc-stops": encBarStops(e),
          } as React.CSSProperties
        }
      >
        <SectionTitle>Inventory</SectionTitle>
        <EncumbranceReadout e={e} />
      </div>
    ))}
  </div>
);

/** Basic encumbrance: no weight axis, so the bar paints solid in the tier colour. */
export const BasicVariant = () => {
  const e: EncumbranceVM = { ...vm(2, 0, "Heavily encumbered"), pct: 2 / 3, label: "", bands: [] };
  return (
    <div style={{ padding: 16, minWidth: 520 }}>
      <div
        className="osc-inv-head enc-rule"
        style={
          {
            "--enc-pct": `${Math.round(e.pct * 100)}%`,
            "--enc-stops": encBarStops(e),
          } as React.CSSProperties
        }
      >
        <SectionTitle>Inventory</SectionTitle>
        <EncumbranceReadout e={e} />
      </div>
    </div>
  );
};
