// Container: sortable in root + droppable body (accepts nested items).
import type { InventoryItemVM } from "@domain/vm-types";
import { ItemImage } from "@features/inventory/ItemImage";
import { RowEquip } from "@features/inventory/EquippedTray";
import { NameCell, SortableRow } from "@features/inventory/rows/SortableRow";
import { weightLabel, gkey, ROOT, EQUIPPED } from "@features/inventory/groups";
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
  onToggle: (id: string) => void;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: OnContext;
  onSetQty: (id: string, value: number) => void;
}) {
  const group = gkey(item.id);
  const count = item.children.length;
  // Open or shut, the whole container is one nest target: its header row, its child
  // rows, and (when empty) its body all resolve to a drop-into on this container.
  const isDropTarget =
    dnd.isInto(ROOT, index) ||
    (dnd.over?.group === group && dnd.over.where === "into");
  const caret = (
    <button
      type="button"
      className={cx("osc-inv-collapse", collapsed && "collapsed")}
      aria-label={collapsed ? "Expand" : "Collapse"}
      onClick={() => onToggle(item.id)}
    >
      <i className="fa-solid fa-chevron-down" aria-hidden="true" />
    </button>
  );

  return (
    <div className={cx("osc-inv-container", isDropTarget && "is-drop-target")}>
      {/* The header row reorders among root items AND accepts items dropped onto it (nest). */}
      <div
        className={cx(
          "osc-inv-row",
          "is-container",
          "is-sortable",
          dnd.rowClass(ROOT, index),
        )}
        onContextMenu={(e) => onContext(e, item)}
        {...dnd.rowProps(ROOT, index, {
          container: true,
          containerZone: item.id,
          ownZone: ROOT,
          acceptCrossGroup: (from) => from !== EQUIPPED,
          dragPayload: () => itemDragData(item.id),
        })}
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
        <span className="osc-inv-rowcat">{item.category}</span>
        <span className="osc-inv-wt">{weightLabel(item.weight)}</span>
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
