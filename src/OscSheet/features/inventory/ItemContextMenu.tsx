// Right-click context menu for an inventory item (View / Send / Unequip /
// Consume / Delete), anchored at the cursor and kept on-screen.
import { useEffect } from "react";
import { FEATURES } from "@app/features";
import type { MenuState } from "@features/inventory/types";

export function ItemContextMenu({
  menu,
  canEdit,
  onClose,
  onOpen,
  onEquip,
  onConsume,
  onDelete,
  onSend,
}: {
  menu: MenuState;
  /** Whether the current user owns this actor. Non-owners get view-only. */
  canEdit: boolean;
  onClose: () => void;
  onOpen: (id: string) => void;
  onEquip: (id: string) => void;
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
  /** Open the Send dialog for this item. Absent → item can't be sent (e.g. coins). */
  onSend?: (id: string) => void;
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
      className="osc-ctx"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="osc-ctx-title">{menu.item.name}</div>
      <button
        type="button"
        className="osc-ctx-item"
        onClick={() => {
          onOpen(menu.item.id);
          onClose();
        }}
      >
        <i className="fa-solid fa-eye" aria-hidden="true" /> View Item
      </button>
      {FEATURES.sendItem && onSend && (
        <button
          type="button"
          className="osc-ctx-item"
          onClick={() => {
            onSend(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-gift" aria-hidden="true" /> Send Item
        </button>
      )}
      {canEdit && menu.item.equipped === true && (
        <button
          type="button"
          className="osc-ctx-item"
          onClick={() => {
            onEquip(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-hand" aria-hidden="true" /> Unequip
        </button>
      )}
      {canEdit && menu.item.quantity != null && (
        <button
          type="button"
          className="osc-ctx-item"
          onClick={() => {
            onConsume(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-circle-minus" aria-hidden="true" /> Consume
          one
        </button>
      )}
      {canEdit && (
        <button
          type="button"
          className="osc-ctx-item is-danger"
          onClick={() => {
            onDelete(menu.item.id);
            onClose();
          }}
        >
          <i className="fa-solid fa-trash" aria-hidden="true" /> Delete Item
        </button>
      )}
    </div>
  );
}
