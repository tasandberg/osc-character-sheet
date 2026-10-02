// Right-click context menu for an inventory item (View / Send / Unequip /
// Consume / Delete), anchored at the cursor and kept on-screen.
import { useMemo } from "react";
import { FEATURES } from "@app/features";
import { collectItemMenuEntries } from "@domain/extensions";
import type { OSEActor, OseItem } from "@domain/types";
import type { MenuState } from "@features/inventory/types";
import { ContextMenu, type ContextMenuEntry } from "@ui/ContextMenu";

export function ItemContextMenu({
  menu,
  actor,
  doc,
  canEdit,
  onClose,
  onOpen,
  onEquip,
  onConsume,
  onDelete,
  onSend,
}: {
  menu: MenuState;
  actor: OSEActor;
  /** The Foundry item behind this row. Absent → module entries are skipped. */
  doc?: OseItem;
  /** Global edit gate (see useOscSheetContext().canEdit). Non-owners get a
   *  view-only menu — only "View Item" remains. */
  canEdit: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onEquip: (id: string) => void;
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
  /** Open the Send dialog for this item. Absent → item can't be sent (e.g. coins). */
  onSend?: (id: string) => void;
}) {
  const moduleEntries = useMemo(
    () => collectItemMenuEntries(actor, doc, canEdit),
    [actor, doc, canEdit],
  );
  const id = menu.item.id;

  const entries: ContextMenuEntry[] = [
    { label: "View Item", icon: "fa-solid fa-eye", onSelect: () => onOpen(id) },
    ...(FEATURES.sendItem && onSend
      ? [
          {
            label: "Send Item",
            icon: "fa-solid fa-gift",
            onSelect: () => onSend(id),
          },
        ]
      : []),
    ...(canEdit && menu.item.equipped === true
      ? [
          {
            label: "Unequip",
            icon: "fa-solid fa-hand",
            onSelect: () => onEquip(id),
          },
        ]
      : []),
    ...(canEdit && menu.item.quantity != null
      ? [
          {
            label: "Consume one",
            icon: "fa-solid fa-circle-minus",
            onSelect: () => onConsume(id),
          },
        ]
      : []),
    ...moduleEntries.map((entry, index) => ({
      label: entry.label,
      icon: entry.icon ?? "fa-solid fa-puzzle-piece",
      danger: entry.danger,
      disabled: entry.disabled === true,
      separator: index === 0,
      onSelect: () => doc && entry.onClick(doc, actor),
    })),
    ...(canEdit
      ? [
          {
            label: "Delete Item",
            icon: "fa-solid fa-trash",
            danger: true,
            onSelect: () => onDelete(id),
          },
        ]
      : []),
  ];

  return (
    <ContextMenu
      anchor={{ x: menu.x, y: menu.y }}
      title={menu.item.name}
      entries={entries}
      onClose={onClose}
    />
  );
}
