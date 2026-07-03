import { describe, it, expect } from "vitest";
import { alignedMenuLeft, findTweaksSheetEntry } from "./header-controls";

describe("alignedMenuLeft", () => {
  it("right-aligns the menu to the toggle", () => {
    expect(alignedMenuLeft(600, 220)).toBe(380);
  });

  it("clamps at the left viewport edge", () => {
    expect(alignedMenuLeft(150, 220)).toBe(0);
  });
});

describe("findTweaksSheetEntry", () => {
  const tweaks = { prototype: { _onConfigureActor() {} } };
  const plain = { prototype: {} };

  it("picks the ose-scoped sheet with the tweaks handler", () => {
    const entry = findTweaksSheetEntry([
      { id: "osc-character-sheet.OscSheet", cls: plain },
      { id: "other.Sheet", cls: tweaks },
      { id: "ose.OseActorSheetCharacter", cls: tweaks },
    ]);
    expect(entry?.id).toBe("ose.OseActorSheetCharacter");
  });

  it("falls back to any sheet with the handler", () => {
    const entry = findTweaksSheetEntry([
      { id: "osc-character-sheet.OscSheet", cls: plain },
      { id: "fork.Sheet", cls: tweaks },
    ]);
    expect(entry?.id).toBe("fork.Sheet");
  });

  it("returns undefined when nothing matches", () => {
    expect(
      findTweaksSheetEntry([{ id: "osc-character-sheet.OscSheet", cls: plain }]),
    ).toBeUndefined();
  });
});
