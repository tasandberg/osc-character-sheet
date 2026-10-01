import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { Menu, MenuItem, MenuLabel } from "@ui/Menu";
import { useDismiss } from "@ui/useDismiss";

export type PopupMenuEntry = {
  label: string;
  icon?: string;
  danger?: boolean;
  checked?: boolean;
  onSelect?: () => void;
  entries?: PopupMenuEntry[];
};

export type PopupMenuState = {
  x: number;
  y: number;
  title?: string;
  entries: PopupMenuEntry[];
};

const iconFor = (entry: PopupMenuEntry) => {
  const icon = entry.checked ? "fa-check" : entry.icon;
  if (!icon && entry.checked === undefined) return undefined;
  return icon ? (
    <i className={`fa-solid ${icon}`} aria-hidden="true" />
  ) : (
    <span aria-hidden="true" />
  );
};

function MenuEntries({
  entries,
  onSelect,
}: {
  entries: PopupMenuEntry[];
  onSelect: (entry: PopupMenuEntry) => void;
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const activate = (entry: PopupMenuEntry) => {
    if (entry.entries) setOpenLabel(entry.label);
    else onSelect(entry);
  };

  return entries.map((entry) => {
    const open = openLabel === entry.label;
    const item = (
      <MenuItem
        key={entry.label}
        tabIndex={0}
        danger={entry.danger}
        role={entry.checked === undefined ? "menuitem" : "menuitemradio"}
        aria-checked={entry.checked}
        aria-haspopup={entry.entries ? "menu" : undefined}
        aria-expanded={entry.entries ? open : undefined}
        icon={iconFor(entry)}
        shortcut={entry.entries ? "›" : undefined}
        onPointerEnter={() => setOpenLabel(entry.entries ? entry.label : null)}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          if (event.button !== 0) return;
          event.preventDefault();
          activate(entry);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (
            event.key === "Enter" ||
            event.key === " " ||
            (event.key === "ArrowRight" && entry.entries)
          ) {
            event.preventDefault();
            activate(entry);
          }
        }}
      >
        {entry.label}
      </MenuItem>
    );
    if (!entry.entries) return item;
    return (
      <div key={entry.label} className="osc-monster-submenu-anchor">
        {item}
        {open && (
          <div
            className="osc-monster-submenu"
            role="menu"
            aria-label={entry.label}
          >
            <Menu>
              <MenuEntries entries={entry.entries} onSelect={onSelect} />
            </Menu>
          </div>
        )}
      </div>
    );
  });
}

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
    element.querySelector<HTMLElement>("[role^=menuitem]")?.focus();
  }, [menu.x, menu.y]);

  const select = (entry: PopupMenuEntry) => {
    onClose();
    entry.onSelect?.();
  };

  return (
    <div
      ref={ref}
      className="osc-monster-popup"
      role="menu"
      aria-label={menu.title}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <Menu>
        {menu.title && <MenuLabel>{menu.title}</MenuLabel>}
        <MenuEntries entries={menu.entries} onSelect={select} />
      </Menu>
    </div>
  );
}
