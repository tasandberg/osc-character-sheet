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
  /** Controlled coin-input value (draft-aware); coin rows only. */
  inputValue?: string;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onQtyChange?: (value: string) => void;
  onQtyCommit?: () => void;
  onQtyCommitClose?: () => void;
}) {
  const isCoin = row.kind === "coin";
  // One dnd list for the whole table: every row both initiates and receives a
  // drag through the same mechanism, so coins and valuables reorder identically.
  const rp = dnd.rowProps("wealth", index, { dragPayload: () => itemDragData(row.id) });
  return (
    <div
      className={cx("osc-coin-row", dnd.rowClass("wealth", index))}
      onDragOver={rp.onDragOver}
      onDrop={rp.onDrop}
      onDragEnd={rp.onDragEnd}
      // coins/valuables are real items: right-click → View / Delete (no equip/consume)
      onContextMenu={(e) =>
        onContext(e, { id: row.id, name: row.name, equipped: null, quantity: null })
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
          className="osc-coin-qty"
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
          onKeyDown={(e) => { if (e.key === "Enter") onQtyCommitClose?.(); }}
          onBlur={() => onQtyCommit?.()}
        />
      ) : (
        <span className="osc-coin-qty-ro">{fmtCoin(row.qty)}</span>
      )}
      <span className="osc-coin-wt">{fmtCoin(row.weight)}</span>
      <span className="osc-coin-val">{fmtCoin(row.value)}</span>
    </div>
  );
}
