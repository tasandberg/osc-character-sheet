import type { OSEActor } from "@domain/types";
import type { ExplorationVM } from "@domain/vm-types";

// `simple` skills (Forage/Hunt) aren't in OSE's exploration schema — they fire a
// plain 1d6 for now (see issue: proper foraging/hunting checks). The other four
// are data-backed (actor.system.exploration[key]) and use OSE's own roll.
const EXPL_META: { key: string; label: string; icon: string; simple?: boolean }[] = [
  { key: "ld", label: "Listen at Door", icon: "fas fa-ear-listen" },
  { key: "od", label: "Open Stuck Door", icon: "fas fa-door-closed" },
  { key: "sd", label: "Find Secret Door", icon: "fas fa-magnifying-glass" },
  { key: "ft", label: "Find Trap", icon: "fas fa-radar" },
  { key: "forage", label: "Forage", icon: "fas fa-mushroom", simple: true },
  { key: "hunt", label: "Hunt", icon: "fas fa-bow-arrow", simple: true },
];

export function selectExploration(actor: OSEActor): ExplorationVM[] {
  const e = actor.system.exploration;
  return EXPL_META.map(({ key, label, icon, simple }) => ({
    key,
    label,
    icon,
    inSix: simple ? 1 : e[key as keyof typeof e],
    simple: !!simple,
  }));
}

/** Roll an exploration skill — data-backed via OSE, or a plain 1d6 for the
 *  not-yet-modelled Forage/Hunt. Shared by the Actions body + the lg rail. */
export function rollExploration(actor: OSEActor, key: string): void {
  const meta = EXPL_META.find((m) => m.key === key);
  if (meta?.simple) {
    const speaker = ChatMessage.getSpeaker({ actor });
    // fvtt-types' toMessage data typing is overly strict; pass it loosely.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void new Roll("1d6").toMessage({ speaker, flavor: `${meta.label} (1d6)` } as any);
    return;
  }
  actor.rollExploration(key, {});
}
