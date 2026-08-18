// Cursor-anchored wiring for the item menu (right-click on a tray tile or a
// treasure row). The kebab popover uses the same body via RowMore.
import { useEffect } from "react";
import { Menu } from "@ui/Menu";
import { ItemMenuBody } from "@features/inventory/ItemMenuBody";
import type { MenuState } from "@features/inventory/types";

export function ItemContextMenu({
  menu,
  onClose,
}: {
  menu: MenuState;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", onClose);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onClose);
    // Capture: scroll doesn't bubble, and the menu is pinned to the cursor
    // coordinates it opened at.
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("pointerdown", onClose);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  // Keep the menu on-screen.
  const style: React.CSSProperties = {
    left: Math.min(menu.x, window.innerWidth - 200),
    top: Math.min(menu.y, window.innerHeight - 170),
  };

  return (
    <Menu
      className="osc-menu-pinned"
      style={style}
      role="menu"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ItemMenuBody item={menu.item} vm={menu.vm ?? null} onClose={onClose} />
    </Menu>
  );
}
