// Treasure section for the Inventory tab — coins and non-coin valuables (gems,
// jewellery) are real Foundry items, surfaced here in ONE table rather than
// abstracted away: rows reuse the item-row image/name/handle and the shared
// sortable column headers, the name opens the item sheet, and a right-click gives
// the item context menu.
import { useEffect, useState } from "react";
import type { CoinWealthRow, SortDir, WealthSortKey, WealthRow as WealthRowVM } from "@domain/vm-types";
import { sortWealth } from "@features/inventory/inventory";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { WealthRow } from "@features/inventory/WealthRow";
import { fmtCoin } from "@features/inventory/fmtCoin";
import { SortHeader } from "@features/inventory/SortHeader";
import type { OnContext } from "@features/inventory/types";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";

/** Treasure section: a header bar (overlapping coin dots + gem · total gp · carried
 *  weight) that toggles ONE table of wealth rows — coins and non-coin valuables in
 *  a single dataset, sharing the same grid, columns, and row component (only the
 *  qty cell differs: an editable input for coins, a static number for valuables).
 *  A column-header click sorts ALL rows together (coins and valuables interleaved
 *  by that field); manual order is selectWealth's order (or a dragged baseline).
 *  The total folds every row into one gp figure. Coins are 1 cn each, so qty edits
 *  feed the encumbrance figure too. */
export function WealthSection({
  wealth,
  onSetCoin,
  onOpen,
  onContext,
}: {
  /** Unified row list: coins (canonical order) then non-coin valuables. */
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
  // Manual order as row ids (survives qty edits); [] = selectWealth's own order.
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: WealthSortKey; dir: SortDir }>({ key: "manual", dir: "asc" });
  // In-progress coin qty edits (live totals) committed to the actor on blur/Enter.
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Draft-aware live coin qty (empty/NaN → 0). Valuables carry a static qty.
  const draftQty = (c: CoinWealthRow) => {
    const d = draft[c.denom];
    const n = d != null ? parseInt(d, 10) : c.qty;
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  };

  // Manual order: saved drag order (still-present ids) then any new rows in
  // selectWealth's canonical order — keeps the order stable across qty edits.
  const byId = new Map(wealth.map((r) => [r.id, r] as const));
  const ordered = [
    ...manualOrder.filter((id) => byId.has(id)),
    ...wealth.map((r) => r.id).filter((id) => !manualOrder.includes(id)),
  ].map((id) => byId.get(id)!);

  // The whole list sorted together (coins + valuables interleaved); manual keeps
  // the order above. Sort reads each row's committed figures, so it doesn't churn
  // while a coin qty is mid-edit.
  const rows = sortWealth(ordered, sort.key, sort.dir);

  const dnd = useDragReorder({
    enabled: canEdit,
    onReorder: ({ from, to }) => {
      // Bake the current (possibly sorted) order, then drop to manual so the drag shows.
      const next = [...rows];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      setManualOrder(next.map((r) => r.id));
      setSort({ key: "manual", dir: "asc" });
    },
  });

  // Commit on blur/Enter, but KEEP the draft so the input keeps showing the typed
  // value through the async actor round-trip (clearing it here would flash the
  // stale prop). The effect below drops the draft once the actor value catches up.
  const commit = (c: CoinWealthRow) => onSetCoin(c.id, draftQty(c));

  useEffect(() => {
    setDraft((d) => {
      let next = d;
      for (const r of wealth) {
        if (r.kind !== "coin") continue;
        const dv = next[r.denom];
        if (dv != null && parseInt(dv, 10) === r.qty) {
          if (next === d) next = { ...d };
          delete next[r.denom];
        }
      }
      return next;
    });
  }, [wealth]);

  const onSort = (key: WealthSortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  // Live (draft-aware) figures for the section total, order-independent.
  const liveWeight = (r: WealthRowVM) => (r.kind === "coin" ? draftQty(r) : r.weight);
  const liveValue = (r: WealthRowVM) => (r.kind === "coin" ? draftQty(r) * r.gpEach : r.value);
  const totalGp = wealth.reduce((s, r) => s + liveValue(r), 0);
  const weight = wealth.reduce((s, r) => s + liveWeight(r), 0);
  const dots = wealth
    .filter((r): r is CoinWealthRow => r.kind === "coin" && draftQty(r) > 0)
    .map((r) => r.denom);
  const hasValuables = wealth.some((r) => r.kind === "treasure");
  const hasContent = wealth.length > 0;

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
          {/* One unified, fully-sortable table: units live in the headers so rows
              render bare numbers; a header click sorts every row together. */}
          <div className="osc-coin-colhead" role="row">
            <span aria-hidden="true" /> {/* drag */}
            <SortHeader
              label="Item"
              className="osc-inv-th-item"
              active={sort.key === "item"}
              dir={sort.dir}
              onClick={() => onSort("item")}
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

          {rows.map((row, i) =>
            row.kind === "coin" ? (
              <WealthRow
                key={row.id}
                row={{ ...row, qty: draftQty(row), weight: draftQty(row), value: draftQty(row) * row.gpEach }}
                index={i}
                canEdit={canEdit}
                dnd={dnd}
                inputValue={draft[row.denom] ?? String(row.qty)}
                onOpen={onOpen}
                onContext={onContext}
                onQtyChange={(v) => setDraft((d) => ({ ...d, [row.denom]: v }))}
                onQtyCommit={() => commit(row)}
                onQtyCommitClose={() => { commit(row); setOpen(false); }}
              />
            ) : (
              <WealthRow
                key={row.id}
                row={row}
                index={i}
                canEdit={canEdit}
                dnd={dnd}
                onOpen={onOpen}
                onContext={onContext}
              />
            ),
          )}

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
