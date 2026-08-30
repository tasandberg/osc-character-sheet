// One row of the unified Treasure table. Coins and valuables share this
// component and grid; it branches on `row.kind` only for the interactive bits —
// a coin gets an editable qty <input> + drag handle, a valuable a read-only qty
// span and a link-styled name that opens its item sheet.
import type { WealthRow as WealthRowVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { fmtCoin } from "@features/inventory/fmtCoin";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";

export function WealthRow({
  row,
  index,
  canEdit,
  dnd,
  itemDragData,
  load,
  inputValue,
  onOpen,
  onContext,
  onQtyChange,
  onQtyCommit,
  onQtyCommitClose,
}: {
  row: WealthRowVM;
  /** Position in the unified sorted list — the drag-reorder index for every row. */
  index: number;
  canEdit: boolean;
  dnd: Dnd;
  /** Foundry item drag-data for this row (coins/valuables are real items) so a drag
   *  carries `{type:"Item",uuid,…}` — droppable onto the hotbar and Item Piles. */
  itemDragData: ItemDragData;
  /** Pre-formatted load cell — cn, slots, or an em-dash for the rows the section buckets.
   *  The unit is variant-dependent and lives in the column header, so the parent formats it. */
  load: string;
  /** Controlled coin-input value (draft-aware); coin rows only. */
  inputValue?: string;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onQtyChange?: (value: string) => void;
  onQtyCommit?: () => void;
  onQtyCommitClose?: () => void;
}) {
  const isCoin = row.kind === "coin";
  // One dnd list for the whole table: the whole row is draggable and a drop
  // target — so coins and valuables reorder identically to item rows.
  const rp = dnd.rowProps("wealth", index, {
    dragPayload: () => itemDragData(row.id),
  });
  return (
    <div
      className={cx(
        "osc-coin-row",
        "tw:grid tw:items-center tw:gap-x-3 tw:py-2 tw:border-b tw:border-border-soft",
        dnd.rowClass("wealth", index),
      )}
      {...rp}
      // coins/valuables are real items: right-click → View / Delete (no equip/consume)
      onContextMenu={(e) =>
        onContext(e, {
          id: row.id,
          name: row.name,
          equipped: null,
          quantity: null,
        })
      }
    >
      <span className="osc-inv-drag" title="Drag to reorder">
        <i className="fa-solid fa-grip-lines" aria-hidden="true" />
      </span>
      <ItemImage img={row.img} monogram={row.monogram} />
      <div className="osc-inv-name-c">
        <div className="osc-inv-name-row">
          <button
            type="button"
            className="osc-inv-name"
            title={isCoin ? undefined : "Open item sheet to edit"}
            onClick={() => onOpen(row.id)}
          >
            <span className="nm">{row.name}</span>
          </button>
        </div>
      </div>
      {isCoin ? (
        <input
          className="osc-coin-qty tw:w-full tw:min-w-0 tw:rounded-sm tw:border tw:border-border-soft tw:bg-surface tw:px-2 tw:py-[5px] tw:text-right tw:font-mono tw:text-[length:var(--fs-sm)] tw:text-text tw:transition-[border-color] tw:duration-[120ms] tw:hover:border-border tw:focus:border-accent-alt tw:focus:outline-none"
          type="number"
          min={0}
          inputMode="numeric"
          draggable={false}
          data-testid={`coin-qty-${row.denom.toLowerCase()}`}
          value={inputValue ?? ""}
          aria-label={`${row.name} quantity`}
          // Read-only sheets: coin qty is view-only.
          readOnly={!canEdit}
          disabled={!canEdit}
          onChange={(e) => onQtyChange?.(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") onQtyCommitClose?.();
          }}
          onBlur={() => onQtyCommit?.()}
        />
      ) : (
        // Valuables show a read-only qty in the SAME slot as a coin's editable
        // <input>, and must be indistinguishable from it apart from the missing
        // field chrome — hence the identical box metrics (font-size, padding,
        // transparent 1px border) and text colour.
        <span className="tw:border tw:border-transparent tw:px-2 tw:py-[5px] tw:text-right tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-sm)] tw:text-text">
          {fmtCoin(row.qty)}
        </span>
      )}
      {/* nowrap on both: never split "1,300 cn" off its unit */}
      <span data-testid="coin-load" className="tw:text-right tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-dim tw:@max-md/app:hidden">
        {load}
      </span>
      <span className="tw:text-right tw:whitespace-nowrap tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text tw:@max-md/app:hidden">
        {fmtCoin(row.value)}
      </span>
    </div>
  );
}
