import { describe, it, expect } from "vitest";
import {
  selectExploration,
  setTargetUpdate,
  type ExplorationSkill,
} from "@features/actions/exploration";
import { MODULE_ID } from "@domain/flags";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";
import type { OSEActor } from "@domain/types";

const SKILLS_PATH = `flags.${MODULE_ID}.explorationSkills`;

function withSkills(
  skills: ExplorationSkill[],
  exploration?: Record<string, number>,
): OSEActor {
  return {
    ...raistlin,
    system: {
      ...raistlin.system,
      exploration: exploration ?? raistlin.system.exploration,
    },
    flags: { [MODULE_ID]: { explorationSkills: skills } },
  } as unknown as OSEActor;
}

describe("selectExploration", () => {
  it("returns the four schema skills plus Forage/Hunt at their rule defaults", () => {
    const vm = selectExploration(raistlin);
    expect(vm.map((e) => e.key)).toEqual(["ld", "od", "sd", "ft", "fg", "hn"]);
    const od = vm.find((e) => e.key === "od")!;
    expect(od.label).toBe("Open Stuck Door");
    expect(od.inSix).toBe(2);
    expect(vm.find((e) => e.key === "fg")!.inSix).toBe(1);
    expect(vm.find((e) => e.key === "hn")!.inSix).toBe(1);
  });

  it("reads a stored target for a skill the system does not model", () => {
    const vm = selectExploration(withSkills([{ key: "fg", inSix: 4 }]));
    expect(vm.find((e) => e.key === "fg")!.inSix).toBe(4);
  });

  it("keeps the stored target once the schema gains the field", () => {
    const actor = withSkills([{ key: "fg", inSix: 4 }], {
      ...raistlin.system.exploration,
      fg: 3,
    });
    expect(selectExploration(actor).find((e) => e.key === "fg")!.inSix).toBe(4);
  });

  it("falls back to the system value when nothing is stored", () => {
    const actor = withSkills([], { ...raistlin.system.exploration, fg: 3 });
    expect(selectExploration(actor).find((e) => e.key === "fg")!.inSix).toBe(3);
  });

  it("ignores a stored entry for a key outside the six skills", () => {
    const vm = selectExploration(withSkills([{ key: "open-locks", inSix: 2 }]));
    expect(vm.map((e) => e.key)).toEqual(["ld", "od", "sd", "ft", "fg", "hn"]);
  });
});

describe("exploration updates", () => {
  it("writes a schema-backed target to system data", () => {
    expect(setTargetUpdate(raistlin, "od", 3)).toEqual({ "system.exploration.od": 3 });
  });

  it("writes an unmodelled target to the module flag", () => {
    expect(setTargetUpdate(raistlin, "fg", 4)).toEqual({
      [SKILLS_PATH]: [{ key: "fg", inSix: 4 }],
    });
  });

  it("replaces the stored entry rather than appending a duplicate", () => {
    const actor = withSkills([{ key: "fg", inSix: 2 }]);
    expect(setTargetUpdate(actor, "fg", 5)).toEqual({
      [SKILLS_PATH]: [{ key: "fg", inSix: 5 }],
    });
  });

  it("keeps writing to the flag when the schema also models the skill", () => {
    const actor = withSkills([{ key: "fg", inSix: 2 }], {
      ...raistlin.system.exploration,
      fg: 3,
    });
    expect(setTargetUpdate(actor, "fg", 5)).toEqual({
      [SKILLS_PATH]: [{ key: "fg", inSix: 5 }],
    });
  });

  it("preserves unrelated stored entries when patching one", () => {
    const actor = withSkills([
      { key: "hn", inSix: 3 },
      { key: "fg", inSix: 2 },
    ]);
    expect(setTargetUpdate(actor, "fg", 5)).toEqual({
      [SKILLS_PATH]: [
        { key: "hn", inSix: 3 },
        { key: "fg", inSix: 5 },
      ],
    });
  });
});
