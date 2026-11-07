import type { OSEActor, OSESave } from "@domain/types";
import type { SaveVM } from "@domain/vm-types";

const SAVE_META: { key: OSESave; label: string; icon: string }[] = [
  { key: "death", label: "Death / Poison", icon: "fas fa-skull-crossbones" },
  { key: "wand", label: "Magic Wands", icon: "fas fa-magic" },
  { key: "paralysis", label: "Paralysis / Petrify", icon: "fas fa-bolt" },
  { key: "breath", label: "Breath Attacks", icon: "fas fa-wind" },
  { key: "spell", label: "Spells / Rods / Staves", icon: "fas fa-hat-wizard" },
];

export function selectSaves(actor: OSEActor): SaveVM[] {
  // Runtime value is { value: number } though the type says number — handle both.
  const saves = actor.system.saves as Record<OSESave, number | { value: number }>;
  return SAVE_META.map(({ key, label, icon }) => {
    const raw = saves[key];
    const target = typeof raw === "number" ? raw : raw.value;
    return { key, label, icon, target };
  });
}
