export const ABILITIES = ["str", "int", "wis", "dex", "con", "cha"] as const;
export type Ability = (typeof ABILITIES)[number];
export type AbilityScores = Partial<Record<Ability, number>>;

export const ABILITY_NAMES: Record<Ability, string> = {
  str: "Strength",
  int: "Intelligence",
  wis: "Wisdom",
  dex: "Dexterity",
  con: "Constitution",
  cha: "Charisma",
};

export const abbreviation = (ability: Ability) => ability.toUpperCase();

export type ScoreMethod = "inOrder" | "arrange" | "manual";
export type RolledScore = { total: number; dice: number[] };

export type ScoresDraft = {
  method: ScoreMethod;
  inOrder: Partial<Record<Ability, RolledScore>>;
  pool: (RolledScore | null)[];
  placed: Partial<Record<Ability, number>>;
  manual: Partial<Record<Ability, string>>;
};

export const MIN_SCORE = 3;
export const MAX_SCORE = 18;

export const emptyScoresDraft = (): ScoresDraft => ({
  method: "inOrder",
  inOrder: {},
  pool: ABILITIES.map(() => null),
  placed: {},
  manual: {},
});

export function parseManualScore(text: string | undefined): number | null {
  if (!text || !/^\d+$/.test(text.trim())) return null;
  const value = Number(text);
  return value >= MIN_SCORE && value <= MAX_SCORE ? value : null;
}

export const isInvalidManualScore = (text: string | undefined) =>
  !!text?.trim() && parseManualScore(text) === null;

export function nextInOrder(draft: ScoresDraft): Ability | undefined {
  return ABILITIES.find((ability) => !draft.inOrder[ability]);
}

export function unplacedSlots(draft: ScoresDraft): number[] {
  const placed = new Set(Object.values(draft.placed));
  return draft.pool.flatMap((roll, slot) =>
    roll && !placed.has(slot) ? [slot] : [],
  );
}

export function finalScores(draft: ScoresDraft): AbilityScores {
  const scores: AbilityScores = {};
  for (const ability of ABILITIES) {
    const value =
      draft.method === "inOrder"
        ? draft.inOrder[ability]?.total
        : draft.method === "arrange"
          ? draft.pool[draft.placed[ability] ?? -1]?.total
          : parseManualScore(draft.manual[ability]);
    if (value != null) scores[ability] = value;
  }
  return scores;
}

export const scoresComplete = (draft: ScoresDraft) =>
  ABILITIES.every((ability) => finalScores(draft)[ability] !== undefined);

const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];

const listAbilities = (abilities: Ability[]) =>
  abilities.map(abbreviation).join(", ");

export function scoresBlockedReason(draft: ScoresDraft): string | undefined {
  if (scoresComplete(draft)) return undefined;
  if (draft.method === "manual") {
    const invalid = ABILITIES.filter((a) =>
      isInvalidManualScore(draft.manual[a]),
    );
    const missing = ABILITIES.filter((a) => !draft.manual[a]?.trim());
    if (missing.length === ABILITIES.length)
      return "Enter your scores to continue";
    const parts = [
      invalid.length && `fix ${listAbilities(invalid)}`,
      missing.length && `enter ${listAbilities(missing)}`,
    ].filter(Boolean) as string[];
    const sentence = parts.join(" and ");
    return `${sentence[0].toUpperCase()}${sentence.slice(1)} to continue`;
  }
  const rolled =
    draft.method === "inOrder"
      ? Object.keys(draft.inOrder).length
      : draft.pool.filter(Boolean).length;
  if (rolled === 0) return "Roll your scores to continue";
  if (draft.method === "inOrder")
    return `Roll ${COUNT_WORDS[ABILITIES.length - rolled]} more to continue`;
  const toPlace = ABILITIES.length - Object.keys(draft.placed).length;
  return `Place ${toPlace} more ${toPlace === 1 ? "roll" : "rolls"} to continue`;
}

export function scoresSummary(draft: ScoresDraft): string | undefined {
  if (!scoresComplete(draft)) return undefined;
  const scores = finalScores(draft);
  return ABILITIES.map((ability) => scores[ability]).join(" ");
}
