// Groups <-> VM helpers, group-key helpers, and small shared label formatters.
import type { InventoryItemVM } from "@domain/vm-types";
import { sortInventory } from "@features/inventory/inventory";
import type { SortState, Groups } from "@features/inventory/types";

export const ROOT = "root";
export const EQUIPPED = "equipped"; // drag group for the equipped-tray tiles (own order)
export const gkey = (containerId: string) => `c:${containerId}`;
export const groupContainerId = (key: string) =>
  key === ROOT ? null : key.slice(2);

export const weightLabel = (w: number) => (w > 0 ? `${w} cn` : "—");

// "N items · X cn" — count + total weight, used by both section headers.
export function flattenItems(list: InventoryItemVM[]): InventoryItemVM[] {
  return list.flatMap((it) => [it, ...flattenItems(it.children)]);
}
export function sectionCountLabel(items: InventoryItemVM[]): string {
  const all = flattenItems(items);
  const cn = all.reduce((s, it) => s + (it.weight || 0), 0);
  return `${all.length} ${all.length === 1 ? "item" : "items"} · ${cn} cn`;
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

export function buildGroups(items: InventoryItemVM[], sort: SortState): Groups {
  const sorted = sortInventory(items, sort.key, sort.dir);
  const groups: Groups = { [ROOT]: [] };
  for (const it of sorted) {
    groups[ROOT].push(it.id);
    if (it.isContainer)
      groups[gkey(it.id)] = sortInventory(it.children, sort.key, sort.dir).map(
        (c) => c.id,
      );
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
