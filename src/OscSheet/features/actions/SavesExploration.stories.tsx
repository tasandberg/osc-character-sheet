import { SavesExploration } from "@features/actions/SavesExploration";
import type { SaveVM, ExplorationVM } from "@domain/vm-types";

export default { title: "Actions / SavesExploration" };

const saves: SaveVM[] = [
  { key: "death", label: "Death", icon: "fas fa-skull-crossbones", target: 13 },
  { key: "wand", label: "Wand", icon: "fas fa-magic", target: 14 },
  { key: "paralysis", label: "Paralysis", icon: "fas fa-bolt", target: 13 },
  { key: "breath", label: "Breath", icon: "fas fa-wind", target: 16 },
  { key: "spell", label: "Spell", icon: "fas fa-hat-wizard", target: 15 },
];
const exploration: ExplorationVM[] = [
  { key: "ld", label: "Listen at Door", icon: "fas fa-ear-listen", inSix: 2 },
  { key: "od", label: "Open Stuck Door", icon: "fas fa-door-closed", inSix: 2 },
  { key: "sd", label: "Find Secret Door", icon: "fas fa-magnifying-glass", inSix: 1 },
  { key: "ft", label: "Find Trap", icon: "fas fa-radar", inSix: 1 },
  { key: "fg", label: "Forage", icon: "fas fa-mushroom", inSix: 2 },
  { key: "hn", label: "Hunt", icon: "fas fa-bow-arrow", inSix: 1 },
];

export const Default = () => (
  <SavesExploration saves={saves} exploration={exploration} />
);

/** Rail/large-view variant: one section at a time behind a tab nav. */
export const Tabbed = () => (
  <SavesExploration saves={saves} exploration={exploration} tabbed />
);
