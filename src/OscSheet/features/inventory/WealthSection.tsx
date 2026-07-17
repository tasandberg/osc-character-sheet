// Treasure section for the Inventory tab — coins and non-coin valuables (gems,
// jewellery) are real Foundry items, surfaced here in ONE table rather than
// abstracted away: rows reuse the item-row image/name/handle and the shared
// sortable column headers, the name opens the item sheet, and a right-click gives
// the item context menu.
import { useEffect, useState } from "react";
import type { CoinWealthRow, SortDir, WealthRow as WealthRowVM } from "@domain/vm-types";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { WealthRow } from "@features/inventory/WealthRow";
import { fmtCoin } from "@features/inventory/fmtCoin";
import { SortHeader } from "@features/inventory/SortHeader";
import type { OnContext } from "@features/inventory/types";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";

type CoinSortKey = "manual" | "coin" | "qty" | "weight" | "value";

/** Treasure section: a header bar (overlapping coin dots + gem · total gp · carried
 *  weight) that toggles ONE table of wealth rows — coins (per-denomination qty is
 *  editable, drag-reorderable) then read-only valuables — sharing the same grid,
 *  columns, and row component. The section total folds coins + valuables into one
 *  gp figure. Columns are sortable (coins only) and coin rows drag-reorderable (a
 *  drag bakes the current order as the manual baseline). Coins are 1 cn each, so
 *  qty edits feed the encumbrance figure too. */
export function WealthSection({
  wealth,
  onSetCoin,
  onOpen,
  onContext,
}: {
  /** Unified row list: coins first (canonical order) then non-coin valuables. */
  wealth: WealthRowVM[];
  onSetCoin: (id: string, value: number) => void;
  /** Click a coin/valuable name → open its item sheet (like an item row). */
  onOpen: (id: string) => void;
  /** Right-click a row → the shared item context menu (View / Delete). */
  onContext: OnContext;
}) {
  // Read-only sheets (non-owners): coin qty is view-only, no drag-reorder.
  const { canEdit } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: CoinSortKey; dir: SortDir }>({ key: "manual", dir: "asc" });
  // In-progress qty edits (live totals) committed to the actor on blur/Enter.
  const [draft, setDraft] = useState<Record<string, string>>({});

  const coins = wealth.filter((w): w is CoinWealthRow => w.kind === "coin");
  const valuables = wealth.filter((w) => w.kind === "treasure");

  // Manual order: saved drag order (still-present denoms) then any new ones in
  // selectWealth's canonical pp→cp order — keeps the order stable across qty edits.
  const byDenom = new Map(coins.map((c) => [c.denom, c] as const));
  const present = coins.map((c) => c.denom);
  const manual = [
    ...order.filter((d) => present.includes(d)),
    ...present.filter((d) => !order.includes(d)),
  ]
    .map((d) => byDenom.get(d))
    .filter((c): c is CoinWealthRow => !!c);

  const qtyOf = (c: CoinWealthRow) => {
    const d = draft[c.denom];
    const n = d != null ? parseInt(d, 10) : c.qty;
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };

  // Sorted view: manual = the drag order; a column sort orders a copy by that key.
  const coinRows = sort.key === "manual"
    ? manual
    : [...manual].sort((a, b) => {
        const cmp = sort.key === "coin"
          ? a.name.localeCompare(b.name)
          : sort.key === "value"
            ? qtyOf(a) * a.gpEach - qtyOf(b) * b.gpEach
            : qtyOf(a) - qtyOf(b); // qty or weight (1 cn each)
        return sort.dir === "asc" ? cmp : -cmp;
      });

  const dnd = useDragReorder({
    enabled: canEdit,
    onReorder: ({ from, to }) => {
      // Bake the current (possibly sorted) order, then drop to manual so the drag shows.
      const next = [...coinRows];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      setOrder(next.map((c) => c.denom));
      setSort({ key: "manual", dir: "asc" });
    },
  });

  // Commit on blur/Enter, but KEEP the draft so the input keeps showing the typed
  // value through the async actor round-trip (clearing it here would flash the
  // stale prop). The effect below drops the draft once the actor value catches up.
  const commit = (c: CoinWealthRow) => onSetCoin(c.id, qtyOf(c));

  useEffect(() => {
    setDraft((d) => {
      let next = d;
      for (const c of coins) {
        const dv = next[c.denom];
        if (dv != null && parseInt(dv, 10) === c.qty) {
          if (next === d) next = { ...d };
          delete next[c.denom];
        }
      }
      return next;
    });
  }, [wealth]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSort = (key: CoinSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  // Section total folds coins + valuables into one gp figure (and cn weight).
  const valuablesGp = valuables.reduce((s, t) => s + t.value, 0);
  const valuablesCn = valuables.reduce((s, t) => s + t.weight, 0);
  const totalGp = coinRows.reduce((s, c) => s + qtyOf(c) * c.gpEach, 0) + valuablesGp;
  const weight = coinRows.reduce((s, c) => s + qtyOf(c), 0) + valuablesCn;
  const dots = coinRows.filter((c) => qtyOf(c) > 0).map((c) => c.denom);
  const hasCoins = coinRows.length > 0;
  const hasValuables = valuables.length > 0;
  const hasContent = hasCoins || hasValuables;

  // One display list: coins (unresolved — the input needs the committed qty) then
  // valuables. Coins stay contiguous at the front, so a coin's list index IS its
  // coin index for drag reorder.
  const rows: WealthRowVM[] = [...coinRows, ...valuables];

  return (
    <section className="osc-wsec">
      <button
        type="button"
        className={cx("osc-whead", open && "open")}
        data-testid="wealth-toggle"
        aria-expanded={open}
        disabled={!hasContent}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="coins" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={`ci ${d.toLowerCase()}`} />
          ))}
          {!dots.length && !hasValuables && <span className="ci gp" />}
          {hasValuables && (
            <i className="osc-wgem fa-solid fa-gem" aria-hidden="true" />
          )}
        </span>
        <span className="key">Treasure</span>
        <span className="v">{fmtCoin(totalGp)}<small>gp</small></span>
        {hasContent && <i className="osc-wcaret fa-solid fa-caret-right" aria-hidden="true" />}
        <span className="wt">{fmtCoin(weight)} cn</span>
      </button>

      {!hasContent && (
        <p className="osc-wsec-empty">Drop coins, gems, or other valuables here to track your treasure.</p>
      )}

      {open && hasContent && (
        <div className="osc-cointab">
          {/* One unified table: units live in the headers so rows render bare
              numbers. Coin rows then valuable rows, no group dividers. Only the
              coin columns are sortable — a header click bakes the coin order. */}
          <div className="osc-coin-colhead" role="row">
            <span aria-hidden="true" /> {/* drag */}
            <SortHeader
              label="Item"
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
              label="Weight (cn)"
              className="osc-coin-th-num"
              active={sort.key === "weight"}
              dir={sort.dir}
              onClick={() => onSort("weight")}
            />
            <SortHeader
              label="Value (gp)"
              className="osc-coin-th-num"
              active={sort.key === "value"}
              dir={sort.dir}
              onClick={() => onSort("value")}
            />
          </div>

          {rows.map((row, i) => {
            if (row.kind === "coin") {
              const q = qtyOf(row);
              return (
                <WealthRow
                  key={row.id}
                  row={{ ...row, qty: q, weight: q, value: q * row.gpEach }}
                  coinIndex={i}
                  canEdit={canEdit}
                  dnd={dnd}
                  inputValue={draft[row.denom] ?? String(row.qty)}
                  onOpen={onOpen}
                  onContext={onContext}
                  onQtyChange={(v) => setDraft((d) => ({ ...d, [row.denom]: v }))}
                  onQtyCommit={() => commit(row)}
                  onQtyCommitClose={() => { commit(row); setOpen(false); }}
                />
              );
            }
            return (
              <WealthRow
                key={row.id}
                row={row}
                coinIndex={-1}
                canEdit={canEdit}
                dnd={dnd}
                onOpen={onOpen}
                onContext={onContext}
              />
            );
          })}

          <div className="osc-coin-total">
            <span className="lab">Total</span>
            <span className="tw">{fmtCoin(weight)}</span>
            <span className="tv">{fmtCoin(totalGp)}</span>
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
