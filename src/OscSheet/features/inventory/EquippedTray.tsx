// Equipped tray — dashed-bordered row of large ink-stamp tiles, one per
// equipped item, each with a hover popover. Click a tile to unequip.
// The popover is a HoverPop (fixed + JS-anchored): centred under its tile, it would
// otherwise be clipped by the sheet body's overflow at the sheet's left edge.
import { useState } from "react";
import type { InventoryItemVM } from "@domain/vm-types";
import {
  countedLoad,
  loadHeading,
  loadText,
  EQUIPPED,
} from "@features/inventory/groups";
import type { Dnd, ItemDragData, OnContext } from "@features/inventory/types";
import { HoverPop } from "@ui/HoverPop";
import { Monogram } from "@ui/Monogram";
import { cx } from "@ui/cx";

/** Full item stats for the equipped popover: AC/AAC, damage, qty, cost, load. */
function equippedStats(
  item: InventoryItemVM,
  variant?: string,
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
  stats.push({
    label: loadHeading(variant).stat,
    value: loadText(countedLoad(item, variant)),
  });
  return stats;
}

export function EquippedTray({
  items,
  dnd,
  itemDragData,
  variant,
  onOpen,
  onContext,
  equipDropActive,
  onEquipDrop,
}: {
  items: InventoryItemVM[];
  dnd: Dnd;
  itemDragData: ItemDragData;
  /** Active encumbrance variant — picks the popover's load unit (slots vs cn). */
  variant?: string;
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
      className={cx(
        "osc-equip-tray tw:flex tw:flex-wrap tw:items-start tw:gap-2 tw:p-3",
        dropping && "is-drop-target",
      )}
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
      {items.map((item, i) => {
        const rp = dnd.rowProps(EQUIPPED, i, {
          ownZone: EQUIPPED,
          axis: "x",
          dragPayload: () => itemDragData(item.id),
        });
        return (
          <div
            key={item.id}
            className={cx(
              "osc-equip-tcard",
              "is-sortable",
              dnd.rowClass(EQUIPPED, i),
            )}
            onContextMenu={(e) => onContext(e, item)}
            {...rp}
          >
            <button
              type="button"
              className="osc-equip-tt"
              onClick={() => onOpen(item.id)}
              aria-label={item.name}
            >
              <Monogram
                img={item.img}
                monogram={item.monogram}
                className={
                  item.img
                    ? ""
                    : "osc-equip-tt-ic tw:font-display tw:text-[length:var(--fs-xl)] tw:leading-flush"
                }
              />
            </button>
            <HoverPop
              className="osc-equip-tt-pop tw:flex tw:flex-col tw:gap-[3px] tw:min-w-[132px] tw:max-w-[200px]"
              align="center"
            >
              <span className="osc-equip-tt-pop-nm tw:font-display tw:text-[length:var(--fs-base)] tw:leading-tight tw:text-text">
                {item.name}
              </span>
              <span className="osc-equip-tt-pop-type tw:font-sans tw:text-[length:var(--fs-3xs)] tw:tracking-[0.08em] tw:uppercase tw:text-text-mute">
                {item.category}
              </span>
              {/* stat rows — label on the left, mono value on the right */}
              <span className="osc-equip-tt-pop-stats tw:mt-1 tw:flex tw:flex-col tw:gap-[2px] tw:border-t tw:border-t-border-soft tw:pt-1">
                {equippedStats(item, variant).map((st) => (
                  <span
                    className="osc-equip-tt-pop-stat tw:flex tw:items-baseline tw:justify-between tw:gap-3"
                    key={st.label}
                  >
                    <span className="k tw:font-sans tw:text-[length:var(--fs-3xs)] tw:tracking-[0.04em] tw:uppercase tw:text-text-faint">
                      {st.label}
                    </span>
                    <span className="v tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text-dim">
                      {st.value}
                    </span>
                  </span>
                ))}
              </span>
              {item.tags.length > 0 && (
                <span className="osc-equip-tt-pop-tags tw:mt-1 tw:flex tw:flex-wrap tw:gap-1 tw:border-t tw:border-t-border-soft tw:pt-1">
                  {item.tags.map((t) => (
                    <span
                      className="osc-equip-tt-pop-tag tw:inline-flex tw:items-center tw:gap-[3px] tw:rounded-sm tw:border tw:border-border-soft tw:bg-bg-2 tw:px-[6px] tw:py-[1px] tw:font-sans tw:text-[length:var(--fs-3xs)] tw:text-text-dim"
                      key={t.label}
                    >
                      {/* 0.9em tracks the tag text, so the icon scales with the font setting */}
                      {t.icon && (
                        <i
                          className={cx(
                            "fa-solid",
                            t.icon,
                            "tw:text-[length:0.9em] tw:text-gold-dim",
                          )}
                          aria-hidden="true"
                        />
                      )}
                      {t.label}
                    </span>
                  ))}
                </span>
              )}
            </HoverPop>
          </div>
        );
      })}
    </div>
  );
}
