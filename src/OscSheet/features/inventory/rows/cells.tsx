import type { InventoryItemVM } from "@src/OscSheet/domain/vm-types";
import { INV_QTYTAG } from "./classes";
import { Button, cx, IconButton } from "@src/OscSheet/components/ui";
import { useOscSheetContext } from "@src/OscSheet/app/context";
import type { OnContext } from "../types";

export function DragHandle() {
  return (
    <span className="osc-inv-drag" aria-hidden="true">
      <i className="fa-solid fa-grip-lines" />
    </span>
  );
}

/** Name + optional (count/qty) on top, tags beneath. `action` sits right after the
 * name (e.g. the xs inline Use pill); `trailing` sits beside it (e.g. a caret).
 * `below` is a second line inside the cell (the Uses pip row) so the grid row grows
 * to name + uses height and the flanking cells center across the whole block.
 */
export function NameCell({
  item,
  onOpen,
  badge,
  action,
  trailing,
  below,
}: {
  item: InventoryItemVM;
  onOpen: (id: string) => void;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  trailing?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="osc-inv-name-c">
      <div className="osc-inv-name-row">
        <button
          type="button"
          className="osc-inv-name"
          onClick={() => onOpen(item.id)}
        >
          <span className="nm">{item.name}</span>
          {item.damage && <span className={INV_QTYTAG}>{item.damage}</span>}
          {!item.isContainer && item.quantity && item.quantity.value > 1 && (
            <span className={INV_QTYTAG}>×{item.quantity.value}</span>
          )}
          {badge}
        </button>
        {action}
        {trailing}
      </div>
      {below}
    </div>
  );
}

// xs-only inline decrement pill (shown in place of the "Uses" pip sub-row at
// narrow widths — see the @container xs block). Same tick-off-one behaviour.
export function InlineUse({
  item,
  onSetQty,
}: {
  item: InventoryItemVM;
  onSetQty: (id: string, value: number) => void;
}) {
  const value = item.quantity?.value ?? 0;
  return (
    <Button
      variant="outline"
      tone="brass"
      size="xs"
      className="osc-inv-useinline"
      onClick={() => onSetQty(item.id, Math.max(0, value - 1))}
      disabled={value <= 0}
      aria-label={`Use one ${item.name}`}
    >
      Use
    </Button>
  );
}

// Equip toggle: outlined hand = unequipped, filled hand = equipped. Read-only
// sheets (non-owners) get a static, non-interactive equipped indicator instead
// of a toggle button — equipped items stay readable, but can't be toggled.
export function RowEquip({
  item,
  onEquip,
}: {
  item: InventoryItemVM;
  onEquip: (id: string) => void;
}) {
  const { canEdit } = useOscSheetContext();
  if (item.equipped === null)
    return <span className="osc-inv-equip-spacer" aria-hidden="true" />;
  if (!canEdit)
    return item.equipped ? (
      <span
        className="osc-inv-equip is-on is-static"
        aria-label="Equipped"
        title="Equipped"
      >
        <i className="fa-solid fa-hand" aria-hidden="true" />
      </span>
    ) : (
      <span className="osc-inv-equip-spacer" aria-hidden="true" />
    );
  return (
    <button
      type="button"
      className={cx("osc-inv-equip", item.equipped && "is-on")}
      data-testid={`equip-${item.id}`}
      aria-pressed={item.equipped}
      aria-label={item.equipped ? "Unequip" : "Equip"}
      onClick={() => onEquip(item.id)}
    >
      <i
        className={cx(item.equipped ? "fa-solid" : "fa-regular", "fa-hand")}
        aria-hidden="true"
      />
    </button>
  );
}

export function RowMore({
  item,
  onMore,
}: {
  item: InventoryItemVM;
  onMore: OnContext;
}) {
  return (
    <IconButton
      className="osc-inv-more"
      aria-haspopup="menu"
      aria-label={`More actions for ${item.name}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onMore(e, item);
      }}
    >
      <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
    </IconButton>
  );
}
