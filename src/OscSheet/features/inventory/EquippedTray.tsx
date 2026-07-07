// Equipped tray — dashed-bordered row of large ink-stamp tiles, one per
// equipped item, each with a hover popover. Click a tile to unequip.
import { useState } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import { weightLabel, EQUIPPED } from "@features/inventory/groups";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { Monogram } from "@ui/Monogram";
import { cx } from "@ui/cx";

// Equip toggle: outlined hand = unequipped, filled hand = equipped.
export function RowEquip({
  item,
  onEquip,
}: {
  item: InventoryItemVM;
  onEquip: (id: string) => void;
}) {
  if (item.equipped === null)
    return <span className="osc-inv-equip-spacer" aria-hidden="true" />;
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

/** Full item stats for the equipped popover: AC/AAC, damage, qty, cost, weight. */
function equippedStats(
  item: InventoryItemVM,
): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  if (item.armorClass)
    stats.push({
      label: item.armorClass.label,
      value: String(item.armorClass.value),
    });
  if (item.damage) stats.push({ label: "Dmg", value: item.damage });
  if (item.quantity)
    stats.push({
      label: "Qty",
      value: `${item.quantity.value} / ${item.quantity.max}`,
    });
  stats.push({ label: "Cost", value: `${item.cost} gp` });
  stats.push({ label: "Wgt", value: weightLabel(item.weight) });
  return stats;
}

export function EquippedTray({
  items,
  dnd,
  itemDragData,
  onOpen,
  onContext,
  equipDropActive,
  onEquipDrop,
}: {
  items: InventoryItemVM[];
  dnd: Dnd;
  itemDragData: ItemDragData;
  onOpen: (id: string) => void;
  onContext: OnContext;
  /** An All-Items row is mid-drag — the tray is a live equip drop target. */
  equipDropActive: boolean;
  /** Drop landed on the tray → equip the dragged item. */
  onEquipDrop: () => void;
}) {
  const [over, setOver] = useState(false);
  const dropping = equipDropActive && over;
  return (
    <div
      className={cx("osc-equip-tray", dropping && "is-drop-target")}
      onDragOver={
        equipDropActive
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(true);
            }
          : undefined
      }
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
      }}
      onDrop={
        equipDropActive
          ? (e) => {
              e.preventDefault();
              onEquipDrop();
              setOver(false);
            }
          : undefined
      }
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          className={cx(
            "osc-equip-tcard",
            "is-sortable",
            dnd.rowClass(EQUIPPED, i),
          )}
          onContextMenu={(e) => onContext(e, item)}
          {...dnd.rowProps(EQUIPPED, i, {
            ownZone: EQUIPPED,
            axis: "x",
            dragPayload: () => itemDragData(item.id),
          })}
        >
          <button
            type="button"
            className="osc-equip-tt"
            onClick={() => onOpen(item.id)}
            aria-label={item.name}
            title={item.name}
          >
            <Monogram
              img={item.img}
              monogram={item.monogram}
              className={item.img ? "" : "osc-equip-tt-ic"}
            />
          </button>
          <span className="osc-equip-tt-pop" role="tooltip">
            <span className="osc-equip-tt-pop-nm">{item.name}</span>
            <span className="osc-equip-tt-pop-type">{item.category}</span>
            <span className="osc-equip-tt-pop-stats">
              {equippedStats(item).map((st) => (
                <span className="osc-equip-tt-pop-stat" key={st.label}>
                  <span className="k">{st.label}</span>
                  <span className="v">{st.value}</span>
                </span>
              ))}
            </span>
            {item.tags.length > 0 && (
              <span className="osc-equip-tt-pop-tags">
                {item.tags.map((t) => (
                  <span className="osc-equip-tt-pop-tag" key={t.label}>
                    {t.icon && (
                      <i
                        className={cx("fa-solid", t.icon)}
                        aria-hidden="true"
                      />
                    )}
                    {t.label}
                  </span>
                ))}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
