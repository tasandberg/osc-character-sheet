import { describe, it, expect, beforeAll, vi } from "vitest";
import { selectFeatures } from "@features/abilities/features";
import type { OSEActor, OseAbility } from "@domain/types";

// selectFeatures composes the roll tag from CONFIG.OSE.roll_type (a Foundry global).
beforeAll(() => {
  (globalThis as { CONFIG?: unknown }).CONFIG = {
    OSE: { roll_type: { result: "=", above: "≥", below: "≤" } },
  };
});

type AbilityMock = {
  _id: string;
  name: string;
  img?: string;
  roll?: () => void;
  // partial ability system — full OseItem system has many required fields the VM ignores
  system?: Partial<OseAbility["system"]>;
};

function ability(partial: AbilityMock): OseAbility {
  return {
    img: "icons/x.svg",
    roll: vi.fn(),
    ...partial,
    system: { description: "", ...(partial.system ?? {}) },
  } as unknown as OseAbility;
}

function actorWith(abilities: OseAbility[]): OSEActor {
  return {
    system: { abilities: Object.fromEntries(abilities.map((a) => [a._id, a])) },
  } as unknown as OSEActor;
}

describe("selectFeatures", () => {
  it("marks a feature with a roll formula rollable and composes the tag with the target", () => {
    const actor = actorWith([
      ability({ _id: "a1", name: "Hide", system: { roll: "1d6", rollType: "below", rollTarget: 2 } }),
    ]);
    const [vm] = selectFeatures(actor);
    expect(vm.rollable).toBe(true);
    expect(vm.rollTag).toBe("1d6 ≤2");
    expect(vm.onRoll).toBeTypeOf("function");
  });

  it("omits the target half when rollTarget is 0/unset", () => {
    const actor = actorWith([
      ability({ _id: "a1", name: "Listen", system: { roll: "1d6", rollType: "result", rollTarget: 0 } }),
    ]);
    expect(selectFeatures(actor)[0].rollTag).toBe("1d6");
  });

  it("treats a passive feature (no formula) as non-rollable", () => {
    const actor = actorWith([
      ability({ _id: "a1", name: "Read Magic", system: { roll: "" } }),
    ]);
    const [vm] = selectFeatures(actor);
    expect(vm.rollable).toBe(false);
    expect(vm.rollTag).toBeUndefined();
    expect(vm.onRoll).toBeUndefined();
  });

  it("onRoll calls the item's own roll method", () => {
    const item = ability({ _id: "a1", name: "Hear Noise", system: { roll: "1d6", rollTarget: 1 } });
    selectFeatures(actorWith([item]))[0].onRoll!();
    expect(item.roll).toHaveBeenCalledOnce();
  });

  it("title-cases requirements for the tag label", () => {
    const actor = actorWith([
      ability({ _id: "a1", name: "Hide", system: { requirements: "magic-user" } }),
    ]);
    expect(selectFeatures(actor)[0].requiresLabel).toBe("Magic-User");
  });

  it("leaves requiresLabel undefined when requirements is unset", () => {
    const actor = actorWith([ability({ _id: "a1", name: "Generic", system: {} })]);
    expect(selectFeatures(actor)[0].requiresLabel).toBeUndefined();
  });

  it("sorts by requirements (then name), with unset requirements last", () => {
    const actor = actorWith([
      ability({ _id: "a1", name: "Zeta", system: {} }), // no requirements → last
      ability({ _id: "a2", name: "Beta", system: { requirements: "thief" } }),
      ability({ _id: "a3", name: "Alpha", system: { requirements: "elf" } }),
      ability({ _id: "a4", name: "Gamma", system: { requirements: "elf" } }),
    ]);
    expect(selectFeatures(actor).map((f) => f.name)).toEqual(["Alpha", "Gamma", "Beta", "Zeta"]);
  });
});
