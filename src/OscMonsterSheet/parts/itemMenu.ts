import type { MouseEvent } from "react";
import { showDeleteDialog } from "@domain/foundryDialogs";
import type { OseItem } from "@domain/types";
import type { MonsterItem } from "../types";
import type { PopupMenuState } from "./PopupMenu";

export function itemMenu(
  item: MonsterItem,
  canEdit: boolean,
  event: MouseEvent,
): PopupMenuState {
  return {
    x: event.clientX,
    y: event.clientY,
    title: item.name,
    entries: [
      {
        label: canEdit ? "Edit" : "View",
        icon: canEdit ? "fa-pen-to-square" : "fa-eye",
        onSelect: () => item.sheet?.render(true),
      },
      {
        label: "Show in chat",
        icon: "fa-comment",
        onSelect: () => void item.show(),
      },
      ...(canEdit
        ? [
            {
              label: "Delete",
              icon: "fa-trash",
              danger: true,
              onSelect: () => showDeleteDialog(item as unknown as OseItem),
            },
          ]
        : []),
    ],
  };
}
