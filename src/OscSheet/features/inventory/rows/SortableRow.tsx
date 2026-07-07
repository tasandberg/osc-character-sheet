// Sortable item row (main list) + its shared pieces (NameCell, RowInner).
import type { InventoryItemVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { RowEquip } from "@features/inventory/EquippedTray";
import { weightLabel, ROOT, EQUIPPED } from "@features/inventory/groups";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";

/** Name + optional (count/qty) on top, tags beneath. `trailing` sits beside the name button (e.g. a caret). */
export function NameCell({
  item,
  onOpen,
  badge,
  trailing,
}: {
  item: InventoryItemVM;
  onOpen: (id: string) => void;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
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
          {item.damage && <span className="osc-inv-qtytag">{item.damage}</span>}
          {!item.isContainer && item.quantity && item.quantity.value > 1 && (
            <span className="osc-inv-qtytag">×{item.quantity.value}</span>
          )}
          {badge}
        </button>
        {trailing}
      </div>
    </div>
  );
}

// Shared row body (cols 2–8) — used by the main list AND the equipped table.
function RowInner({
  item,
  onEquip,
  onOpen,
}: {
  item: InventoryItemVM;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <ItemImage img={item.img} monogram={item.monogram} />
      <NameCell item={item} onOpen={onOpen} />
      <span className="osc-inv-rowcat">{item.category}</span>
      <span className="osc-inv-wt">{weightLabel(item.weight)}</span>
      <RowEquip item={item} onEquip={onEquip} />
    </>
  );
}

export function SortableRow({
  item,
  index,
  group,
  depth,
  dnd,
  itemDragData,
  onEquip,
  onOpen,
  onContext,
}: {
  item: InventoryItemVM;
  index: number;
  group: string;
  depth: number;
  dnd: Dnd;
  itemDragData: ItemDragData;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: OnContext;
}) {
  // No handle: the whole row is draggable. Clicks on the inner buttons/inputs still
  // fire (a click is a press without movement), so name/equip/qty stay interactive.
  return (
    <div
      className={cx("osc-inv-row", "is-sortable", dnd.rowClass(group, index))}
      style={
        depth > 0
          ? ({ "--osc-inv-depth": depth } as React.CSSProperties)
          : undefined
      }
      onContextMenu={(e) => onContext(e, item)}
      // Root rows accept a container child dropped among them (un-nest), but NOT a
      // tray tile — equipped-tray drags onto the list are routed to unequip instead.
      {...dnd.rowProps(group, index, {
        ownZone: group,
        acceptCrossGroup: group === ROOT ? (from) => from !== EQUIPPED : false,
        dragPayload: () => itemDragData(item.id),
      })}
    >
      <span className="osc-inv-drag" aria-hidden="true">
        <i className="fa-solid fa-grip-lines" />
      </span>
      <RowInner item={item} onEquip={onEquip} onOpen={onOpen} />
    </div>
  );
}
