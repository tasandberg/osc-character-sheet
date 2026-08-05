import { describe, expect, it } from "vitest";
import OseDataModelCharacterScores from "@domain/data-model-character-scores";

const build = (values: Partial<Record<"str" | "int" | "wis" | "dex" | "con" | "cha", number>>) =>
  new OseDataModelCharacterScores(
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, { value, bonus: 0 }]),
    ) as unknown as ConstructorParameters<typeof OseDataModelCharacterScores>[0],
  );

describe("standard ability modifier", () => {
  it.each([
    [1, -3],
    [3, -3],
    [5, -2],
    [8, -1],
    [12, 0],
    [15, 1],
    [17, 2],
    [18, 3],
    [20, 3],
  ])("score %i gives %i", (value, mod) => {
    expect(build({ wis: value }).wis.mod).toBe(mod);
  });

  it("defaults an omitted score to 0", () => {
    expect(build({}).con).toEqual({ value: 0, bonus: 0, mod: -3 });
  });
});

describe("derived scores", () => {
  it.each([
    [1, 0],
    [3, 1],
    [9, 2],
    [13, 3],
    [16, 4],
    [18, 5],
  ])("STR %i opens doors on %i-in-6", (value, od) => {
    expect(build({ str: value }).str.od).toBe(od);
  });

  it.each([
    [1, -2],
    [5, -1],
    [12, 0],
    [15, 1],
    [17, 1],
    [18, 2],
  ])("DEX %i gives initiative %i", (value, init) => {
    expect(build({ dex: value }).dex.init).toBe(init);
  });

  it.each([
    [2, "", "OSE.NativeBroken"],
    [3, "OSE.Illiterate", "OSE.Native"],
    [7, "OSE.LiteracyBasic", "OSE.Native"],
    [12, "OSE.Literate", "OSE.Native"],
    [14, "OSE.Literate", "OSE.NativePlus1"],
    [17, "OSE.Literate", "OSE.NativePlus2"],
    [18, "OSE.Literate", "OSE.NativePlus3"],
  ])("INT %i gives literacy %s and speech %s", (value, literacy, spoken) => {
    const { int } = build({ int: value });
    expect(int.literacy).toBe(literacy);
    expect(int.spoken).toBe(spoken);
  });

  it.each([
    [1, -2, 1, 4],
    [12, 0, 4, 7],
    [15, 1, 5, 8],
    [18, 2, 7, 10],
  ])("CHA %i gives reaction %i, retainers %i, loyalty %i", (value, npc, retain, loyalty) => {
    const { cha } = build({ cha: value });
    expect(cha.npc).toBe(npc);
    expect(cha.retain).toBe(retain);
    expect(cha.loyalty).toBe(loyalty);
  });
});

describe("mutation", () => {
  it("recomputes derived values when a score is reassigned", () => {
    const scores = build({ str: 9 });
    expect(scores.str.mod).toBe(0);
    scores.str = { ...scores.str, value: 18 };
    expect(scores.str.mod).toBe(3);
    expect(scores.str.od).toBe(5);
    expect(scores.str.bonus).toBe(0);
  });
});
