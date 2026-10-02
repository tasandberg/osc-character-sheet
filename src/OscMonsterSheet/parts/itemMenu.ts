import { showDeleteDialog } from "@domain/foundryDialogs";
import type { OseItem } from "@domain/types";
import type { MonsterItem } from "../types";
import type { ContextMenuState } from "@ui/ContextMenu";
import type { Anchor } from "@ui/useFixedAnchor";

export function itemMenu(
  item: MonsterItem,
  canEdit: boolean,
  anchor: Anchor,
): ContextMenuState {
  return {
    anchor,
    title: item.name,
    entries: [
      {
        label: canEdit ? "Edit" : "View",
        icon: canEdit ? "fa-solid fa-pen-to-square" : "fa-solid fa-eye",
        onSelect: () => item.sheet?.render(true),
      },
      {
        label: "Show in chat",
        icon: "fa-solid fa-comment",
        onSelect: () => void item.show(),
      },
      ...(canEdit
        ? [
            {
              label: "Delete",
              icon: "fa-solid fa-trash",
              danger: true,
              onSelect: () => showDeleteDialog(item as unknown as OseItem),
            },
          ]
        : []),
    ],
  };
}
