import { describe, expect, it } from "vitest";

import {
  buildActorUpdate,
  buildExplorationConverge,
  buildFlagScopeMove,
  buildSheetClassFix,
} from "./migrations";
import { MODULE_ID } from "./flags";

const SKILLS_PATH = `flags.${MODULE_ID}.explorationSkills`;
const SKILLS_DELETE_PATH = `flags.${MODULE_ID}.-=explorationSkills`;

function actorWith(
  skills: Array<{ key: string; inSix: number }>,
  exploration: Record<string, number>,
) {
  return {
    flags: { [MODULE_ID]: { explorationSkills: skills } },
    system: { exploration },
  };
}

describe("buildFlagScopeMove", () => {
  it("moves the whole old scope blob and deletes the old scope", () => {
    const blob = { order: { a: 1 }, npc: true };
    expect(buildFlagScopeMove({ "reactor-sheet": blob, core: {} })).toEqual({
      "flags.osc-character-sheet": blob,
      "flags.-=reactor-sheet": null,
    });
  });

  it("skips docs without the old scope", () => {
    expect(buildFlagScopeMove({ core: { sheetClass: "x" } })).toBeNull();
    expect(buildFlagScopeMove(undefined)).toBeNull();
  });
});

describe("buildSheetClassFix", () => {
  it("repoints a pinned ose.ReactorSheet", () => {
    expect(buildSheetClassFix({ core: { sheetClass: "ose.ReactorSheet" } })).toEqual({
      "flags.core.sheetClass": "ose.OscSheet",
    });
  });

  it("leaves other or absent pins alone", () => {
    expect(buildSheetClassFix({ core: { sheetClass: "ose.OseActorSheetCharacter" } })).toBeNull();
    expect(buildSheetClassFix({})).toBeNull();
  });
});

describe("buildActorUpdate", () => {
  it("merges flag move and sheet fix; null when clean", () => {
    const flags = {
      "reactor-sheet": { equippedOrder: {} },
      core: { sheetClass: "ose.ReactorSheet" },
    };
    expect(buildActorUpdate(flags)).toEqual({
      "flags.osc-character-sheet": { equippedOrder: {} },
      "flags.-=reactor-sheet": null,
      "flags.core.sheetClass": "ose.OscSheet",
    });
    expect(buildActorUpdate({ core: {} })).toBeNull();
  });
});

describe("buildExplorationConverge", () => {
  const base = { ld: 1, od: 2, sd: 1, ft: 1 };

  it("returns null when nothing is stored", () => {
    expect(buildExplorationConverge({ system: { exploration: base } })).toBeNull();
    expect(buildExplorationConverge({})).toBeNull();
  });

  it("leaves a stored entry the system does not model alone", () => {
    expect(buildExplorationConverge(actorWith([{ key: "fg", inSix: 4 }], base))).toBeNull();
  });

  it("writes a modelled entry to system data and deletes the emptied flag", () => {
    const actor = actorWith([{ key: "fg", inSix: 4 }], { ...base, fg: 1, hn: 1 });
    expect(buildExplorationConverge(actor)).toEqual({
      "system.exploration.fg": 4,
      [SKILLS_DELETE_PATH]: null,
    });
  });

  it("keeps unmodelled entries in the flag", () => {
    const actor = actorWith(
      [
        { key: "fg", inSix: 4 },
        { key: "hn", inSix: 3 },
      ],
      { ...base, fg: 1 },
    );
    expect(buildExplorationConverge(actor)).toEqual({
      "system.exploration.fg": 4,
      [SKILLS_PATH]: [{ key: "hn", inSix: 3 }],
    });
  });

  it("drops rather than writes a value the schema would reject", () => {
    const exploration = { ...base, fg: 1, hn: 1 };
    expect(buildExplorationConverge(actorWith([{ key: "fg", inSix: 0 }], exploration))).toEqual({
      [SKILLS_DELETE_PATH]: null,
    });
    expect(buildExplorationConverge(actorWith([{ key: "fg", inSix: -2 }], exploration))).toEqual({
      [SKILLS_DELETE_PATH]: null,
    });
    expect(buildExplorationConverge(actorWith([{ key: "fg", inSix: 2.5 }], exploration))).toEqual({
      [SKILLS_DELETE_PATH]: null,
    });
  });

  it("is a no-op on the second pass", () => {
    const actor = actorWith([{ key: "fg", inSix: 4 }], { ...base, fg: 1, hn: 1 });
    const update = buildExplorationConverge(actor)!;
    const converged = {
      flags: { [MODULE_ID]: {} },
      system: { exploration: { ...base, fg: update["system.exploration.fg"] as number, hn: 1 } },
    };
    expect(buildExplorationConverge(converged)).toBeNull();
  });
});
