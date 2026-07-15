// Shared types for the inventory view and its sub-components.
import type {
  InventoryVM,
  EncumbranceVM,
  InventoryItemVM,
  CoinVM,
  InventorySortKey,
  SortDir,
} from "@domain/vm-types";
import { useDragReorder } from "@features/inventory/useDragReorder";
import type { SendTargetVM } from "@features/inventory/sendTargets";
import type { InventoryItemType } from "@features/inventory/createItem";

export type Dnd = ReturnType<typeof useDragReorder>;

/** Per-row Foundry drag payload → drop onto the macro hotbar. undefined = row isn't
 *  a draggable-to-macro item (default `<group>:<idx>` reorder payload is used). */
export type ItemDragData = (id: string) => string | undefined;

export type Ops = {
  /** Create a new item of the given OSE type and open its sheet to fill in. */
  onCreate: (type: InventoryItemType) => void;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
  onReorder: (updates: { id: string; sort: number }[]) => void;
  /** Persist the equipped tray's own order (writes the `equippedOrder` flag). */
  onReorderEquipped: (updates: { id: string; sort: number }[]) => void;
  onNest: (itemId: string, containerId: string | null) => void;
  /** Transfer an item (optionally a stack split) to another actor. */
  onSend: (itemId: string, target: SendTargetVM, qty: number) => void;
};

/** Right-click context-menu target: which item, and where to anchor the menu.
 *  Coins are real Foundry items too, so they reuse this — only the fields the menu
 *  reads are required (a coin passes equipped/quantity null → just View + Delete). */
export type CtxItem = Pick<
  InventoryItemVM,
  "id" | "name" | "equipped" | "quantity"
>;
export type MenuState = { item: CtxItem; x: number; y: number };
export type OnContext = (e: React.MouseEvent, item: CtxItem) => void;

export type Props = {
  inventory: InventoryVM;
  encumbrance: EncumbranceVM;
  coins: CoinVM[];
  onSetCoin: (id: string, value: number) => void;
} & Ops;

export type SortState = { key: InventorySortKey; dir: SortDir };
export type Groups = Record<string, string[]>;
