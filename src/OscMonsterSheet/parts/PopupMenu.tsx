import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { Menu, MenuItem, MenuLabel } from "@ui/Menu";
import { useDismiss } from "@ui/useDismiss";

export type PopupMenuEntry = {
  label: string;
  icon?: string;
  danger?: boolean;
  onSelect: () => void;
};

export type PopupMenuState = {
  x: number;
  y: number;
  title?: string;
  entries: PopupMenuEntry[];
};

export function PopupMenu({
  menu,
  onClose,
}: {
  menu: PopupMenuState;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, onClose, { closeOnBlur: true });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const anchor = { getBoundingClientRect: () => new DOMRect(menu.x, menu.y) };
    void computePosition(anchor, element, {
      strategy: "fixed",
      placement: "bottom-start",
      middleware: [flip(), shift({ padding: 8 })],
    }).then(({ x, y }) =>
      Object.assign(element.style, { left: `${x}px`, top: `${y}px` }),
    );
    element.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [menu.x, menu.y]);

  const select = (entry: PopupMenuEntry) => {
    onClose();
    entry.onSelect();
  };

  return (
    <div
      ref={ref}
      className="osc-monster-popup"
      role="menu"
      aria-label={menu.title}
    >
      <Menu>
        {menu.title && <MenuLabel>{menu.title}</MenuLabel>}
        {menu.entries.map((entry) => (
          <MenuItem
            key={entry.label}
            tabIndex={0}
            danger={entry.danger}
            icon={
              entry.icon ? (
                <i className={`fa-solid ${entry.icon}`} aria-hidden="true" />
              ) : undefined
            }
            onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
              if (event.button !== 0) return;
              event.preventDefault();
              select(entry);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select(entry);
              }
            }}
          >
            {entry.label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
