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
//
// This `index.tsx` IS the `@features/inventory` folder module (the root component).
// Sub-components and helpers live in sibling files; there is no separate barrel
// `index.ts` (a folder can't have both index.ts and index.tsx).
import { useEffect, useRef, useState } from "react";
import type {
  InventoryItemVM,
  InventorySortKey,
  SortDir,
} from "@domain/vm-types";
import { encBarStops, sortInventory, SORT_DEFAULT_DIR } from "@features/inventory/inventory";
import { useDragReorder } from "@features/inventory/useDragReorder";
import { buildItemMacroDragData } from "@features/inventory/dragToMacro";
import { WealthSection } from "@features/inventory/WealthSection";
import { SendItemModal } from "@features/inventory/SendItemModal";
import {
  selectSendTargets,
  isGmConnected,
} from "@features/inventory/sendTargets";
import { EquippedTray } from "@features/inventory/EquippedTray";
import { ItemContextMenu } from "@features/inventory/ItemContextMenu";
import { EncumbranceReadout } from "@features/inventory/EncumbranceReadout";
import { SectionCount } from "@features/inventory/SectionCount";
import { SortableRow } from "@features/inventory/rows/SortableRow";
import { ContainerRow } from "@features/inventory/rows/ContainerRow";
import { SortHeaderRow } from "@features/inventory/rows/SortHeaderRow";
import {
  buildGroups,
  indexById,
  originContainers,
  flattenItems,
  ROOT,
  EQUIPPED,
  gkey,
  groupContainerId,
} from "@features/inventory/groups";
import type {
  Props,
  Groups,
  SortState,
  MenuState,
  OnContext,
  ItemDragData,
} from "@features/inventory/types";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { cx } from "@ui/cx";
import type { OseItem } from "@domain/types";

export function InventoryView({
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
  onSend,
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
  // The item whose Send dialog is open (a full inventory VM node), null = closed.
  const [sending, setSending] = useState<InventoryItemVM | null>(null);

  // Foundry items by id — source for the hotbar drag payload. Dragging a row onto
  // the macro bar creates an item macro (OSE's hotbarDrop hook), like the stock sheet.
  const { actor, items, canEdit } = useOscSheetContext();
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
  // Open the Send dialog for a list item (coins aren't in the VM → not sendable).
  const openSend = (id: string) => {
    const it = byId.get(id);
    if (it) setSending(it);
  };
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
    // Read-only sheets (non-owners) get no drag-reorder / drag-to-nest / equip-by-drop.
    enabled: canEdit,
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
    <section className="osc-inv">
      <div
        className={cx("osc-inv-head", encumbrance.enabled && "enc-rule")}
        // the header underline doubles as the encumbrance load bar (see .enc-rule);
        // --enc-stops cuts the colour at the system's real tier thresholds
        style={
          encumbrance.enabled
            ? ({
                "--enc-pct": `${Math.round(encumbrance.pct * 100)}%`,
                "--enc-stops": encBarStops(encumbrance),
              } as React.CSSProperties)
            : undefined
        }
      >
        <SectionTitle>Inventory</SectionTitle>
        {encumbrance.enabled && <EncumbranceReadout e={encumbrance} />}
      </div>
      <WealthSection coins={coins} onSetCoin={onSetCoin} onOpen={onOpen} onContext={openMenu} />

      {/* Equipped tray + All-Items header pin together as one opaque block so the
          two never separate into a see-through gap (no JS height measuring). */}
      <div className="osc-inv-stickyhead">
        {inventory.equipped.length > 0 && (
          <div className="osc-inv-sec osc-inv-sec--equipped">
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

      <section className="osc-inv-sec osc-inv-sec--carried">
        <div
          className={cx(
            "osc-inv-list",
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
          canEdit={canEdit}
          onClose={() => setMenu(null)}
          onOpen={onOpen}
          onEquip={onEquip}
          onConsume={onConsume}
          onDelete={onDelete}
          onSend={
            canEdit && byId.has(menu.item.id) && isGmConnected()
              ? openSend
              : undefined
          }
        />
      )}

      {sending &&
        (() => {
          const { targets, gmOnline } = selectSendTargets(actor);
          const contentCount = flattenItems(sending.children).length;
          return (
            <SendItemModal
              open
              item={sending}
              contentCount={contentCount}
              targets={targets}
              gmOnline={gmOnline}
              onClose={() => setSending(null)}
              onSend={(target, qty) => {
                onSend(sending.id, target, qty);
                setSending(null);
              }}
            />
          );
        })()}
    </section>
  );
}
