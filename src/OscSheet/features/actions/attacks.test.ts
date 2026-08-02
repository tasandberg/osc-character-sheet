import { describe, it, expect } from "vitest";
import { selectAttacks } from "@features/actions/attacks";
import type { OSEActor } from "@domain/types";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

const withMagicDagger = (over: { ignoreBonusDamage?: boolean } = {}) =>
  ({
    ...raistlin,
    system: {
      ...raistlin.system,
      config: { ignoreBonusDamage: over.ignoreBonusDamage },
      thac0: { value: 19, bba: 1, mod: { melee: 0, missile: 0 } },
      weapons: [
        {
          ...raistlin.system.weapons[0],
          system: { ...raistlin.system.weapons[0].system, bonus: 1 },
        },
      ],
    },
  }) as unknown as OSEActor;

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

  it("a magic weapon's bonus lands on the roll, the display and the tip alike", () => {
    const melee = selectAttacks(withMagicDagger(), {
      ascendingAC: false,
      ignoreAttackBonusOnDamageRoll: false,
    })[0].modes[0];
    expect(melee.hit.formula).toBe("1d20+1");
    expect(melee.hitDisplay).toBe("+1");
    expect(melee.hitTip).toBe("1d20 + 1 (weapon)");
    expect(melee.dmg.formula).toBe("1d4+1");
    expect(melee.dmgDisplay).toBe("1d4+1");
    expect(melee.dmgTip).toBe("1d4 + 1 (weapon)");
  });

  it("respects the damage opt-outs and the ascending-AC base attack bonus", () => {
    const worldOptOut = selectAttacks(withMagicDagger(), {
      ascendingAC: true,
      ignoreAttackBonusOnDamageRoll: true,
    })[0].modes[0];
    expect(worldOptOut.hit.formula).toBe("1d20+1+1");
    expect(worldOptOut.dmg.formula).toBe("1d4");

    const actorOptOut = selectAttacks(withMagicDagger({ ignoreBonusDamage: true }), {
      ascendingAC: false,
      ignoreAttackBonusOnDamageRoll: false,
    })[0].modes[0];
    expect(actorOptOut.dmg.formula).toBe("1d4");
  });
});
