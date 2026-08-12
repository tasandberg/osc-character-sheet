// Sortable item row (main list) + its shared pieces (NameCell, RowInner).
import type { InventoryItemVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { RowEquip } from "@features/inventory/EquippedTray";
import { UsesRow } from "@features/inventory/rows/UsesRow";
import { ItemControls } from "@features/inventory/ItemControls";
import { Button } from "@ui/Button";
import { countedLoad, loadText, EQUIPPED } from "@features/inventory/groups";
import {
  INV_ROW,
  INV_ROWCAT,
  INV_WT,
  INV_QTYTAG,
} from "@features/inventory/rows/classes";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";

/** Name + optional (count/qty) on top, tags beneath. `action` sits right after the
 * name (e.g. the xs inline Use pill); `trailing` sits beside it (e.g. a caret).
 * `below` is a second line inside the cell (the Uses pip row) so the grid row grows
 * to name+uses height and the flanking cells center across the whole block. */
export function NameCell({
  item,
  onOpen,
  badge,
  action,
  trailing,
  below,
}: {
  item: InventoryItemVM;
  onOpen: (id: string) => void;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  trailing?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="osc-inv-name-c">
      <div className="osc-inv-name-row">
        <button
          type="button"
          className="osc-inv-name"
          onClick={() => onOpen(item.id)}
        >
          <span className="nm">{item.name}</span>
          {item.damage && <span className={INV_QTYTAG}>{item.damage}</span>}
          {!item.isContainer && item.quantity && item.quantity.value > 1 && (
            <span className={INV_QTYTAG}>×{item.quantity.value}</span>
          )}
          {badge}
        </button>
        {action}
        {trailing}
      </div>
      {below}
    </div>
  );
}

// xs-only inline decrement pill (shown in place of the "Uses" pip sub-row at
// narrow widths — see the @container xs block). Same tick-off-one behaviour.
function InlineUse({
  item,
  onSetQty,
}: {
  item: InventoryItemVM;
  onSetQty: (id: string, value: number) => void;
}) {
  const value = item.quantity?.value ?? 0;
  return (
    <Button
      variant="outline"
      tone="brass"
      size="xs"
      className="osc-inv-useinline"
      onClick={() => onSetQty(item.id, Math.max(0, value - 1))}
      disabled={value <= 0}
      aria-label={`Use one ${item.name}`}
    >
      Use
    </Button>
  );
}

// Shared row body (cols 2–8). Stacked rows nest a "Uses" pip line under the name
// (so the row centers across name+uses) and, in xs, an inline Use pill on the name
// row (the pip line is hidden there via the container query).
function RowInner({
  item,
  canEdit,
  variant,
  showControls,
  onEquip,
  onOpen,
  onSetQty,
}: {
  item: InventoryItemVM;
  canEdit: boolean;
  variant?: string;
  showControls?: boolean;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onSetQty: (id: string, value: number) => void;
}) {
  const stacked = !item.isContainer && item.quantity != null;
  return (
    <>
      <ItemImage img={item.img} monogram={item.monogram} />
      <NameCell
        item={item}
        onOpen={onOpen}
        action={
          stacked && canEdit ? (
            <InlineUse item={item} onSetQty={onSetQty} />
          ) : undefined
        }
        below={
          stacked ? (
            <UsesRow item={item} canEdit={canEdit} onSetQty={onSetQty} />
          ) : undefined
        }
      />
      <span className={INV_ROWCAT}>{item.category}</span>
      <span className={INV_WT}>{loadText(countedLoad(item, variant))}</span>
      <RowEquip item={item} onEquip={onEquip} />
      {showControls && <ItemControls itemId={item.id} />}
    </>
  );
}

export function SortableRow({
  item,
  index,
  group,
  depth,
  nestZone,
  dnd,
  itemDragData,
  canEdit,
  variant,
  showControls,
  onEquip,
  onOpen,
  onContext,
  onSetQty,
}: {
  item: InventoryItemVM;
  index: number;
  group: string;
  depth: number;
  /** Set on a container's child rows: a foreign item dropped here nests into that container. */
  nestZone?: string;
  dnd: Dnd;
  itemDragData: ItemDragData;
  canEdit: boolean;
  /** Active encumbrance variant — picks the load unit (slots vs cn). */
  variant?: string;
  /** Render the module extension slot (only when a module listens for it). */
  showControls?: boolean;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onSetQty: (id: string, value: number) => void;
}) {
  // The whole row is draggable (and stays a drop target). Clicks on the inner
  // buttons/inputs still fire — a click is a press without movement — so
  // name/equip/qty stay interactive.
  // Root rows accept a container child dropped among them (un-nest); a container's
  // child rows accept a foreign item (nest into that container). Neither accepts a
  // tray tile — equipped-tray drags onto the list are routed to unequip instead.
  const rp = dnd.rowProps(group, index, {
    ownZone: group,
    nestZone,
    acceptCrossGroup: (from) => from !== EQUIPPED,
    dragPayload: () => itemDragData(item.id),
  });
  return (
    <>
      <div
        className={cx(INV_ROW, "is-sortable", dnd.rowClass(group, index))}
        style={
          depth > 0
            ? ({ "--osc-inv-depth": depth } as React.CSSProperties)
            : undefined
        }
        onContextMenu={(e) => onContext(e, item)}
        {...rp}
      >
        <span className="osc-inv-drag" aria-hidden="true">
          <i className="fa-solid fa-grip-lines" />
        </span>
        <RowInner
          item={item}
          canEdit={canEdit}
          variant={variant}
          showControls={showControls}
          onEquip={onEquip}
          onOpen={onOpen}
          onSetQty={onSetQty}
        />
      </div>
    </>
  );
}
