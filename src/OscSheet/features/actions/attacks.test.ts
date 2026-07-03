import { describe, it, expect } from "vitest";
import { selectAttacks } from "@features/actions/attacks";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

describe("selectAttacks", () => {
  const vm = selectAttacks(raistlin);

  it("keeps a melee+missile weapon as one row carrying both modes (melee first)", () => {
    const dagger = vm.filter((a) => a.name === "Dagger");
    expect(dagger).toHaveLength(1);
    expect(dagger[0].modes.map((m) => m.kind)).toEqual(["melee", "missile"]);
  });

  it("builds hit/damage roll specs: STR for melee, DEX hit for missile (no missile dmg mod)", () => {
    const dagger = vm.find((a) => a.name === "Dagger")!;
    const melee = dagger.modes.find((m) => m.kind === "melee")!;
    const missile = dagger.modes.find((m) => m.kind === "missile")!;
    // STR 9 → +0: no suffix, plain formula
    expect(melee.hit.label).toBe("1d20");
    expect(melee.hit.formula).toBe("1d20");
    expect(melee.dmg.label).toBe("1d4");
    // DEX 13 → +1 on the to-hit; missile damage gets no ability mod
    expect(missile.hit.label).toBe("1d20 +1(dex)");
    expect(missile.hit.formula).toBe("1d20+1");
    expect(missile.dmg.label).toBe("1d4");
  });

  it("carries quality labels and skips non-equipped weapons", () => {
    const staff = vm.find((a) => a.name === "Quarterstaff")!;
    expect(staff.qualities).toEqual([
      { label: "Two-handed", icon: "fa-hand-fist" },
      { label: "Slow", icon: "fa-hourglass" },
    ]);
    // single-mode (melee-only) weapon
    expect(staff.modes.map((m) => m.kind)).toEqual(["melee"]);
  });
});
