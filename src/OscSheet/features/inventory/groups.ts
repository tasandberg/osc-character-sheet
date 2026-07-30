// Groups <-> VM helpers, group-key helpers, and small shared label formatters.
import type { InventoryItemVM } from "@domain/vm-types";
import { loadValue, sortInventory } from "@features/inventory/inventory";
import type { SortState, Groups } from "@features/inventory/types";

export const ROOT = "root";
export const EQUIPPED = "equipped"; // drag group for the equipped-tray tiles (own order)
export const gkey = (containerId: string) => `c:${containerId}`;
export const groupContainerId = (key: string) =>
  key === ROOT ? null : key.slice(2);

/** A load figure with its unit attached — the unit is variant-dependent, so it can't
 *  be baked into the column header or assumed to be cn. `unit` is "" when the number
 *  stands alone (the header carries "Slots", or the value is already the em-dash). */
export interface CountedLoad {
  value: string;
  unit: string;
}

/** The load cell for one row. Under item-based encumbrance this is the item's slots —
 *  a literal 0 (an unset GM value the sheet should surface, not hide behind a dash);
 *  treasure has no per-row figure at all (it's counted per section, 100 to a slot).
 *  Every other variant keeps the cn behaviour, dash included. */
export function countedLoad(
  item: InventoryItemVM,
  variant?: string,
): CountedLoad {
  if (variant !== "itembased") return weightLoad(item.weight);
  if (item.treasure) return { value: "—", unit: "" };
  return { value: String(item.slots), unit: "" };
}

const weightLoad = (cn: number): CountedLoad =>
  cn > 0 ? { value: String(cn), unit: "cn" } : { value: "—", unit: "" };

export const loadText = (l: CountedLoad) =>
  l.unit ? `${l.value} ${l.unit}` : l.value;

/** Column/stat headings for the load figure — "Slots" replaces OSE's cryptic "Enc.". */
export const loadHeading = (variant?: string) =>
  variant === "itembased"
    ? { column: "Slots", stat: "Slots" }
    : { column: "Wt", stat: "Wgt" };

// "N items · X cn" (or "· X slots") — count + total load, used by both section headers.
export function flattenItems(list: InventoryItemVM[]): InventoryItemVM[] {
  return list.flatMap((it) => [it, ...flattenItems(it.children)]);
}
export function sectionCountLabel(
  items: InventoryItemVM[],
  variant?: string,
): string {
  const all = flattenItems(items);
  const load = all.reduce((s, it) => s + (loadValue(it, variant) || 0), 0);
  const unit = variant === "itembased" ? "slots" : "cn";
  return `${all.length} ${all.length === 1 ? "item" : "items"} · ${load} ${unit}`;
}

export function indexById(
  items: InventoryItemVM[],
): Map<string, InventoryItemVM> {
  const m = new Map<string, InventoryItemVM>();
  for (const it of items) {
    m.set(it.id, it);
    for (const ch of it.children) m.set(ch.id, ch);
  }
  return m;
}

export function buildGroups(
  items: InventoryItemVM[],
  sort: SortState,
  variant?: string,
): Groups {
  const sorted = sortInventory(items, sort.key, sort.dir, variant);
  const groups: Groups = { [ROOT]: [] };
  for (const it of sorted) {
    groups[ROOT].push(it.id);
    if (it.isContainer)
      groups[gkey(it.id)] = sortInventory(
        it.children,
        sort.key,
        sort.dir,
        variant,
      ).map((c) => c.id);
  }
  return groups;
}

export function originContainers(
  items: InventoryItemVM[],
): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const it of items) {
    m.set(it.id, null);
    for (const ch of it.children) m.set(ch.id, it.id);
  }
  return m;
}
