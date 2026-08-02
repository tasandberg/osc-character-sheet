import { describe, it, expect } from "vitest";
import { computeAttack, type AttackInput, type AttackSettings } from "@domain/attackMath";

const settings = (over: Partial<AttackSettings> = {}): AttackSettings => ({
  ascendingAC: false,
  ignoreAttackBonusOnDamageRoll: false,
  ...over,
});

const input = (over: Partial<AttackInput> = {}): AttackInput => ({
  kind: "melee",
  die: "1d8",
  weaponBonus: 0,
  strMod: 0,
  dexMod: 0,
  thac0: { bba: 0, mod: { melee: 0, missile: 0 } },
  ignoreBonusDamage: false,
  ...over,
});

describe("computeAttack", () => {
  it("a plain weapon with no modifiers is just the dice", () => {
    const { hit, dmg } = computeAttack(input(), settings());
    expect(hit.formula).toBe("1d20");
    expect(hit.display).toBe("+0");
    expect(hit.tip).toBe("1d20");
    expect(hit.terms).toEqual([{ label: "die", value: "1d20" }]);
    expect(dmg.formula).toBe("1d8");
    expect(dmg.display).toBe("1d8+0");
    expect(dmg.terms).toEqual([{ label: "die", value: "1d8" }]);
  });

  it("falls back to 1d6 when the weapon has no damage die", () => {
    expect(computeAttack(input({ die: "" }), settings()).dmg.formula).toBe("1d6");
  });

  it("melee takes str on hit and damage; missile takes dex on hit only", () => {
    const melee = computeAttack(input({ strMod: 2, dexMod: 3 }), settings());
    expect(melee.hit.formula).toBe("1d20+2");
    expect(melee.hit.terms).toContainEqual({ label: "str", value: 2 });
    expect(melee.dmg.formula).toBe("1d8+2");

    const missile = computeAttack(
      input({ kind: "missile", strMod: 2, dexMod: 3 }),
      settings(),
    );
    expect(missile.hit.formula).toBe("1d20+3");
    expect(missile.hit.terms).toContainEqual({ label: "dex", value: 3 });
    expect(missile.dmg.formula).toBe("1d8");
  });

  it("adds the weapon bonus to hit and damage", () => {
    const { hit, dmg } = computeAttack(input({ weaponBonus: 1 }), settings());
    expect(hit.formula).toBe("1d20+1");
    expect(hit.label).toBe("1d20 +1(weapon)");
    expect(hit.tip).toBe("1d20 + 1 (weapon)");
    expect(dmg.formula).toBe("1d8+1");
    expect(dmg.display).toBe("1d8+1");
    expect(dmg.terms).toContainEqual({ label: "weapon", value: 1 });
  });

  it("adds the weapon bonus to missile damage too — only the ability mod is melee-only", () => {
    const { hit, dmg } = computeAttack(
      input({ kind: "missile", weaponBonus: 2 }),
      settings(),
    );
    expect(hit.formula).toBe("1d20+2");
    expect(dmg.formula).toBe("1d8+2");
  });

  it("drops the damage bonus when the world setting opts out", () => {
    const { hit, dmg } = computeAttack(
      input({ weaponBonus: 1 }),
      settings({ ignoreAttackBonusOnDamageRoll: true }),
    );
    expect(hit.formula).toBe("1d20+1");
    expect(dmg.formula).toBe("1d8");
    expect(dmg.terms).not.toContainEqual({ label: "weapon", value: 1 });
  });

  it("drops the damage bonus when the per-actor Tweaks flag opts out", () => {
    const { hit, dmg } = computeAttack(
      input({ weaponBonus: 1, ignoreBonusDamage: true }),
      settings(),
    );
    expect(hit.formula).toBe("1d20+1");
    expect(dmg.formula).toBe("1d8");
  });

  it("drops the damage bonus when both opt-outs are on", () => {
    const { dmg } = computeAttack(
      input({ weaponBonus: 1, ignoreBonusDamage: true }),
      settings({ ignoreAttackBonusOnDamageRoll: true }),
    );
    expect(dmg.formula).toBe("1d8");
  });

  it("applies the Tweaks attack mod per range, folding melee's into damage", () => {
    const melee = computeAttack(
      input({ thac0: { bba: 0, mod: { melee: 1, missile: 2 } } }),
      settings(),
    );
    expect(melee.hit.formula).toBe("1d20+1");
    expect(melee.dmg.formula).toBe("1d8+1");

    const missile = computeAttack(
      input({ kind: "missile", thac0: { bba: 0, mod: { melee: 1, missile: 2 } } }),
      settings(),
    );
    expect(missile.hit.formula).toBe("1d20+2");
    expect(missile.dmg.formula).toBe("1d8");
  });

  it("adds the base attack bonus only under ascending AC", () => {
    const thac0 = { bba: 2, mod: { melee: 0, missile: 0 } };
    expect(computeAttack(input({ thac0 }), settings()).hit.formula).toBe("1d20");
    const ascending = computeAttack(input({ thac0 }), settings({ ascendingAC: true }));
    expect(ascending.hit.formula).toBe("1d20+2");
    expect(ascending.hit.terms).toContainEqual({ label: "bba", value: 2 });
    expect(ascending.dmg.formula).toBe("1d8");
  });

  it("tolerates a missing thac0 block", () => {
    const { hit } = computeAttack(
      input({ thac0: undefined }),
      settings({ ascendingAC: true }),
    );
    expect(hit.formula).toBe("1d20");
  });

  it("composes every term at once, and keeps display in step with the formula", () => {
    const { hit, dmg } = computeAttack(
      input({
        strMod: 1,
        weaponBonus: 2,
        thac0: { bba: 3, mod: { melee: 1, missile: 0 } },
      }),
      settings({ ascendingAC: true }),
    );
    expect(hit.formula).toBe("1d20+3+1+1+2");
    expect(hit.total).toBe(7);
    expect(hit.display).toBe("+7");
    expect(hit.tip).toBe("1d20 + 3 (bba) + 1 (str) + 1 (tweaks) + 2 (weapon)");
    expect(dmg.formula).toBe("1d8+2+1+1");
    expect(dmg.display).toBe("1d8+4");
  });

  it("renders negative modifiers", () => {
    const { hit, dmg } = computeAttack(input({ strMod: -2 }), settings());
    expect(hit.formula).toBe("1d20-2");
    expect(hit.label).toBe("1d20 -2(str)");
    expect(hit.tip).toBe("1d20 − 2 (str)");
    expect(dmg.display).toBe("1d8-2");
  });
});
