import { describe, it, expect } from "vitest";
import type { OSEActor } from "@domain/types";
import { isBlankCharacter } from "./blankCharacter";

const character = (score: number, items: unknown[] = []) =>
  ({
    type: "character",
    items,
    system: {
      scores: Object.fromEntries(
        ["str", "int", "wis", "dex", "con", "cha"].map((key) => [
          key,
          { value: score },
        ]),
      ),
    },
  }) as unknown as OSEActor;

describe("isBlankCharacter", () => {
  it("treats a character with no rolled scores as blank, and a rolled one as not", () => {
    expect(isBlankCharacter(character(0))).toBe(true);
    expect(isBlankCharacter(character(10))).toBe(false);
  });

  it("treats an unrolled character that owns items as not blank", () => {
    expect(isBlankCharacter(character(0, [{ type: "weapon" }]))).toBe(false);
  });
});
