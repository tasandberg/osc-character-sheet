import type { OseItem } from "@domain/types";

export function showDeleteDialog(item: OseItem, callBack?: () => void) {
  foundry.applications.api.DialogV2.confirm({
    window: {
      title: game.i18n.localize("OSE.dialog.deleteItem"),
    },
    content: game.i18n.format("OSE.dialog.confirmDeleteItem", {
      name: item.name,
    }),
    yes: {
      default: false,
      callback: () => {
        if (callBack) callBack();
        else item.delete();
      },
    },
    defaultYes: false,
  });
}

export function showConfirmDialog({
  title,
  message,
  callback,
}: {
  title: string;
  message: string;
  callback: () => Promise<void> | void;
}) {
  return foundry.applications.api.DialogV2.confirm({
    window: {
      title: title,
    },
    content: message,
    yes: {
      default: false,
      callback,
    },
    defaultYes: false,
  });
}

export async function showFormDialog({
  title,
  content,
  submitLabel,
  callback,
}: {
  title: string;
  content: string;
  callback: (e: Event, button: HTMLButtonElement) => Promise<void> | void;
  submitLabel?: string;
}) {
  const guess = await foundry.applications.api.DialogV2.prompt({
    window: {
      title: title,
    },
    content: content,
    cancelLabel: "Cancel",
    ok: {
      label: submitLabel || "Submit",
      callback,
    },
    cancel: {
      label: "Cancel",
    },
  });
  return guess;
}
