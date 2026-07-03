import { describe, expect, it } from "vitest";

import {
  buildActorUpdate,
  buildFlagScopeMove,
  buildSheetClassFix,
} from "./migrations";

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
