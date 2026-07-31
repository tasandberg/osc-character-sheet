// Container: sortable in root + droppable body (accepts nested items).
import type { InventoryItemVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { RowEquip } from "@features/inventory/EquippedTray";
import { NameCell, SortableRow } from "@features/inventory/rows/SortableRow";
import {
  countedLoad,
  loadText,
  gkey,
  ROOT,
  EQUIPPED,
} from "@features/inventory/groups";
import { INV_ROW, INV_ROWCAT, INV_WT } from "@features/inventory/rows/classes";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";

export function ContainerRow({
  item,
  index,
  childIds,
  byId,
  collapsed,
  dnd,
  itemDragData,
  canEdit,
  variant,
  onToggle,
  onEquip,
  onOpen,
  onContext,
  onSetQty,
}: {
  item: InventoryItemVM;
  index: number;
  childIds: string[];
  byId: Map<string, InventoryItemVM>;
  collapsed: boolean;
  dnd: Dnd;
  itemDragData: ItemDragData;
  canEdit: boolean;
  /** Active encumbrance variant — picks the load unit (slots vs cn). */
  variant?: string;
  onToggle: (id: string) => void;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onSetQty: (id: string, value: number) => void;
}) {
  const group = gkey(item.id);
  const count = item.children.length;
  // The whole header row is draggable; it reorders among root items AND accepts
  // items dropped onto it (nest).
  const rp = dnd.rowProps(ROOT, index, {
    container: true,
    containerZone: item.id,
    ownZone: ROOT,
    acceptCrossGroup: (from) => from !== EQUIPPED,
    dragPayload: () => itemDragData(item.id),
  });
  // Open or shut, the whole container is one nest target: its header row, its child
  // rows, and (when empty) its body all resolve to a drop-into on this container.
  const isDropTarget =
    dnd.isInto(ROOT, index) ||
    (dnd.over?.group === group && dnd.over.where === "into");
  const caret = (
    <button
      type="button"
      className={cx(
        "osc-inv-collapse",
        // the chevron rotates (a stacking context); pin it low so tooltips clear
        // it. The rotation itself stays in _rows.scss.
        "tw:relative tw:z-[var(--z-raised)] tw:inline-flex tw:items-center tw:justify-center",
        "tw:px-1 tw:py-0 tw:bg-transparent tw:border-none tw:cursor-pointer",
        "tw:text-[length:var(--fs-sm)] tw:leading-flush tw:text-text-mute tw:hover:text-text",
        "tw:transition-[color] tw:duration-[120ms]",
        collapsed && "collapsed",
      )}
      aria-label={collapsed ? "Expand" : "Collapse"}
      onClick={() => onToggle(item.id)}
    >
      <i className="fa-solid fa-chevron-down" aria-hidden="true" />
    </button>
  );

  return (
    <div className={cx("osc-inv-container", isDropTarget && "is-drop-target")}>
      <div
        className={cx(
          INV_ROW,
          "is-container",
          "is-sortable",
          dnd.rowClass(ROOT, index),
        )}
        onContextMenu={(e) => onContext(e, item)}
        {...rp}
      >
        <span className="osc-inv-drag" aria-hidden="true">
          <i className="fa-solid fa-grip-lines" />
        </span>
        <ItemImage img={item.img} monogram={item.monogram} />
        <NameCell
          item={item}
          onOpen={onOpen}
          badge={<Tag intent="count">{count}</Tag>}
          trailing={caret}
        />
        <span className={INV_ROWCAT}>{item.category}</span>
        <span className={INV_WT}>{loadText(countedLoad(item, variant))}</span>
        <RowEquip item={item} onEquip={onEquip} />
      </div>

      <div
        className={cx("osc-inv-children", collapsed && "is-collapsed")}
        // Empty container: its body is the nest target (no sibling rows to hover).
        {...(!collapsed && childIds.length === 0
          ? dnd.nestProps(group, index, item.id)
          : {})}
      >
        {!collapsed &&
          childIds.map((cid, i) => {
            const child = byId.get(cid);
            return child ? (
              <SortableRow
                key={cid}
                item={child}
                index={i}
                group={group}
                depth={1}
                nestZone={item.id}
                dnd={dnd}
                itemDragData={itemDragData}
                canEdit={canEdit}
                variant={variant}
                onEquip={onEquip}
                onOpen={onOpen}
                onContext={onContext}
                onSetQty={onSetQty}
              />
            ) : null;
          })}
      </div>
    </div>
  );
}
