import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import type { AbilityVM } from "@domain/vm-types";

export default { title: "Actions / AbilityPlaques" };

const A = (key: string, label: string, value: number, mod: number): AbilityVM => ({
  key, label, value, mod, modLabel: mod >= 0 ? `+${mod}` : `${mod}`,
});

export const Default = () => (
  <AbilityPlaques
    abilities={[
      A("str", "STR", 9, 0), A("dex", "DEX", 13, 1), A("con", "CON", 10, 0),
      A("int", "INT", 17, 2), A("wis", "WIS", 12, 0), A("cha", "CHA", 11, 0),
    ]}
  />
);
