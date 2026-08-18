// Sortable item row (main list) + its shared pieces (NameCell, RowInner).
import type { InventoryItemVM } from "@domain/vm-types";
import { EQUIPPED } from "@features/inventory/groups";
import { INV_ROW } from "@features/inventory/rows/classes";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { cx } from "@ui/cx";
import { RowCells } from "./RowCells";

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
  menuOpenId,
  onMenuToggle,
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
  menuOpenId: string | null;
  onMenuToggle: (id: string | null) => void;
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
      <RowCells
        ctx={{
          item,
          canEdit,
          variant,
          onEquip,
          onOpen,
          onSetQty,
          menuOpenId,
            onMenuToggle,
        }}
      />
    </div>
  );
}
