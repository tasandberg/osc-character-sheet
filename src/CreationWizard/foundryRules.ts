import {
  activeClassSet,
  foundryClassDetail,
  foundryClasses,
} from "./class/foundryClasses";
import type { CreationRules } from "./rules";
import {
  ABILITIES,
  type Ability,
  type AbilityScores,
} from "./scores/scoresDraft";

type ScoredActor = { system: { scores: Record<Ability, { mod: number }> } };

function modifiers(scores: AbilityScores): AbilityScores {
  const known = ABILITIES.filter((a) => scores[a] !== undefined);
  if (!known.length) return {};
  const ActorClass = CONFIG.Actor.documentClass as unknown as new (
    data: object,
  ) => ScoredActor;
  const actor = new ActorClass({
    name: "New character",
    type: "character",
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] ?? 0, bonus: 0 }]),
      ),
    },
  });
  return Object.fromEntries(
    known.map((a) => [a, actor.system.scores[a].mod]),
  ) as AbilityScores;
}

async function rollScore(label: string) {
  const roll = await new Roll("3d6").evaluate();
  await roll.toMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { speaker: { alias: game.user?.name }, flavor: `${label} (3d6)` } as any,
  );
  return {
    total: roll.total ?? 0,
    dice: roll.dice.flatMap((die) => die.results.map((r) => r.result)),
  };
}

export function foundryCreationRules(): CreationRules {
  const set = activeClassSet();
  return {
    classes: foundryClasses(set),
    classDetail: foundryClassDetail(set),
    modifiers,
    rollScore,
  };
}
