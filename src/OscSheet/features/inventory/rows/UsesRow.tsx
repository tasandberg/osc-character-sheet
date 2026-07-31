// "Uses" line: small square pips for a stackable item's quantity (OG-OSE tick-off) —
// the shared Vellum <Pips square> (display-only dots). Nested under the name (grid
// col 3) so the flanking cells center across name+uses. Filled = remaining, empty =
// up to max. The WHOLE strip is one button: clicking anywhere on it (or the Use pill)
// consumes one (quantity − 1, floored at 0; no-op/disabled at 0). When the strip
// can't fit, the pips hide (kept measurable) and a "Use" pill takes over.
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
    <div
      // xs swaps this whole pip sub-row for the inline Use pill on the item row.
      className="osc-inv-uses tw:flex tw:items-center tw:gap-2 tw:min-w-0 tw:@max-md/app:hidden"
      data-overflow={overflow || undefined}
    >
      <span className="osc-inv-uses-strip tw:relative tw:flex tw:flex-1 tw:min-w-0 tw:min-h-[10px] tw:items-center">
        {canEdit ? (
          <button
            type="button"
            // No `.osc-inv` ancestor any more: the `all: unset` reset moved into
            // `@layer base`, so these utilities out-rank it on their own.
            className={
              "osc-inv-usebtn tw:flex tw:flex-1 tw:min-w-0 tw:items-center " +
              "tw:p-0 tw:bg-transparent tw:border-none tw:cursor-pointer " +
              "tw:disabled:cursor-default tw:focus-visible:outline-2 " +
              "tw:focus-visible:outline-gold tw:focus-visible:outline-offset-2 " +
              "tw:focus-visible:rounded-sm"
            }
            onClick={() => set(value - 1)}
            disabled={value <= 0}
            aria-label={`Use one ${item.name}`}
          >
            <Pips
              ref={pipsRef}
              className="osc-inv-pips"
              size="sm"
              square
              total={total}
              filled={value}
              aria-hidden="true"
            />
          </button>
        ) : (
          <Pips
            ref={pipsRef}
            className="osc-inv-pips"
            size="sm"
            square
            total={total}
            filled={value}
            role="img"
            aria-label={`Uses: ${value} of ${total}`}
          />
        )}
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
          // `display` stays in _rows.scss (it toggles with [data-overflow] and
          // has to beat the unlayered `.btn` sibling rules).
          <span className="osc-inv-uses-count tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-mute">
            {value}/{total}
          </span>
        )}
      </span>
    </div>
  );
}
