// Sortable item row (main list) + its shared pieces (NameCell, RowInner).
import type { InventoryItemVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { UsesRow } from "@features/inventory/rows/UsesRow";
import { countedLoad, loadText, EQUIPPED } from "@features/inventory/groups";
import { INV_ROW, INV_ROWCAT, INV_WT } from "@features/inventory/rows/classes";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";
import { InlineUse, NameCell, RowEquip } from "./cells";

// Shared row body (cols 2–8). Stacked rows nest a "Uses" pip line under the name
// (so the row centers across name+uses) and, in xs, an inline Use pill on the name
// row (the pip line is hidden there via the container query).
function RowInner({
  item,
  canEdit,
  variant,
  onEquip,
  onOpen,
  onSetQty,
}: {
  item: InventoryItemVM;
  canEdit: boolean;
  variant?: string;
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
          onEquip={onEquip}
          onOpen={onOpen}
          onSetQty={onSetQty}
        />
      </div>
    </>
  );
}
