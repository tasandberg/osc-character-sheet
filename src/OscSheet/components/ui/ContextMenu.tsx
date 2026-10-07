import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Menu, MenuItem, MenuLabel, MenuSep } from "./Menu";
import { PatternPip } from "./PatternPip";
import type { Placement } from "@floating-ui/dom";
import { useFixedAnchor, type Anchor } from "./useFixedAnchor";

export type ContextMenuEntry = {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  swatch?: string;
  separator?: boolean;
  onSelect?: () => void;
  entries?: ContextMenuEntry[];
};

export type ContextMenuState = {
  anchor: Anchor;
  placement?: Placement;
  title?: string;
  entries: ContextMenuEntry[];
};

const iconFor = (entry: ContextMenuEntry) => {
  if (entry.swatch) return <PatternPip pattern={entry.swatch} />;
  const icon = entry.checked ? "fa-solid fa-check" : entry.icon;
  if (!icon && entry.checked === undefined) return undefined;
  return icon ? (
    <i className={icon} aria-hidden="true" />
  ) : (
    <span aria-hidden="true" />
  );
};

function Entries({
  entries,
  onSelect,
}: {
  entries: ContextMenuEntry[];
  onSelect: (entry: ContextMenuEntry) => void;
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const activate = (entry: ContextMenuEntry) => {
    if (entry.disabled) return;
    if (entry.entries) setOpenLabel(entry.label);
    else onSelect(entry);
  };

  return entries.map((entry, index) => {
    const open = openLabel === entry.label;
    const key = `${entry.label}-${index}`;
    const item = (
      <MenuItem
        key={key}
        tabIndex={0}
        danger={entry.danger}
        role={entry.checked === undefined ? "menuitem" : "menuitemradio"}
        aria-checked={entry.checked}
        aria-disabled={entry.disabled || undefined}
        aria-haspopup={entry.entries ? "menu" : undefined}
        aria-expanded={entry.entries ? open : undefined}
        icon={iconFor(entry)}
        shortcut={
          entry.entries ? "›" : entry.swatch && entry.checked ? "✓" : undefined
        }
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
    const row = entry.entries ? (
      <div key={key} className="menu-submenu-anchor">
        {item}
        {open && (
          <div className="menu-submenu" role="menu" aria-label={entry.label}>
            <Menu>
              <Entries entries={entry.entries} onSelect={onSelect} />
            </Menu>
          </div>
        )}
      </div>
    ) : (
      item
    );
    if (!entry.separator) return row;
    return [<MenuSep key={`${key}-sep`} />, row];
  });
}

export function ContextMenu({
  anchor,
  placement,
  title,
  entries,
  onClose,
}: ContextMenuState & { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFixedAnchor(ref, anchor, {
    placement,
    onDismiss: onClose,
    closeOnBlur: true,
  });

  useLayoutEffect(() => {
    ref.current?.querySelector<HTMLElement>("[role^=menuitem]")?.focus();
  }, [anchor.x, anchor.y]);

  const select = (entry: ContextMenuEntry) => {
    onClose();
    entry.onSelect?.();
  };

  return (
    <div
      ref={ref}
      className="context-menu"
      role="menu"
      aria-label={title}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onClose();
      }}
    >
      <Menu>
        {title && <MenuLabel>{title}</MenuLabel>}
        <Entries entries={entries} onSelect={select} />
      </Menu>
    </div>
  );
}
