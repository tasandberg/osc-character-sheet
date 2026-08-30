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
import type { ItemDragData, OnContext } from "@features/inventory/types";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";

/** One coin dot in the header stack. The negative margin overlaps the previous
 *  dot; _wealth.scss adds the bg-coloured ring that makes the overlap read as a
 *  pile, and the per-denomination fill. */
const DOT = "tw:inline-block tw:size-[11px] tw:flex-none tw:rounded-full tw:-ml-[4px] tw:first:ml-0";

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
  variant,
  onSetCoin,
  itemDragData,
  onOpen,
  onContext,
}: {
  /** Unified row list: coins (canonical order) then non-coin valuables. */
  wealth: WealthRowVM[];
  /** Active encumbrance variant — item-based buckets coins/gems per section, not per row. */
  variant?: string;
  onSetCoin: (id: string, value: number) => void;
  /** Foundry item drag-data per row id — lets treasure rows drop onto the hotbar / Item Piles. */
  itemDragData: ItemDragData;
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
  const itemBased = variant === "itembased";
  // Draft-aware qty: only coins are editable, so only they can be mid-edit.
  const liveQty = (r: WealthRowVM) => (r.kind === "coin" ? draftQty(r) : r.qty);
  // Item-based encumbrance buckets coins and gems globally — 100 to one slot, ceiled once
  // over the lot, so they have no per-row figure. Every OTHER valuable is an ordinary item
  // and takes its own slots, which is why the section total is a sum of the two rules.
  const rowSlots = (r: WealthRowVM) =>
    r.coinsOrGems
      ? 0
      : r.kind === "coin"
        ? Math.ceil(liveQty(r) * r.itemslots)
        : r.slots;
  const bucketed = wealth.reduce((s, r) => s + (r.coinsOrGems ? liveQty(r) : 0), 0);
  const slots =
    Math.ceil(bucketed / 100) + wealth.reduce((s, r) => s + rowSlots(r), 0);
  const load = itemBased ? `${slots} slots` : `${fmtCoin(weight)} cn`;
  // The row's load cell: cn normally, slots under item-based — a dash only for the rows
  // the section buckets, which genuinely have no per-row figure.
  const rowLoad = (r: WealthRowVM) =>
    !itemBased
      ? fmtCoin(liveWeight(r))
      : r.coinsOrGems
        ? "—"
        : String(rowSlots(r));
  const dots = wealth
    .filter((r): r is CoinWealthRow => r.kind === "coin" && draftQty(r) > 0)
    .map((r) => r.denom);
  const hasValuables = wealth.some((r) => r.kind === "treasure");
  const hasContent = wealth.length > 0;

  return (
    <section className="tw:mb-5">
      {/* header bar — full-width button: overlapping coin dots · "Treasure" ·
          gp total · caret · carried weight (far right). */}
      <button
        type="button"
        className={cx(
          "osc-whead",
          "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-[2px] tw:pt-[7px] tw:pb-[9px] tw:text-left tw:disabled:cursor-default",
          open && "open",
        )}
        data-testid="wealth-toggle"
        aria-expanded={open}
        disabled={!hasContent}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="coins tw:inline-flex" aria-hidden="true">
          {dots.map((d) => (
            <span key={d} className={cx("ci", d.toLowerCase(), DOT)} />
          ))}
          {!dots.length && !hasValuables && <span className={cx("ci gp", DOT)} />}
          {hasValuables && (
            // gem marker in the coin stack — signals non-coin treasure is present.
            // Wider gap when it follows a dot (was a `.ci + .osc-wgem` sibling rule).
            <i
              className={cx(
                "osc-wgem fa-solid fa-gem tw:text-[length:var(--fs-3xs)] tw:text-accent-alt",
                dots.length ? "tw:ml-[5px]" : "tw:ml-[3px]",
              )}
              aria-hidden="true"
            />
          )}
        </span>
        <span className="key tw:font-sans tw:text-[length:var(--fs-xs)] tw:font-semibold tw:tracking-[0.13em] tw:uppercase tw:text-text-mute">
          Treasure
        </span>
        <span className="v tw:font-display tw:text-[length:var(--fs-lg)] tw:leading-flush tw:text-accent-alt">
          {fmtCoin(totalGp)}
          <small className="tw:ml-[2px] tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-accent-alt tw:opacity-75">gp</small>
        </span>
        {hasContent && <i className="osc-wcaret fa-solid fa-caret-right" aria-hidden="true" />}
        <span className="wt tw:ml-auto tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-faint">
          {load}
        </span>
      </button>

      {!hasContent && (
        <p className="tw:mt-0 tw:mb-2 tw:ml-[2px] tw:font-serif tw:text-[length:var(--fs-sm)] tw:italic tw:text-text-faint">
          Drop coins, gems, or other valuables here to track your treasure.</p>
      )}

      {open && hasContent && (
        <div className="tw:mt-[2px] tw:rounded-md tw:border tw:border-border-soft tw:bg-bg-2 tw:px-3 tw:pt-[3px] tw:pb-[9px]">
          {/* One unified, fully-sortable table: units live in the headers so rows
              render bare numbers; a header click sorts every row together. The top
              pad separates this row from the "TREASURE …gp" header above. */}
          <div
            className="osc-coin-colhead tw:grid tw:items-center tw:gap-x-3 tw:border-b-2 tw:border-border tw:pt-3 tw:pb-1"
            role="row"
          >
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
              className="tw:justify-end tw:whitespace-nowrap"
              active={sort.key === "qty"}
              dir={sort.dir}
              onClick={() => onSort("qty")}
            />
            {/* Hidden at XS here as well as on the row — the two must agree, or
                the header keeps cells the row has dropped and they wrap onto a
                second line. Stated as a utility rather than a `:nth-child` rule
                in SCSS: the row's cells already hide this way, and a positional
                selector loses to the utility that sets `display` on these
                headers. */}
            <SortHeader
              label={itemBased ? "Slots" : "Weight (cn)"}
              className="tw:justify-end tw:whitespace-nowrap tw:@max-md/app:hidden"
              active={sort.key === "weight"}
              dir={sort.dir}
              onClick={() => onSort("weight")}
            />
            <SortHeader
              label="Value (gp)"
              className="tw:justify-end tw:whitespace-nowrap tw:@max-md/app:hidden"
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
                itemDragData={itemDragData}
                load={rowLoad(row)}
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
                itemDragData={itemDragData}
                load={rowLoad(row)}
                onOpen={onOpen}
                onContext={onContext}
              />
            ),
          )}

          {/* No top border — the last coin row's bottom rule is the divider (avoids a
              double line). Hidden in the xs column along with the Weight/Value cells. */}
          <div className="osc-coin-total tw:mt-[2px] tw:grid tw:items-baseline tw:gap-x-3 tw:pt-2 tw:pb-[1px] tw:@max-md/app:hidden">
            <span className="lab tw:col-start-3 tw:font-sans tw:text-[length:var(--fs-3xs)] tw:font-semibold tw:tracking-[0.12em] tw:uppercase tw:text-text-mute">
              Total
            </span>
            <span className="tw tw:col-start-5 tw:text-right tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-dim">
              {itemBased ? slots : fmtCoin(weight)}
            </span>
            <span className="tv tw:col-start-6 tw:text-right tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-xs)] tw:font-bold tw:text-accent-alt">
              {fmtCoin(totalGp)}
            </span>
          </div>
          {/* explicit close affordance under the table */}
          <div className="tw:mt-3 tw:flex tw:justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
