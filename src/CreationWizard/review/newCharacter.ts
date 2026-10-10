import { ALIGNMENTS, parseHitPoints } from "../details/detailsDraft";
import {
  chosenRace,
  classDetails,
  classScores,
  type CreationDraft,
  type FlowRules,
} from "../flow";
import { cartLines, goldLeft } from "../gear/gearDraft";
import type { CartLine } from "../gear/gearTypes";
import { nativeLanguages } from "../rules/classConstants";
import { xpAdjustment } from "../rules/xpAdjustment";
import { raceLanguages } from "../race/raceDraft";
import { ABILITIES } from "../scores/scoresDraft";

const SAVE_KEYS = [
  "death",
  "wand",
  "paralysis",
  "breath",
  "spell",
] as const;

export type NewCharacter = {
  name: string;
  system: Record<string, unknown>;
  gear: CartLine[];
  gold: number;
};

export function newCharacter(
  draft: CreationDraft,
  rules: FlowRules,
): NewCharacter | undefined {
  const cls = draft.class;
  const details = classDetails(draft, rules);
  const hp = parseHitPoints(details?.hitPoints?.value);
  if (!cls || !details || hp === undefined || !draft.details.alignment)
    return undefined;
  const scores = classScores(draft);
  const race = chosenRace(draft);
  const { row, level, nextXp } = details;
  const spells = row.spells?.length
    ? {
        enabled: true,
        ...Object.fromEntries(
          row.spells.map((max, i) => [String(i + 1), { max }]),
        ),
      }
    : undefined;
  return {
    name: draft.details.name.trim(),
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] }]),
      ),
      details: {
        class: cls.name,
        level,
        alignment: ALIGNMENTS.find((a) => a.value === draft.details.alignment)!
          .label,
        xp: {
          value: row.xp,
          ...(nextXp !== null && { next: nextXp }),
          bonus: xpAdjustment(cls, scores)?.modifier ?? 0,
        },
      },
      hp: { hd: row.hd, value: hp, max: hp },
      thac0: { value: row.thac0, bba: 19 - row.thac0 },
      saves: Object.fromEntries(
        SAVE_KEYS.map((key, i) => [key, { value: row.saves[i] }]),
      ),
      ...(spells && { spells }),
      languages: {
        value: race ? raceLanguages(race) : nativeLanguages(cls.name),
      },
    },
    gear: cartLines(draft.gear.cart),
    gold: goldLeft(draft.gear),
  };
}
