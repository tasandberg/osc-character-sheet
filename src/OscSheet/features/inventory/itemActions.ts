import { FEATURES } from "@app/features";
import type { InventoryItemVM } from "@domain/vm-types";
import type { CtxItem } from "@features/inventory/types";
import type { InventoryActions } from "@features/inventory/useInventoryActions";

export type ItemActionCtx = {
  item: CtxItem;
  /** The full VM node, when the item has one. Coins are real Foundry items but
   *  aren't VM nodes, so they get a reduced menu. */
  vm: InventoryItemVM | null;
  canEdit: boolean;
  ops: InventoryActions;
  sendItem: ((item: InventoryItemVM) => void) | null;
};

export type ItemAction = {
  key: string;
  label: string;
  icon: string;
  danger?: boolean;
  show: (c: ItemActionCtx) => boolean;
  run: (c: ItemActionCtx) => void;
};

export const ITEM_ACTIONS: ItemAction[] = [
  {
    key: "view",
    label: "View Item",
    icon: "fa-solid fa-eye",
    show: () => true,
    run: (c) => c.ops.onOpen(c.item.id),
  },
  {
    key: "send",
    label: "Send Item",
    icon: "fa-solid fa-gift",
    show: (c) => FEATURES.sendItem && !!c.sendItem && !!c.vm,
    run: (c) => {
      if (c.vm) c.sendItem?.(c.vm);
    },
  },
  {
    key: "unequip",
    label: "Unequip",
    icon: "fa-solid fa-hand",
    show: (c) => c.canEdit && c.item.equipped === true,
    run: (c) => c.ops.onEquip(c.item.id),
  },
  {
    key: "consume",
    label: "Consume one",
    icon: "fa-solid fa-circle-minus",
    show: (c) => c.canEdit && c.item.quantity != null,
    run: (c) => c.ops.onConsume(c.item.id),
  },
  {
    key: "delete",
    label: "Delete Item",
    icon: "fa-solid fa-trash",
    danger: true,
    show: (c) => c.canEdit,
    run: (c) => c.ops.onDelete(c.item.id),
  },
];
