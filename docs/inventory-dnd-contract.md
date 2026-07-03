# Inventory DnD — team contract (locked)

Branch `inventory-tab`. Three workstreams build against this interface so the worktrees
integrate cleanly. **Do not change shared signatures without telling the lead.**

## Behaviour
- **Flat list**, no fixed category sections; **each row shows its category** label.
- **Sort control**: Category (default) · Name · Weight. Lives as local state in the component.
  - Category → by `categoryRank`, then `sort` (manual order, asc), then `name`.
  - Name → `name` localeCompare.
  - Weight → numeric **descending** (heaviest first).
  - Applies to top-level list **and** to each container's children.
- **Containers** (item type `container`) render as **collapsible** rows; expanding shows their
  nested children (items whose `system.containerId === container.id`). Collapse state = local UI
  (a `Set<containerId>`), not persisted.
- **Drag** (dnd-kit, already a dep):
  - Drop an item onto a container row → **nest**: `onNest(itemId, containerId)`.
  - Drag a nested item out to top level → `onNest(itemId, null)`.
  - Reorder → recompute sequential `sort` for the affected list → `onReorder([{id, sort}])`.
- **Coins** (currency / pp–gp–ep–sp–cp treasure) stay OUT of the list — already handled by the
  coin editor + `selectCoins`. Keep the existing grid view working (unchanged for now).

## VM types (`viewModels/types.ts`) — owner: inv-vm
```ts
export type InventorySortKey = "category" | "name" | "weight";

export interface InventoryItemVM {
  id: string;
  name: string;
  img: string;
  category: string;        // display: "Weapon" | "Armour" | "Gear" | "Container"
  categoryRank: number;    // weapon 0, armour 1, gear 2, container 3
  meta: string;            // "1d4 · melee" for weapons, else ""
  monogram: string;        // 2-letter card monogram
  weight: number;
  sort: number;            // foundry item.sort (manual order)
  equipped: boolean | null;// null = not equippable
  quantity: { value: number; max: number } | null;
  isContainer: boolean;
  children: InventoryItemVM[]; // [] unless container; nested by containerId
}

export interface InventoryVM {
  items: InventoryItemVM[];  // top-level only (no/empty containerId); containers carry children
  count: number;
}
```

## VM API (`viewModels/inventory.ts`) — owner: inv-vm
- `selectInventory(items: OseItem[]): InventoryVM` — build the tree; exclude coins
  (`isCurrency || coinDenom(name)`); resolve container children by `system.containerId`.
- `sortInventory(list: InventoryItemVM[], key: InventorySortKey): InventoryItemVM[]` — pure,
  recurses into `children`. (Comparator per "Behaviour" above.)
- Keep existing `selectCoins`, `selectEncumbrance`, `coinDenom` exports.

## InventoryView props (`components/inventory/InventoryView.tsx`) — owner: inv-dnd
```ts
type Props = {
  inventory: InventoryVM;
  encumbrance: EncumbranceVM;
  coins: CoinVM[];
  onSetCoin: (id: string, value: number) => void;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onReorder: (updates: { id: string; sort: number }[]) => void;
  onNest: (itemId: string, containerId: string | null) => void;
};
```
Component owns: `sortKey` state (default "category"), collapse `Set<string>`, dnd-kit
`DndContext`/`SortableContext`/`useSortable`, drag overlay. Render order =
`sortInventory(inventory.items, sortKey)`.

## CSS class names (`styles/inventory.scss`) — owner: inv-style
Qualify everything under `.osc-inv` (beats the `all: unset` reset, 0,1,1).
- `.osc-inv-sort` — sort-by control (in `.osc-inv-head`)
- `.osc-inv-row` (exists) + modifiers `.is-container`, `.is-dragging`, `.is-drop-target`
- `.osc-inv-cat` is the existing section label — use a new `.osc-inv-rowcat` for the per-row category badge
- `.osc-inv-children` — nested list; indentation via `--osc-inv-depth` custom property
- `.osc-inv-collapse` — chevron button; `.collapsed` rotates it
- `.osc-inv-drag` — drag handle

## SheetShell wiring — owner: inv-style
```ts
const onReorder = (u: { id: string; sort: number }[]) =>
  void actor.updateEmbeddedDocuments("Item", u.map((x) => ({ _id: x.id, sort: x.sort })));
const onNest = (itemId: string, containerId: string | null) =>
  void actor.updateEmbeddedDocuments("Item", [{ _id: itemId, "system.containerId": containerId ?? "" }]);
```
Pass `inventory={selectInventory(invItems)}`, `onReorder`, `onNest` (plus existing props).

## Integration
Each agent commits to its own worktree branch and reports it. Lead merges vm → dnd → style onto
`inventory-tab`, reconciles, runs `pnpm build && pnpm lint && pnpm test && pnpm exec ladle build`.
