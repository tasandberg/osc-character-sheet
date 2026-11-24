import { MAX_SCORE, MIN_SCORE } from "./scoresDraft";

const INVALID = "Enter a roll formula Foundry understands, like 4d6dl";

async function extreme(formula: string, face: (faces: number) => number) {
  const roll = new Roll(formula);
  for (const die of roll.dice)
    die.results = Array.from({ length: die.number ?? 0 }, () => ({
      result: face(die.faces ?? 0),
      active: true,
    }));
  return (await roll.evaluate({ allowInteractive: false })).total ?? 0;
}

export async function scoreFormulaError(
  formula: string,
): Promise<string | undefined> {
  if (!formula.trim() || !Roll.validate(formula)) return INVALID;
  try {
    const lowest = await extreme(formula, () => 1);
    const highest = await extreme(formula, (faces) => faces);
    return lowest < MIN_SCORE || highest > MAX_SCORE
      ? `Rolls ${lowest} to ${highest}; a score must stay within ${MIN_SCORE} to ${MAX_SCORE}`
      : undefined;
  } catch {
    return INVALID;
  }
}
