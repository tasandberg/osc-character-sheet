// Wealth section for the Inventory tab — coins are real Foundry items, surfaced
// here rather than abstracted away: rows reuse the item-row image/name/handle and
// the shared sortable column headers, the name opens the item sheet, and a
// right-click gives the item context menu.
import { useEffect, useState } from "react";
import type { CoinVM, SortDir } from "@domain/vm-types";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { ItemImage } from "@features/inventory/ItemImage";
import { SortHeader } from "@features/inventory/SortHeader";
import type { OnContext } from "@features/inventory/types";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";

type CoinSortKey = "manual" | "coin" | "qty" | "weight" | "value";

/** Coin/gp number: integers get thousands separators, fractions trim to ≤2 dp. */
function fmtCoin(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : (+n.toFixed(2)).toString();
}

/** Wealth section: a header bar (overlapping coin dots · total gp · carried weight)
 *  that toggles a coin table — per-denomination qty (editable), weight, and gp
 *  value, with a totals row. Columns are sortable and rows are drag-reorderable
 *  (a drag bakes the current order as the manual baseline). Weight is qty × the
 *  item's own cn, matching what OSE encumbers by (0-weight coin items weigh 0). */
export function WealthSection({
  coins,
  onSetCoin,
  onOpen,
  onContext,
}: {
  coins: CoinVM[];
  onSetCoin: (id: string, value: number) => void;
  /** Click a coin name → open its item sheet (like an item row). */
  onOpen: (id: string) => void;
  /** Right-click a coin row → the shared item context menu (View / Delete). */
  onContext: OnContext;
}) {
  // Read-only sheets (non-owners): coin qty is view-only, no drag-reorder.
  const { canEdit } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: CoinSortKey; dir: SortDir }>({ key: "manual", dir: "asc" });
  // In-progress qty edits (live totals) committed to the actor on blur/Enter.
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Manual order: saved drag order (still-present denoms) then any new ones in
  // selectCoins' canonical pp→cp order — keeps the order stable across qty edits.
  const byDenom = new Map(coins.map((c) => [c.denom, c] as const));
  const present = coins.map((c) => c.denom);
  const manual = [
    ...order.filter((d) => present.includes(d)),
    ...present.filter((d) => !order.includes(d)),
  ]
    .map((d) => byDenom.get(d))
    .filter((c): c is CoinVM => !!c);

  const qtyOf = (c: CoinVM) => {
    const d = draft[c.denom];
    const n = d != null ? parseInt(d, 10) : c.value;
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };

  const cnOf = (c: CoinVM) => qtyOf(c) * c.cnEach;

  // Sorted view: manual = the drag order; a column sort orders a copy by that key.
  const rows = sort.key === "manual"
    ? manual
    : [...manual].sort((a, b) => {
        const cmp = sort.key === "coin"
          ? a.name.localeCompare(b.name)
          : sort.key === "value"
            ? qtyOf(a) * a.gpEach - qtyOf(b) * b.gpEach
            : sort.key === "weight"
              ? cnOf(a) - cnOf(b)
              : qtyOf(a) - qtyOf(b);
        return sort.dir === "asc" ? cmp : -cmp;
      });

  const dnd = useDragReorder({
    enabled: canEdit,
    onReorder: ({ from, to }) => {
      // Bake the current (possibly sorted) order, then drop to manual so the drag shows.
      const next = [...rows];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      setOrder(next.map((c) => c.denom));
      setSort({ key: "manual", dir: "asc" });
    },
  });

  // Commit on blur/Enter, but KEEP the draft so the input keeps showing the typed
  // value through the async actor round-trip (clearing it here would flash the
  // stale prop). The effect below drops the draft once the actor value catches up.
  const commit = (c: CoinVM) => onSetCoin(c.id, qtyOf(c));

  useEffect(() => {
    setDraft((d) => {
      let next = d;
      for (const c of coins) {
        const dv = next[c.denom];
        if (dv != null && parseInt(dv, 10) === c.value) {
          if (next === d) next = { ...d };
          delete next[c.denom];
        }
      }
      return next;
    });
  }, [coins]);

  const onSort = (key: CoinSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const totalGp = rows.reduce((s, c) => s + qtyOf(c) * c.gpEach, 0);
  const weight = rows.reduce((s, c) => s + cnOf(c), 0);
  const dots = rows.filter((c) => qtyOf(c) > 0).map((c) => c.denom);
  const hasCoins = rows.length > 0;

  return (
    <section className="osc-wsec">
      <button
        type="button"
        className={cx("osc-whead", open && "open")}
        data-testid="wealth-toggle"
        aria-expanded={open}
        disabled={!hasCoins}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="coins" aria-hidden="true">
          {(dots.length ? dots : ["GP"]).map((d) => (
            <span key={d} className={`ci ${d.toLowerCase()}`} />
          ))}
        </span>
        <span className="key">Wealth</span>
        <span className="v">{fmtCoin(totalGp)}<small>gp</small></span>
        {hasCoins && <i className="osc-wcaret fa-solid fa-caret-right" aria-hidden="true" />}
        <span className="wt">{fmtCoin(weight)} cn</span>
      </button>

      {!hasCoins && (
        <p className="osc-wsec-empty">Drop coin items here to track your wealth.</p>
      )}

      {open && hasCoins && (
        <div className="osc-cointab">
          <div className="osc-coin-colhead" role="row">
            <span aria-hidden="true" /> {/* drag */}
            <SortHeader
              label="Coin"
              className="osc-inv-th-item"
              active={sort.key === "coin"}
              dir={sort.dir}
              onClick={() => onSort("coin")}
            />
            <SortHeader
              label="Qty"
              className="osc-coin-th-num"
              active={sort.key === "qty"}
              dir={sort.dir}
              onClick={() => onSort("qty")}
            />
            <SortHeader
              label="Weight"
              className="osc-coin-th-num"
              active={sort.key === "weight"}
              dir={sort.dir}
              onClick={() => onSort("weight")}
            />
            <SortHeader
              label="Value"
              className="osc-coin-th-num"
              active={sort.key === "value"}
              dir={sort.dir}
              onClick={() => onSort("value")}
            />
          </div>
          {rows.map((c, i) => {
            const rp = dnd.rowProps("coin", i);
            return (
              <div
                key={c.id}
                className={cx("osc-coin-row", dnd.rowClass("coin", i))}
                onDragOver={rp.onDragOver}
                onDrop={rp.onDrop}
                onDragEnd={rp.onDragEnd}
                // coins are real items: right-click → View / Delete (no equip/consume)
                onContextMenu={(e) =>
                  onContext(e, { id: c.id, name: c.name, equipped: null, quantity: null })
                }
              >
                <span
                  className="osc-inv-drag"
                  title="Drag to reorder"
                  draggable={canEdit}
                  onDragStart={rp.onDragStart}
                  onDragEnd={rp.onDragEnd}
                >
                  <i className="fa-solid fa-grip-lines" aria-hidden="true" />
                </span>
                <ItemImage img={c.img} monogram={c.denom} />
                <div className="osc-inv-name-c">
                  <div className="osc-inv-name-row">
                    <button type="button" className="osc-inv-name" onClick={() => onOpen(c.id)}>
                      <span className="nm">{c.name}</span>
                    </button>
                  </div>
                </div>
                <input
                  className="osc-coin-qty"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  draggable={false}
                  data-testid={`coin-qty-${c.denom.toLowerCase()}`}
                  value={draft[c.denom] ?? String(c.value)}
                  aria-label={`${c.name} quantity`}
                  // Read-only sheets: coin qty is view-only.
                  readOnly={!canEdit}
                  disabled={!canEdit}
                  onChange={(e) => setDraft((d) => ({ ...d, [c.denom]: e.target.value }))}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => { if (e.key === "Enter") { commit(c); setOpen(false); } }}
                  onBlur={() => commit(c)}
                />
                <span className="osc-coin-wt">{fmtCoin(cnOf(c))} cn</span>
                <span className="osc-coin-val">{fmtCoin(qtyOf(c) * c.gpEach)} gp</span>
              </div>
            );
          })}
          <div className="osc-coin-total">
            <span className="lab">Total</span>
            <span className="tw">{fmtCoin(weight)} cn</span>
            <span className="tv">{fmtCoin(totalGp)} gp</span>
          </div>
          <div className="osc-coin-done">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
