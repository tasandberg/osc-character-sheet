// One row of the unified Treasure table. Coins and valuables share this
// component and grid; it branches on `row.kind` only for the interactive bits —
// a coin gets an editable qty <input> + drag handle, a valuable a read-only qty
// span and a link-styled name that opens its item sheet.
import type { WealthRow as WealthRowVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { fmtCoin } from "@features/inventory/fmtCoin";
import type { Dnd, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";

export function WealthRow({
  row,
  coinIndex,
  canEdit,
  dnd,
  inputValue,
  onOpen,
  onContext,
  onQtyChange,
  onQtyCommit,
  onQtyCommitClose,
}: {
  row: WealthRowVM;
  /** Position within the coin subset — drives drag reorder. -1 for valuables. */
  coinIndex: number;
  canEdit: boolean;
  dnd: Dnd;
  /** Controlled coin-input value (draft-aware); coin rows only. */
  inputValue?: string;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onQtyChange?: (value: string) => void;
  onQtyCommit?: () => void;
  onQtyCommitClose?: () => void;
}) {
  const isCoin = row.kind === "coin";
  const rp = isCoin ? dnd.rowProps("coin", coinIndex) : {};
  return (
    <div
      className={cx("osc-coin-row", isCoin && dnd.rowClass("coin", coinIndex))}
      onDragOver={rp.onDragOver}
      onDrop={rp.onDrop}
      onDragEnd={rp.onDragEnd}
      // coins/valuables are real items: right-click → View / Delete (no equip/consume)
      onContextMenu={(e) =>
        onContext(e, { id: row.id, name: row.name, equipped: null, quantity: null })
      }
    >
      {/* Handle column is visually identical for both kinds; only coins wire the
          drag (valuable reorder needs a cross-section data write — see notes). */}
      <span
        className="osc-inv-drag"
        title="Drag to reorder"
        draggable={isCoin && canEdit}
        onDragStart={isCoin ? rp.onDragStart : undefined}
        onDragEnd={isCoin ? rp.onDragEnd : undefined}
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
