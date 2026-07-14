// "+" control in the All-Items header: pick an OSE type, create it, land in its sheet.
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@ui/IconButton";
import { Menu, MenuItem, MenuLabel } from "@ui/Menu";
import type { InventoryItemType } from "@features/inventory/createItem";

const TYPES: { type: InventoryItemType; label: string; icon: string }[] = [
  { type: "weapon", label: "Weapon", icon: "fa-solid fa-khanda" },
  { type: "armor", label: "Armor", icon: "fa-solid fa-shield-halved" },
  { type: "item", label: "Item", icon: "fa-solid fa-box" },
  { type: "container", label: "Container", icon: "fa-solid fa-bag-shopping" },
];

export function AddItemMenu({
  onCreate,
}: {
  onCreate: (type: InventoryItemType) => void;
}) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!host.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className="menu-host" ref={host}>
      <IconButton
        variant="accent"
        title="Add item"
        aria-label="Add item"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <i className="fas fa-plus" aria-hidden="true" />
      </IconButton>
      <Menu popover open={open} role="menu">
        <MenuLabel>New item</MenuLabel>
        {TYPES.map((t) => (
          <MenuItem
            key={t.type}
            icon={<i className={t.icon} aria-hidden="true" />}
            tabIndex={0}
            onClick={() => {
              setOpen(false);
              onCreate(t.type);
            }}
          >
            {t.label}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}
