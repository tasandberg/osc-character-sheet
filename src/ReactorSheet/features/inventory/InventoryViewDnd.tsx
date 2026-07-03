// Inventory list — drag & drop on native HTML5 DnD via useDragReorder.
// Behaviour: rows DON'T rearrange live under the cursor — a CSS insertion line
// (drop-before/after, painted on the hovered row's edge) shows where the drop
// lands, and the reorder commits once on drop. This avoids the per-frame reflow
// of a live-sortable. Dragging an item onto a container nests it; a root zone at
// the bottom moves a nested item back out. The previous @dnd-kit/core
// implementation lives in ./InventoryView.tsx and is left intact for comparison.
//
// Row layout (left→right): drag handle · item image · name (+qty) with tags beneath
// · equip checkbox · type · damage · qty · weight.
import { useEffect, useRef, useState } from "react";
import type {
  InventoryVM,
  EncumbranceVM,
  InventoryItemVM,
  CoinVM,
  InventorySortKey,
  SortDir,
} from "@domain/vm-types";
import { sortInventory, SORT_DEFAULT_DIR } from "@features/inventory/inventory";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { buildItemMacroDragData } from "@features/inventory/dragToMacro";
import { WealthSection } from "@features/inventory/WealthSection";
import { ItemImage } from "@features/inventory/ItemImage";
import { SortHeader } from "@features/inventory/SortHeader";
import { useReactorSheetContext } from "@app/context";
import { FEATURES } from "@app/features";
import { SectionTitle } from "@ui/SectionTitle";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import type { OseItem } from "@domain/types";

type Dnd = ReturnType<typeof useDragReorder>;

/** Per-row Foundry drag payload → drop onto the macro hotbar. undefined = row isn't
 *  a draggable-to-macro item (default `<group>:<idx>` reorder payload is used). */
type ItemDragData = (id: string) => string | undefined;

type Ops = {
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
  onReorder: (updates: { id: string; sort: number }[]) => void;
  /** Persist the equipped tray's own order (writes the `equippedOrder` flag). */
  onReorderEquipped: (updates: { id: string; sort: number }[]) => void;
  onNest: (itemId: string, containerId: string | null) => void;
};

/** Right-click context-menu target: which item, and where to anchor the menu.
 *  Coins are real Foundry items too, so they reuse this — only the fields the menu
 *  reads are required (a coin passes equipped/quantity null → just View + Delete). */
type CtxItem = Pick<InventoryItemVM, "id" | "name" | "equipped" | "quantity">;
type MenuState = { item: CtxItem; x: number; y: number };
export type OnContext = (e: React.MouseEvent, item: CtxItem) => void;

type Props = {
  inventory: InventoryVM;
  encumbrance: EncumbranceVM;
  coins: CoinVM[];
  onSetCoin: (id: string, value: number) => void;
} & Ops;

type SortState = { key: InventorySortKey; dir: SortDir };
type Groups = Record<string, string[]>;

const ROOT = "root";
const EQUIPPED = "equipped"; // drag group for the equipped-tray tiles (own order)
const gkey = (containerId: string) => `c:${containerId}`;
const groupContainerId = (key: string) => (key === ROOT ? null : key.slice(2));

const weightLabel = (w: number) => (w > 0 ? `${w} cn` : "—");

// "N items · X cn" — count + total weight, used by both section headers.
function flattenItems(list: InventoryItemVM[]): InventoryItemVM[] {
  return list.flatMap((it) => [it, ...flattenItems(it.children)]);
}
function sectionCountLabel(items: InventoryItemVM[]): string {
  const all = flattenItems(items);
  const cn = all.reduce((s, it) => s + (it.weight || 0), 0);
  return `${all.length} ${all.length === 1 ? "item" : "items"} · ${cn} cn`;
}

// ---------------------------------------------------------------------------
// Groups <-> VM
// ---------------------------------------------------------------------------

function indexById(items: InventoryItemVM[]): Map<string, InventoryItemVM> {
  const m = new Map<string, InventoryItemVM>();
  for (const it of items) {
    m.set(it.id, it);
    for (const ch of it.children) m.set(ch.id, ch);
  }
  return m;
}

function buildGroups(items: InventoryItemVM[], sort: SortState): Groups {
  const sorted = sortInventory(items, sort.key, sort.dir);
  const groups: Groups = { [ROOT]: [] };
  for (const it of sorted) {
    groups[ROOT].push(it.id);
    if (it.isContainer)
      groups[gkey(it.id)] = sortInventory(it.children, sort.key, sort.dir).map(
        (c) => c.id,
      );
  }
  return groups;
}

function originContainers(
  items: InventoryItemVM[],
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const it of items) {
    m.set(it.id, null);
    for (const ch of it.children) m.set(ch.id, it.id);
  }
  return m;
}

// ---------------------------------------------------------------------------
// Row pieces
// ---------------------------------------------------------------------------

// Equip toggle: outlined hand = unequipped, filled hand = equipped.
function RowEquip({
  item,
  onEquip,
}: {
  item: InventoryItemVM;
  onEquip: (id: string) => void;
}) {
  if (item.equipped === null)
    return <span className="rs-inv-equip-spacer" aria-hidden="true" />;
  return (
    <button
      type="button"
      className={cx("rs-inv-equip", item.equipped && "is-on")}
      data-testid={`equip-${item.id}`}
      aria-pressed={item.equipped}
      aria-label={item.equipped ? "Unequip" : "Equip"}
      onClick={() => onEquip(item.id)}
    >
      <i
        className={cx(item.equipped ? "fa-solid" : "fa-regular", "fa-hand")}
        aria-hidden="true"
      />
    </button>
  );
}

/** Name + optional (count/qty) on top, tags beneath. `trailing` sits beside the name button (e.g. a caret). */
function NameCell({
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
    <div className="rs-inv-name-c">
      <div className="rs-inv-name-row">
        <button
          type="button"
          className="rs-inv-name"
          onClick={() => onOpen(item.id)}
        >
          <span className="nm">{item.name}</span>
          {item.damage && <span className="rs-inv-qtytag">{item.damage}</span>}
          {!item.isContainer && item.quantity && item.quantity.value > 1 && (
            <span className="rs-inv-qtytag">×{item.quantity.value}</span>
          )}
          {badge}
        </button>
        {trailing}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared row body (cols 2–8) — used by the main list AND the equipped table
// ---------------------------------------------------------------------------

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
      <span className="rs-inv-rowcat">{item.category}</span>
      <span className="rs-inv-wt">{weightLabel(item.weight)}</span>
      <RowEquip item={item} onEquip={onEquip} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Sortable item row (main list)
// ---------------------------------------------------------------------------

function SortableRow({
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
      className={cx("rs-inv-row", "is-sortable", dnd.rowClass(group, index))}
      style={
        depth > 0
          ? ({ "--rs-inv-depth": depth } as React.CSSProperties)
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
      <span className="rs-inv-drag" aria-hidden="true">
        <i className="fa-solid fa-grip-lines" />
      </span>
      <RowInner item={item} onEquip={onEquip} onOpen={onOpen} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container: sortable in root + droppable body (accepts nested items)
// ---------------------------------------------------------------------------

function ContainerRow({
  item,
  index,
  childIds,
  byId,
  collapsed,
  dnd,
  itemDragData,
  onToggle,
  onEquip,
  onOpen,
  onContext,
}: {
  item: InventoryItemVM;
  index: number;
  childIds: string[];
  byId: Map<string, InventoryItemVM>;
  collapsed: boolean;
  dnd: Dnd;
  itemDragData: ItemDragData;
  onToggle: (id: string) => void;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: OnContext;
}) {
  const group = gkey(item.id);
  const count = item.children.length;
  // Only collapsed containers accept drop-into; an expanded one drags/drops as a
  // normal root row (fill it by dropping among its visible children instead).
  const isDropTarget = collapsed && dnd.isInto(ROOT, index);
  const caret = (
    <button
      type="button"
      className={cx("rs-inv-collapse", collapsed && "collapsed")}
      aria-label={collapsed ? "Expand" : "Collapse"}
      onClick={() => onToggle(item.id)}
    >
      <i className="fa-solid fa-chevron-down" aria-hidden="true" />
    </button>
  );

  return (
    <div className={cx("rs-inv-container", isDropTarget && "is-drop-target")}>
      {/* The header row reorders among root items AND accepts items dropped onto it (nest). */}
      <div
        className={cx(
          "rs-inv-row",
          "is-container",
          "is-sortable",
          dnd.rowClass(ROOT, index),
        )}
        onContextMenu={(e) => onContext(e, item)}
        {...dnd.rowProps(ROOT, index, {
          container: collapsed,
          containerZone: item.id,
          ownZone: ROOT,
          acceptCrossGroup: (from) => from !== EQUIPPED,
          dragPayload: () => itemDragData(item.id),
        })}
      >
        <span className="rs-inv-drag" aria-hidden="true">
          <i className="fa-solid fa-grip-lines" />
        </span>
        <ItemImage img={item.img} monogram={item.monogram} />
        <NameCell
          item={item}
          onOpen={onOpen}
          badge={<Tag intent="count">{count}</Tag>}
          trailing={caret}
        />
        <span className="rs-inv-rowcat">{item.category}</span>
        <span className="rs-inv-wt">{weightLabel(item.weight)}</span>
        <RowEquip item={item} onEquip={onEquip} />
      </div>

      <div
        className={cx("rs-inv-children", collapsed && "is-collapsed")}
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
                dnd={dnd}
                itemDragData={itemDragData}
                onEquip={onEquip}
                onOpen={onOpen}
                onContext={onContext}
              />
            ) : null;
          })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort header row (uses the shared SortHeader)
// ---------------------------------------------------------------------------

function SortHeaderRow({
  sort,
  onSort,
}: {
  sort: SortState;
  onSort: (key: InventorySortKey) => void;
}) {
  const th = (col: InventorySortKey, label: React.ReactNode, className?: string) => (
    <SortHeader
      label={label}
      className={className}
      active={sort.key === col}
      dir={sort.dir}
      onClick={() => onSort(col)}
    />
  );
  return (
    <div className="rs-inv-row rs-inv-headrow" role="row">
      <span aria-hidden="true" /> {/* drag */}
      {/* "Item" spans the image + name columns so it left-aligns to the image */}
      {th("name", "Item", "rs-inv-th-item")}
      {th("category", "Type", "rs-inv-th-cat")}
      {th("weight", "Wt", "rs-inv-th-wt")}
      <span className="rs-inv-thlabel rs-inv-thlabel-eq">Equip</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Encumbrance readout
// ---------------------------------------------------------------------------

// Encumbrance readout for the Inventory header: load · status · move, with the
// band colour (green/yellow/red) on status+move carrying the signal — no bar.
const ENC_BAND = ["ok", "warn", "danger", "danger", "danger"] as const;

function EncumbranceReadout({ e }: { e: EncumbranceVM }) {
  return (
    <span className={cx("rs-enc-readout", ENC_BAND[e.tier])}>
      {e.label && (
        <>
          <span className="load">{e.label}</span>
          <span className="sep" aria-hidden="true">·</span>
        </>
      )}
      <span className="status">{e.status}</span>
      <span className="sep" aria-hidden="true">·</span>
      <span className="move">{e.move}′</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section header (static — title + "N items · X cn")
// ---------------------------------------------------------------------------

function SectionCount({
  title,
  items,
}: {
  title: string;
  items: InventoryItemVM[];
}) {
  return (
    <div className="rs-inv-sec-head">
      <SectionTitle variant="sub">{title}</SectionTitle>
      <span className="rs-inv-sec-count">{sectionCountLabel(items)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipped tray — dashed-bordered row of large ink-stamp tiles, one per
// equipped item, each with a hover popover. Click a tile to unequip.
// ---------------------------------------------------------------------------

/** Full item stats for the equipped popover: AC/AAC, damage, qty, cost, weight. */
function equippedStats(
  item: InventoryItemVM,
): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  if (item.armorClass)
    stats.push({
      label: item.armorClass.label,
      value: String(item.armorClass.value),
    });
  if (item.damage) stats.push({ label: "Dmg", value: item.damage });
  if (item.quantity)
    stats.push({
      label: "Qty",
      value: `${item.quantity.value} / ${item.quantity.max}`,
    });
  stats.push({ label: "Cost", value: `${item.cost} gp` });
  stats.push({ label: "Wgt", value: weightLabel(item.weight) });
  return stats;
}

function EquippedTray({
  items,
  dnd,
  itemDragData,
  onOpen,
  onContext,
  equipDropActive,
  onEquipDrop,
}: {
  items: InventoryItemVM[];
  dnd: Dnd;
  itemDragData: ItemDragData;
  onOpen: (id: string) => void;
  onContext: OnContext;
  /** An All-Items row is mid-drag — the tray is a live equip drop target. */
  equipDropActive: boolean;
  /** Drop landed on the tray → equip the dragged item. */
  onEquipDrop: () => void;
}) {
  const [over, setOver] = useState(false);
  const dropping = equipDropActive && over;
  return (
    <div
      className={cx("rs-equip-tray", dropping && "is-drop-target")}
      onDragOver={
        equipDropActive
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(true);
            }
          : undefined
      }
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={
        equipDropActive
          ? (e) => {
              e.preventDefault();
              onEquipDrop();
              setOver(false);
            }
          : undefined
      }
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          className={cx(
            "rs-equip-tcard",
            "is-sortable",
            dnd.rowClass(EQUIPPED, i),
          )}
          onContextMenu={(e) => onContext(e, item)}
          {...dnd.rowProps(EQUIPPED, i, {
            ownZone: EQUIPPED,
            axis: "x",
            dragPayload: () => itemDragData(item.id),
          })}
        >
          <button
            type="button"
            className="rs-equip-tt"
            onClick={() => onOpen(item.id)}
            aria-label={item.name}
            title={item.name}
          >
            {item.img ? (
              <img src={item.img} alt="" />
            ) : (
              <span className="rs-equip-tt-ic">{item.monogram}</span>
            )}
          </button>
          <span className="rs-equip-tt-pop" role="tooltip">
            <span className="rs-equip-tt-pop-nm">{item.name}</span>
            <span className="rs-equip-tt-pop-type">{item.category}</span>
            <span className="rs-equip-tt-pop-stats">
              {equippedStats(item).map((st) => (
                <span className="rs-equip-tt-pop-stat" key={st.label}>
                  <span className="k">{st.label}</span>
                  <span className="v">{st.value}</span>
                </span>
              ))}
            </span>
            {item.tags.length > 0 && (
              <span className="rs-equip-tt-pop-tags">
                {item.tags.map((t) => (
                  <span className="rs-equip-tt-pop-tag" key={t.label}>
                    {t.icon && (
                      <i
                        className={cx("fa-solid", t.icon)}
                        aria-hidden="true"
                      />
                    )}
                    {t.label}
                  </span>
                ))}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-click context menu
// ---------------------------------------------------------------------------

function ItemContextMenu({
  menu,
  onClose,
  onOpen,
  onEquip,
  onConsume,
  onDelete,
}: {
  menu: MenuState;
  onClose: () => void;
  onOpen: (id: string) => void;
  onEquip: (id: string) => void;
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", onClose);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("pointerdown", onClose);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  // Keep the menu on-screen.
  const style: React.CSSProperties = {
    left: Math.min(menu.x, window.innerWidth - 200),
    top: Math.min(menu.y, window.innerHeight - 170),
  };

  return (
    <div
      className="rs-ctx"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="rs-ctx-title">{menu.item.name}</div>
      <button
        type="button"
        className="rs-ctx-item"
        onClick={() => {
          onOpen(menu.item.id);
          onClose();
        }}
      >
        <i className="fa-solid fa-eye" aria-hidden="true" /> View Item
      </button>
      {/* Send Item is a WIP — gated off for v1. See GH #16 / OLD-19. */}
      {FEATURES.sendItem && (
        <button
          type="button"
          className="rs-ctx-item"
          disabled
          title="Coming soon"
        >
          <i className="fa-solid fa-gift" aria-hidden="true" /> Send Item
        </button>
      )}
      {menu.item.equipped === true && (
        <button
          type="button"
          className="rs-ctx-item"
          onClick={() => {
            onEquip(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-hand" aria-hidden="true" /> Unequip
        </button>
      )}
      {menu.item.quantity != null && (
        <button
          type="button"
          className="rs-ctx-item"
          onClick={() => {
            onConsume(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-circle-minus" aria-hidden="true" /> Consume
          one
        </button>
      )}
      <button
        type="button"
        className="rs-ctx-item is-danger"
        onClick={() => {
          onDelete(menu.item.id);
          onClose();
        }}
      >
        <i className="fa-solid fa-trash" aria-hidden="true" /> Delete Item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function InventoryViewDnd({
  inventory,
  encumbrance,
  coins,
  onSetCoin,
  onEquip,
  onOpen,
  onDelete,
  onConsume,
  onReorder,
  onReorderEquipped,
  onNest,
}: Props) {
  // Rows always render in manual order (from `groups`); a sort-header click bakes the
  // chosen order into the `order` flag and returns here, so drags keep sticking.
  const [sort] = useState<SortState>({ key: "manual", dir: "asc" });
  // Last sort applied via a header click — drives the column's caret/active state
  // (we don't stay in a live sort, so this is purely the affordance). null = none.
  const [lastSort, setLastSort] = useState<SortState | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set()); // containers collapsed by default
  const [groups, setGroups] = useState<Groups>(() =>
    buildGroups(inventory.items, sort),
  );
  // The equipped tray keeps its OWN order (ids), independent of the All-Items list.
  const [equippedIds, setEquippedIds] = useState<string[]>(() =>
    inventory.equipped.map((it) => it.id),
  );
  const [listOver, setListOver] = useState(false); // tray tile hovering the list → unequip
  const [menu, setMenu] = useState<MenuState | null>(null);

  // Foundry items by id — source for the hotbar drag payload. Dragging a row onto
  // the macro bar creates an item macro (OSE's hotbarDrop hook), like the stock sheet.
  const { actor, items } = useReactorSheetContext();
  const itemsById = new Map<string, OseItem>(items.map((it) => [it._id, it]));
  const itemDragData: ItemDragData = (id) => {
    const it = itemsById.get(id);
    return it ? buildItemMacroDragData(actor, it) : undefined;
  };

  const openMenu: OnContext = (e, item) => {
    e.preventDefault();
    setMenu({ item, x: e.clientX, y: e.clientY });
  };

  const byId = indexById(inventory.items);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  // Holds the *rendered* tray ids (stale ids dropped), kept index-aligned with the
  // tiles so the drag handlers splice the same array the user sees. Assigned below
  // once `trayIds` is computed.
  const equippedIdsRef = useRef<string[]>(equippedIds);

  // Root of this sheet's inventory — scope sticky-offset queries here, NOT
  // document-wide, since multiple sheets can be open at once.
  // Cheap structural signature of the inventory data (ids + nesting + order + sort key),
  // computed without sorting. Groups are rebuilt from props only when this changes.
  // Drag no longer mutates groups mid-gesture, so there's nothing to fight here.
  let dataSig = `${sort.key}:${sort.dir}`;
  for (const it of inventory.items) {
    dataSig += `|${it.id},${it.sort}${it.isContainer ? `[${it.children.map((c) => `${c.id},${c.sort}`).join("/")}]` : ""}`;
  }
  useEffect(() => {
    setGroups(buildGroups(inventory.items, sort));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSig]);

  // Rebuild the tray order from props whenever the equipped set or its order
  // (equippedSort) changes. `inventory.equipped` is already sorted by the VM.
  const equipSig = inventory.equipped
    .map((it) => `${it.id},${it.equippedSort}`)
    .join("|");
  useEffect(() => {
    setEquippedIds(inventory.equipped.map((it) => it.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipSig]);

  // Persist a freshly-mutated groups map: renumber each group's sorts (i+1)*100 and
  // emit only the items whose order or container actually changed. Same diff the old
  // drag-end used — only the gesture that produces `next` is different now.
  function persist(next: Groups) {
    const origin = originContainers(inventory.items);
    const curOrder = new Map(
      [...byId.values()].map((it) => [it.id, it.sort] as const),
    );
    const reorder: { id: string; sort: number }[] = [];
    for (const [key, ids] of Object.entries(next)) {
      const containerId = groupContainerId(key);
      ids.forEach((id, i) => {
        const order = (i + 1) * 100;
        if (curOrder.get(id) !== order) reorder.push({ id, sort: order });
        if ((origin.get(id) ?? null) !== containerId) onNest(id, containerId);
      });
    }
    if (reorder.length) onReorder(reorder);
  }

  // Persist the tray order: renumber (i+1)*100, emit only changed items.
  function persistEquipped(next: string[]) {
    const cur = new Map(
      inventory.equipped.map((it) => [it.id, it.equippedSort] as const),
    );
    const updates: { id: string; sort: number }[] = [];
    next.forEach((id, i) => {
      const order = (i + 1) * 100;
      if (cur.get(id) !== order) updates.push({ id, sort: order });
    });
    if (updates.length) onReorderEquipped(updates);
  }

  // Commit handlers for the drag hook. Each mutates the local order immediately
  // (so the dropped item re-renders in place at once) then persists the diff.
  const dnd = useDragReorder({
    onReorder: ({ group, from, to }) => {
      // Tray tiles reorder in their own group → persist the equippedOrder flag.
      if (group === EQUIPPED) {
        const ids = [...equippedIdsRef.current];
        const [moved] = ids.splice(from, 1);
        if (moved === undefined) return;
        ids.splice(to, 0, moved);
        setEquippedIds(ids);
        persistEquipped(ids);
        return;
      }
      const ids = [...(groupsRef.current[group] ?? [])];
      const [moved] = ids.splice(from, 1);
      if (moved === undefined) return;
      ids.splice(to, 0, moved);
      const next = { ...groupsRef.current, [group]: ids };
      setGroups(next);
      persist(next);
    },
    onNest: ({ fromGroup, from, zone }) => {
      const src = [...(groupsRef.current[fromGroup] ?? [])];
      const [moved] = src.splice(from, 1);
      if (moved === undefined) return;
      const destKey = zone == null ? ROOT : gkey(zone);
      if (destKey === fromGroup) return; // already there
      const dest = [...(groupsRef.current[destKey] ?? [])];
      // Dropping onto a dropzone (nest into a container, or un-nest to root)
      // always lands the item at the end of the destination group.
      dest.push(moved);
      const next = { ...groupsRef.current, [fromGroup]: src, [destKey]: dest };
      setGroups(next);
      persist(next);
    },
  });

  // Click a header: bake that sorted order into the `order` flag (the manual
  // baseline) and stay in manual mode so later drags stick and override it.
  // First click on a header → its natural direction; an immediate repeat click on
  // the SAME header flips asc↔desc. (A drag in between doesn't change `lastSort`,
  // so re-clicking the same header still flips — acceptable.)
  const onSort = (key: InventorySortKey) => {
    const dir: SortDir =
      lastSort?.key === key && lastSort.dir === SORT_DEFAULT_DIR[key]
        ? SORT_DEFAULT_DIR[key] === "asc"
          ? "desc"
          : "asc"
        : SORT_DEFAULT_DIR[key];
    const next = buildGroups(inventory.items, { key, dir });
    setGroups(next);
    persist(next);
    setLastSort({ key, dir });
  };

  const toggleCollapse = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortedTop = sortInventory(inventory.items, sort.key, sort.dir);
  // Tray uses its own order (equippedIds), NOT the All-Items sort. Drop stale ids
  // (item just unequipped/deleted) so tile indices match the array the drag
  // handlers splice — keep `trayItems`/`trayIds` index-aligned.
  const trayItems = equippedIds
    .map((id) => byId.get(id))
    .filter((it): it is InventoryItemVM => !!it);
  const trayIds = trayItems.map((it) => it.id);
  equippedIdsRef.current = trayIds; // drag handlers splice the rendered order

  const rootIds = groups[ROOT] ?? [];
  const equippedDragActive = dnd.drag?.group === EQUIPPED; // a tray tile is mid-drag

  return (
    <section className="rs-inv">
      <div
        className={cx("rs-inv-head", encumbrance.enabled && "enc-rule")}
        // the header underline doubles as the encumbrance load bar (see .enc-rule)
        style={
          encumbrance.enabled
            ? ({ "--enc-pct": `${Math.round(encumbrance.pct * 100)}%` } as React.CSSProperties)
            : undefined
        }
      >
        <SectionTitle>Inventory</SectionTitle>
        {encumbrance.enabled && <EncumbranceReadout e={encumbrance} />}
      </div>
      <WealthSection coins={coins} onSetCoin={onSetCoin} onOpen={onOpen} onContext={openMenu} />

      {/* Equipped tray + All-Items header pin together as one opaque block so the
          two never separate into a see-through gap (no JS height measuring). */}
      <div className="rs-inv-stickyhead">
        {inventory.equipped.length > 0 && (
          <div className="rs-inv-sec rs-inv-sec--equipped">
            <SectionCount title="Equipped items" items={inventory.equipped} />
            <EquippedTray
              items={trayItems}
              dnd={dnd}
              itemDragData={itemDragData}
              onOpen={onOpen}
              onContext={openMenu}
              // Equip-by-drop only for an All-Items row drag (not a tray-internal reorder).
              equipDropActive={dnd.drag != null && dnd.drag.group !== EQUIPPED}
              onEquipDrop={() => {
                const d = dnd.drag;
                const id = d
                  ? (groupsRef.current[d.group] ?? [])[d.idx]
                  : undefined;
                const it = id ? byId.get(id) : undefined;
                // Only equip an equippable, not-yet-equipped item (don't toggle off).
                if (id && it && it.equipped === false) onEquip(id);
                dnd.clear();
              }}
            />
          </div>
        )}
        <SectionCount title="All Items" items={sortedTop} />
      </div>

      <section className="rs-inv-sec rs-inv-sec--carried">
        <div
          className={cx(
            "rs-inv-list",
            equippedDragActive && listOver && "is-unequip-target",
          )}
          // Drag a tray tile down into the list → unequip it (the row already exists
          // here; this just flips the equipped flag). Rows themselves reject the
          // EQUIPPED group, so this wrapper is the sole handler for that drag.
          onDragOver={
            equippedDragActive
              ? (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setListOver(true);
                }
              : undefined
          }
          onDragLeave={
            equippedDragActive
              ? (e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node))
                    setListOver(false);
                }
              : undefined
          }
          onDrop={
            equippedDragActive
              ? (e) => {
                  e.preventDefault();
                  const d = dnd.drag;
                  const id = d ? equippedIdsRef.current[d.idx] : undefined;
                  if (id) onEquip(id); // toggles equipped off
                  setListOver(false);
                  dnd.clear();
                }
              : undefined
          }
        >
          <SortHeaderRow
            sort={lastSort ?? { key: "manual", dir: "asc" }}
            onSort={onSort}
          />
          {rootIds.map((id, index) => {
            const item = byId.get(id);
            if (!item) return null;
            return item.isContainer ? (
              <ContainerRow
                key={id}
                item={item}
                index={index}
                childIds={groups[gkey(id)] ?? []}
                byId={byId}
                collapsed={!expanded.has(id)}
                dnd={dnd}
                itemDragData={itemDragData}
                onToggle={toggleCollapse}
                onEquip={onEquip}
                onOpen={onOpen}
                onContext={openMenu}
              />
            ) : (
              <SortableRow
                key={id}
                item={item}
                index={index}
                group={ROOT}
                depth={0}
                dnd={dnd}
                itemDragData={itemDragData}
                onEquip={onEquip}
                onOpen={onOpen}
                onContext={openMenu}
              />
            );
          })}
        </div>
      </section>

      {menu && (
        <ItemContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onOpen={onOpen}
          onEquip={onEquip}
          onConsume={onConsume}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}
