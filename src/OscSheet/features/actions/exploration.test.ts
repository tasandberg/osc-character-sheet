import { describe, it, expect } from "vitest";
import {
  addSkillUpdate,
  removeSkillUpdate,
  renameSkillUpdate,
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
    expect(od.custom).toBe(false);
    expect(vm.find((e) => e.key === "fg")!.inSix).toBe(2);
    expect(vm.find((e) => e.key === "hn")!.inSix).toBe(1);
  });

  it("reads a stored target for a skill the system does not model", () => {
    const vm = selectExploration(withSkills([{ key: "fg", inSix: 4 }]));
    expect(vm.find((e) => e.key === "fg")!.inSix).toBe(4);
  });

  it("prefers the system value once the schema gains the field", () => {
    const actor = withSkills([{ key: "fg", inSix: 4 }], {
      ...raistlin.system.exploration,
      fg: 3,
    });
    expect(selectExploration(actor).find((e) => e.key === "fg")!.inSix).toBe(3);
  });

  it("appends user-defined skills after the known ones", () => {
    const vm = selectExploration(
      withSkills([{ key: "open-locks", label: "Open Locks", inSix: 2 }]),
    );
    expect(vm).toHaveLength(7);
    expect(vm[6]).toEqual({
      key: "open-locks",
      label: "Open Locks",
      icon: "fas fa-dice-d6",
      inSix: 2,
      custom: true,
    });
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

  it("slugs a new skill's key and keeps it unique", () => {
    const actor = withSkills([{ key: "open-locks", label: "Open Locks", inSix: 1 }]);
    expect(addSkillUpdate(actor, "Open Locks")).toEqual({
      [SKILLS_PATH]: [
        { key: "open-locks", label: "Open Locks", inSix: 1 },
        { key: "open-locks-2", label: "Open Locks", inSix: 1 },
      ],
    });
  });

  it("never mints a key that collides with a known skill", () => {
    expect(addSkillUpdate(raistlin, "fg")).toEqual({
      [SKILLS_PATH]: [{ key: "fg-2", label: "fg", inSix: 1 }],
    });
  });

  it("renames and removes user-defined skills", () => {
    const actor = withSkills([{ key: "open-locks", label: "Open Locks", inSix: 2 }]);
    expect(renameSkillUpdate(actor, "open-locks", "Pick Locks")).toEqual({
      [SKILLS_PATH]: [{ key: "open-locks", label: "Pick Locks", inSix: 2 }],
    });
    expect(removeSkillUpdate(actor, "open-locks")).toEqual({ [SKILLS_PATH]: [] });
  });
});
