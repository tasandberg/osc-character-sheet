import { describe, it, expect } from "vitest";
import { buildWeaponAttack } from "@domain/rolls/weaponAttack";
import type { OSEActor, OseWeapon } from "@domain/types";

const weapon = {
  _source: { _id: "bow", name: "Bow" },
  system: { save: "death", melee: true, missile: true },
} as unknown as OseWeapon;

const makeActor = (type: string) => ({ type }) as unknown as OSEActor;

describe("buildWeaponAttack", () => {
  it("builds OSE's rollData shape from the item source", () => {
    const actor = makeActor("character");
    const { rollData } = buildWeaponAttack(actor, weapon, "melee");

    expect(rollData.item).toBe(weapon._source);
    expect(rollData.actor).toBe(actor);
    expect(rollData.roll).toEqual({ save: "death", target: null });
  });

  it("uses the given kind for characters", () => {
    expect(buildWeaponAttack(makeActor("character"), weapon, "missile").type).toBe("missile");
    expect(buildWeaponAttack(makeActor("character"), weapon, "melee").type).toBe("melee");
  });

  it("falls back to 'attack' for non-characters", () => {
    expect(buildWeaponAttack(makeActor("npc"), weapon, "missile").type).toBe("attack");
  });

  it("passes an absent save through as undefined", () => {
    const plain = { _source: {}, system: {} } as unknown as OseWeapon;
    expect(buildWeaponAttack(makeActor("character"), plain, "melee").rollData.roll.save).toBe(
      undefined,
    );
  });
});
