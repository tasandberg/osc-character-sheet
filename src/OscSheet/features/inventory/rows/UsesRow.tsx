// "Uses" line: circular pips for a stackable item's quantity (OG-OSE tick-off) —
// the shared Vellum <Pips> (same disc as the spell cast rows). Nested under the name
// (grid col 3) so the flanking cells center across name+uses. Filled = remaining,
// empty = up to max. Clicking any pip (or the Use pill) consumes one (quantity − 1,
// floored at 0; no-op at 0). When the strip can't fit, the pips hide (kept
// measurable) and a "Use" pill takes over.
import { useLayoutEffect, useRef, useState } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { Pips } from "@ui/Pips";
import { Button } from "@ui/Button";

export function UsesRow({
  item,
  canEdit,
  onSetQty,
}: {
  item: InventoryItemVM;
  canEdit: boolean;
  onSetQty: (id: string, value: number) => void;
}) {
  const q = item.quantity;
  const pipsRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);
  const total = q ? Math.max(q.max, q.value) : 0;

  useLayoutEffect(() => {
    const el = pipsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // Pips fill the strip (flex:1); they overflow when their content is wider than
    // the grid gives them → swap to the Use button. Mirrors HeaderBand's useFitText.
    const measure = () => setOverflow(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [total]);

  if (!q) return null;
  const value = q.value;
  const set = (next: number) => canEdit && onSetQty(item.id, Math.max(0, next));

  return (
    <div className="osc-inv-uses" data-overflow={overflow || undefined}>
      <span className="osc-inv-uses-strip">
        <Pips
          ref={pipsRef}
          className="osc-inv-pips"
          size="sm"
          total={total}
          filled={value}
          role="group"
          aria-label={`Uses: ${value} of ${total}`}
          onPipClick={canEdit ? () => set(value - 1) : undefined}
          pipLabel={canEdit ? () => `Use one ${item.name}` : undefined}
          pipDisabled={value <= 0}
        />
        {canEdit ? (
          <Button
            variant="outline"
            tone="brass"
            size="xs"
            className="osc-inv-use1"
            onClick={() => set(value - 1)}
            disabled={value <= 0}
            aria-label={`Use one ${item.name}`}
          >
            Use
          </Button>
        ) : (
          <span className="osc-inv-uses-count">
            {value}/{total}
          </span>
        )}
      </span>
    </div>
  );
}
