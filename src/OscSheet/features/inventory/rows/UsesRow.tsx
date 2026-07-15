// "Uses" sub-row: box pips for a stackable item's quantity (OG-OSE tick-off).
// Filled = remaining, empty = up to max. Click a pip to set that many; click the
// last filled to tick one off. When the strip can't fit the row, the pips hide
// (kept measurable) and a "Use" pill takes over.
import { useLayoutEffect, useRef, useState } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { cx } from "@ui/cx";

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
    // the grid gives them → swap to the Use-1 button. Mirrors HeaderBand's useFitText.
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
      <div className="osc-inv-uses-c">
        <span className="osc-inv-uses-label">Uses</span>
        <span className="osc-inv-uses-strip">
          <span
            className="osc-inv-pips"
            ref={pipsRef}
            role="group"
            aria-label={`${item.name} uses: ${value} of ${total}`}
          >
            {Array.from({ length: total }).map((_, i) => {
              const n = i + 1;
              const filled = i < value;
              // Clicking the last filled pip ticks it OFF (→ n-1); any other pip sets
              // the count to that pip. So every value, including 0, is reachable.
              const to = n === value ? value - 1 : n;
              return canEdit ? (
                <button
                  key={i}
                  type="button"
                  className={cx("osc-inv-pip", filled && "filled")}
                  aria-label={`Set ${item.name} to ${to}`}
                  aria-pressed={filled}
                  onClick={() => set(to)}
                />
              ) : (
                <span
                  key={i}
                  className={cx("osc-inv-pip", filled && "filled")}
                  aria-hidden="true"
                />
              );
            })}
          </span>
          {canEdit ? (
            <button
              type="button"
              className="osc-inv-use1"
              onClick={() => set(value - 1)}
              disabled={value <= 0}
            >
              Use
            </button>
          ) : (
            <span className="osc-inv-uses-count">
              {value}/{total}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
