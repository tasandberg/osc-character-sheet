import type { ImageDrop } from "@features/portraitImage/parseImageDrop";
import { characterLanguages } from "../class/classDraft";
import { ALIGNMENTS, parseHitPoints } from "../details/detailsDraft";
import { isChosen, livePortrait } from "../portrait/portraitDraft";
import {
  chosenRace,
  classDetails,
  classScores,
  type CreationDraft,
  type FlowRules,
} from "../flow";
import { cartLines, goldLeft } from "../gear/gearDraft";
import type { CartLine } from "../gear/gearTypes";
import type { CreationRace } from "../race/raceItems";
import { ABILITIES } from "../scores/scoresDraft";

export type NewCharacter = {
  name: string;
  portrait?: ImageDrop;
  token?: ImageDrop;
  class: { uuid: string; level: number; xp: number };
  system: Record<string, unknown>;
  race?: CreationRace;
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
  const scores = classScores(draft, rules);
  const race = chosenRace(draft, rules);
  const { stats, level } = details;
  const images = livePortrait(draft.details.portrait);
  return {
    name: draft.details.name.trim(),
    ...(images && isChosen(images.portrait) && { portrait: images.portrait }),
    ...(images && isChosen(images.token) && { token: images.token }),
    class: { uuid: cls.uuid, level, xp: stats.xp },
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] }]),
      ),
      details: {
        alignment: ALIGNMENTS.find((a) => a.value === draft.details.alignment)!
          .label,
      },
      hp: { value: hp, max: hp },
      languages: {
        value: characterLanguages(cls, race?.languages ?? []),
      },
    },
    ...(race && { race }),
    gear: cartLines(draft.gear.cart),
    gold: goldLeft(draft.gear),
  };
}
