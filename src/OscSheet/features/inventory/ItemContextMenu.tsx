// Right-click context menu for an inventory item (View / Send / Unequip /
// Consume / Delete), anchored at the cursor and kept on-screen.
import { useLayoutEffect, useMemo, useRef } from "react";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { FEATURES } from "@app/features";
import { collectItemMenuEntries } from "@domain/extensions";
import type { OSEActor, OseItem } from "@domain/types";
import type { MenuState } from "@features/inventory/types";
import { useDismiss } from "@ui/useDismiss";

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
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose, { closeOnBlur: true });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cursor = { getBoundingClientRect: () => new DOMRect(menu.x, menu.y) };
    void computePosition(cursor, el, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [flip(), shift({ padding: 8 })],
    }).then(({ x, y }) =>
      Object.assign(el.style, { left: `${x}px`, top: `${y}px` }),
    );
  }, [menu.x, menu.y]);

  const moduleEntries = useMemo(
    () => collectItemMenuEntries(actor, doc, canEdit),
    [actor, doc, canEdit],
  );

  return (
    <div
      ref={ref}
      className="osc-ctx"
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
      {moduleEntries.length > 0 && doc && (
        <div className="osc-ctx-ext u-mt-1 u-pt-1">
          {moduleEntries.map((entry, i) => (
            <button
              key={`${entry.label}-${i}`}
              type="button"
              className={`osc-ctx-item${entry.danger ? " is-danger" : ""}`}
              disabled={entry.disabled === true}
              onClick={() => {
                entry.onClick(doc, actor);
                onClose();
              }}
            >
              <i
                className={entry.icon ?? "fa-solid fa-puzzle-piece"}
                aria-hidden="true"
              />{" "}
              {entry.label}
            </button>
          ))}
        </div>
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
