import type { EncumbranceVM } from "@domain/vm-types";
import { HeaderBand } from "@layout/HeaderBand";

export default { title: "Shell / HeaderBand" };

const identity = { name: "Eldra Vey", img: "", classLabel: "Magic-User", level: 3, alignment: "Neutral", title: "Conjurer" };

const encumbrance: EncumbranceVM = {
  enabled: true,
  value: 700,
  max: 1600,
  pct: 700 / 1600,
  tier: 2,
  status: "Heavily encumbered",
  label: "700 / 1600 cn",
  moveBands: { encounter: 20, explore: 60, travel: 12 },
  bands: [25, 37.5, 50],
};

export const Default = () => (
  <HeaderBand
    identity={identity}
    vitals={{ hp: { value: 8, max: 9 }, ac: { value: 12, ascending: true }, initMod: 1, hd: "3d4", move: 120, moveBands: { encounter: 40, explore: 120, travel: 24 } }}
  />
);

/** Hover MOVE: the rates plus the tier that explains them — same tint as the inventory line. */
export const Encumbered = () => (
  <HeaderBand
    identity={identity}
    vitals={{ hp: { value: 8, max: 9 }, ac: { value: 12, ascending: true }, initMod: 1, hd: "3d4", move: 60, moveBands: encumbrance.moveBands }}
    encumbrance={encumbrance}
  />
);
