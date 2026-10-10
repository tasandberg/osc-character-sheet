import { TOME, activeClassSet, journalPageHtml } from "../class/foundryClasses";
import type { AlignmentText } from "../rules";
import { parseAlignmentPage } from "./alignmentPage";
import type { RolledScore } from "../scores/scoresDraft";

const RULE_BOOKS = {
  classic: "classicfantasycompendium.classic-fantasy-srd",
  advanced: `${TOME}.rules`,
};

export function foundryAlignmentText() {
  let load: Promise<AlignmentText> | undefined;
  return () => {
    load ??= journalPageHtml(
      RULE_BOOKS[activeClassSet()],
      /player characters|alignment/i,
      "Alignment",
    ).then((html) => parseAlignmentPage(html ?? ""));
    load.catch(() => (load = undefined));
    return load;
  };
}

export const maximumHitPoints = (formula: string) =>
  new Roll(formula).evaluateSync({ maximize: true }).total ?? 0;

export async function rollHitPoints(
  formula: string,
  label: string,
): Promise<RolledScore> {
  const roll = await new Roll(formula).evaluate();
  await roll.toMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { speaker: { alias: game.user?.name }, flavor: label } as any,
  );
  return {
    total: roll.total ?? 0,
    dice: roll.dice.flatMap((die) => die.results.map((r) => r.result)),
  };
}
