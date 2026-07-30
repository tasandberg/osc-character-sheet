// Item-Based Encumbrance slot counting, shared by the inventory list and the Treasure
// section (which is why it lives here rather than in either of them).
import type { OseItem } from "@domain/types";

/** Whether the system buckets this item globally at 100 to a slot instead of counting it
 *  per row. Only `item`-typed treasure qualifies, and only when the system's own derived
 *  `isCoinsOrGems` says so — other valuables (a gold idol, a silver crown) count normally. */
export function bucketsAsCoinsOrGems(item: OseItem): boolean {
  return item.type === "item" && !!item.system?.isCoinsOrGems;
}

/** Carried item slots, mirroring the system's item-based encumbrance model: `item` and
 *  `container` fold in quantity, `weapon`/`armor` count their slots once whatever the qty. */
export function slotsOf(item: OseItem): number {
  const s = item.system;
  const slots = s.itemslots ?? 0;
  // Coins/gems are bucketed globally (100 to a slot, ceiled once over the lot), so they
  // have no honest per-row figure — the Treasure section totals them instead.
  if (bucketsAsCoinsOrGems(item)) return 0;
  if (item.type === "weapon" || item.type === "armor") return slots;
  // Containers ship quantity 0, so the system counts them as 0 slots. Coercing that to 1
  // would read better but would stop our totals matching the system's own figure.
  return s.cumulativeItemslots ?? Math.ceil(slots * (s.quantity?.value ?? 1));
}
