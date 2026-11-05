import { describe, it, expect } from "vitest";
import { findSystemDropHandler, isGrantingDrop } from "./classDrop";

const actor = (type: string, owned: string[] = []) => ({
  type,
  items: { get: (id: string) => (owned.includes(id) ? {} : undefined) },
});

describe("isGrantingDrop", () => {
  it("matches a new class or race dropped on a character", () => {
    expect(isGrantingDrop(actor("character"), { type: "class", id: "c1" })).toBe(true);
    expect(isGrantingDrop(actor("character"), { type: "race", id: "r1" })).toBe(true);
  });

  it("ignores other item types", () => {
    expect(isGrantingDrop(actor("character"), { type: "weapon", id: "w1" })).toBe(false);
  });

  it("ignores non-characters", () => {
    expect(isGrantingDrop(actor("monster"), { type: "class", id: "c1" })).toBe(false);
  });

  it("ignores a class the actor already owns (a re-sort)", () => {
    expect(isGrantingDrop(actor("character", ["c1"]), { type: "class", id: "c1" })).toBe(false);
  });
});

describe("findSystemDropHandler", () => {
  const systemDrop = () => "system";
  const ownDrop = () => "ours";

  it("picks the system-scoped sheet's handler, not ours", () => {
    const handler = findSystemDropHandler(
      [
        { id: "osc-character-sheet.OscSheet", cls: { prototype: { _onDropItem: ownDrop } } },
        { id: "ose.OseActorSheetCharacter", cls: { prototype: { _onDropItem: systemDrop } } },
      ],
      "ose",
    );
    expect(handler).toBe(systemDrop);
  });

  it("returns undefined when the system sheet is missing", () => {
    expect(
      findSystemDropHandler(
        [{ id: "osc-character-sheet.OscSheet", cls: { prototype: { _onDropItem: ownDrop } } }],
        "ose",
      ),
    ).toBeUndefined();
  });
});
