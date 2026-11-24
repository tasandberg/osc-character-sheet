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

export type RollMethod = {
  id: string;
  label: string;
  formula: string;
  arrange: boolean;
  enabled: boolean;
};
export type ScoreChoice = RollMethod | "manual";

export const IN_ORDER: RollMethod = {
  id: "inOrder",
  label: "3d6 down the line",
  formula: "3d6",
  arrange: false,
  enabled: true,
};
export const ARRANGE: RollMethod = {
  id: "arrange",
  label: "3d6 and arrange",
  formula: "3d6",
  arrange: true,
  enabled: true,
};

export const scoreChoiceId = (choice: ScoreChoice) =>
  choice === "manual" ? choice : choice.id;

export const scoreChoiceLabel = (choice: ScoreChoice) =>
  choice === "manual" ? "Enter manually" : choice.label;

let resolvedCustom: { key: string; methods: RollMethod[] } | undefined;

export function resolveCustomScoreMethods(value: unknown): RollMethod[] {
  const methods = (Array.isArray(value) ? value : []).flatMap(
    (entry: Partial<Record<keyof RollMethod, unknown>> | null) => {
      const { id, label, formula, arrange, enabled } = entry ?? {};
      return typeof id === "string" &&
        typeof label === "string" &&
        typeof formula === "string" &&
        id &&
        label.trim() &&
        formula.trim()
        ? [
            {
              id,
              label,
              formula,
              arrange: arrange === true,
              enabled: enabled !== false,
            },
          ]
        : [];
    },
  );
  const key = JSON.stringify(methods);
  if (resolvedCustom?.key !== key) resolvedCustom = { key, methods };
  return resolvedCustom.methods;
}

export const rollMethods = (
  allowed: { inOrder: boolean; arrange: boolean },
  custom: RollMethod[] = [],
): RollMethod[] => [
  { ...IN_ORDER, enabled: allowed.inOrder },
  { ...ARRANGE, enabled: allowed.arrange },
  ...custom,
];

export function allowedScoreMethods(
  allowed: { inOrder: boolean; arrange: boolean; manual: boolean },
  custom: RollMethod[] = [],
): ScoreChoice[] {
  const methods: ScoreChoice[] = rollMethods(allowed, custom).filter(
    (method) => method.enabled,
  );
  if (allowed.manual) methods.push("manual");
  return methods.length ? methods : [IN_ORDER];
}
export type RolledScore = { total: number; dice: number[] };

export type ScoresDraft = {
  method: ScoreChoice;
  formula: string;
  inOrder: Partial<Record<Ability, RolledScore>>;
  pool: (RolledScore | null)[];
  placed: Partial<Record<Ability, number>>;
  manual: Partial<Record<Ability, string>>;
};

export const MIN_SCORE = 3;
export const MAX_SCORE = 18;

export const emptyScoresDraft = (
  method: ScoreChoice = IN_ORDER,
): ScoresDraft => ({
  method,
  formula: method === "manual" ? "" : method.formula,
  inOrder: {},
  pool: ABILITIES.map(() => null),
  placed: {},
  manual: {},
});

export const chooseScoreMethod = (
  draft: ScoresDraft,
  method: ScoreChoice,
): ScoresDraft =>
  method === "manual" || method.formula === draft.formula
    ? { ...draft, method }
    : { ...emptyScoresDraft(method), manual: draft.manual };

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
  const { method } = draft;
  const scores: AbilityScores = {};
  for (const ability of ABILITIES) {
    const value =
      method === "manual"
        ? parseManualScore(draft.manual[ability])
        : method.arrange
          ? draft.pool[draft.placed[ability] ?? -1]?.total
          : draft.inOrder[ability]?.total;
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
  const { method } = draft;
  if (method === "manual") {
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
  const rolled = method.arrange
    ? draft.pool.filter(Boolean).length
    : Object.keys(draft.inOrder).length;
  if (rolled === 0) return "Roll your scores to continue";
  if (!method.arrange)
    return `Roll ${COUNT_WORDS[ABILITIES.length - rolled]} more to continue`;
  const toPlace = ABILITIES.length - Object.keys(draft.placed).length;
  return `Place ${toPlace} more ${toPlace === 1 ? "roll" : "rolls"} to continue`;
}

export function scoresSummary(draft: ScoresDraft): string | undefined {
  if (!scoresComplete(draft)) return undefined;
  const scores = finalScores(draft);
  return ABILITIES.map((ability) => scores[ability]).join(" ");
}
