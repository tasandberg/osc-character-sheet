import type { OSEActor, OseItem } from "@domain/types";
import { selectInventory } from "@features/inventory/inventory";
import { TabIds } from "@app/tabs";

export function selectTabCounts(
  actor: OSEActor,
  items: OseItem[],
): Partial<Record<TabIds, number>> {
  return {
    [TabIds.SPELLS]: Object.values(actor.system.spells?.spellList ?? {}).flat()
      .length,
    [TabIds.ABILITIES]: Object.values(actor.system.abilities ?? {}).length,
    [TabIds.INVENTORY]: selectInventory(items).count,
  };
}
