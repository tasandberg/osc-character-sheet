import type { OSEActor, RollEvent } from "@domain/types";
import type { LoyaltyVM } from "@domain/vm-types";

export function selectLoyalty(actor: OSEActor): LoyaltyVM | null {
  const retainer = actor.system.retainer;
  if (!retainer?.enabled) return null;
  const loyalty = retainer.loyalty;
  return {
    label: "LR",
    fullLabel: "Loyalty Rating",
    value: typeof loyalty === "number" ? loyalty : null,
  };
}

export function rollLoyalty(actor: OSEActor, event?: RollEvent): void {
  actor.rollLoyalty({ event });
}
