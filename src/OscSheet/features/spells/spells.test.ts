import { describe, it, expect } from "vitest";
import { spellMeta } from "@features/spells/spells";
import type { OseSpell } from "@domain/types";

// spellMeta only reads spell.system — build the minimal shape inline.
const spell = (system: Partial<OseSpell["system"]>) =>
  ({ system }) as OseSpell;

describe("spellMeta", () => {
  it("orders range · duration · save · damage and prefixes R/D", () => {
    const parts = spellMeta(
      spell({ range: "150'", duration: "1 turn", save: "vs spells", damage: "1d6+1" })
    );
    expect(parts).toEqual([
      { kind: "range", text: "R 150'" },
      { kind: "duration", text: "D 1 turn" },
      { kind: "save", text: "save vs spells" },
      { kind: "damage", text: "1d6+1" },
    ]);
  });

  it("renders 'no save' when there is no save, and drops empty range/duration/damage", () => {
    const parts = spellMeta(spell({ range: "", duration: "", save: "" }));
    expect(parts).toEqual([{ kind: "save", text: "no save" }]);
  });
});
