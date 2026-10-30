import type {
  Alignment,
  ClassLevel,
  ClassRestrictions,
  CreationClass,
} from "../rules";
import type { PortraitDraft } from "../portrait/portraitDraft";
import { ordinal } from "../race/raceDraft";

export const ALIGNMENTS: { value: Alignment; label: string }[] = [
  { value: "lawful", label: "Lawful" },
  { value: "neutral", label: "Neutral" },
  { value: "chaotic", label: "Chaotic" },
];

export type HitPoints = {
  value: string;
  formula: string;
  dice?: number[];
  maximum?: boolean;
};

export type DetailsDraft = {
  name: string;
  portrait?: PortraitDraft;
  alignment?: Alignment;
  level: number;
  hitPoints?: HitPoints;
};

export const emptyDetailsDraft = (): DetailsDraft => ({
  name: "",
  level: 1,
});

export function levelCap(cls: CreationClass, restrictions?: ClassRestrictions) {
  const raceMax = restrictions?.maxLevel?.(cls.name) ?? Infinity;
  return Math.max(1, Math.min(cls.levels.length, raceMax));
}

export const hitPointFormula = (hd: string, conMod: number, level: number) =>
  `max(${hd} + ${conMod * level}, ${hd[0]})`;

export type CharacterDetails = {
  level: number;
  cap: number;
  row: ClassLevel;
  nextXp: number | null;
  conBonus: number;
  formula: string;
  hitPoints?: HitPoints;
};

type DetailsInput = {
  draft: DetailsDraft;
  cls: CreationClass;
  restrictions?: ClassRestrictions;
  conMod: number;
  maximum?: (formula: string) => number;
};

export function characterDetails({
  draft,
  cls,
  restrictions,
  conMod,
  maximum,
}: DetailsInput): CharacterDetails {
  const cap = levelCap(cls, restrictions);
  const level = Math.min(Math.max(1, draft.level), cap);
  const row = cls.levels[level - 1];
  const formula = hitPointFormula(row.hd, conMod, level);
  const kept =
    draft.hitPoints?.formula === formula ? draft.hitPoints : undefined;
  const maxed =
    maximum && level === 1
      ? { value: String(maximum(formula)), formula, maximum: true }
      : undefined;
  return {
    level,
    cap,
    row,
    nextXp: cls.levels[level]?.xp ?? null,
    conBonus: conMod * level,
    formula,
    hitPoints: kept ?? maxed,
  };
}

export const parseHitPoints = (text: string | undefined) =>
  text && /^\d+$/.test(text.trim()) && Number(text) >= 1
    ? Number(text)
    : undefined;

export function detailsBlockedReason(
  draft: DetailsDraft,
  details: CharacterDetails,
): string | undefined {
  if (!draft.name.trim()) return "Name your character to continue";
  if (!draft.alignment) return "Choose an alignment to continue";
  const text = details.hitPoints?.value.trim();
  if (!text) return "Roll hit points to continue";
  if (parseHitPoints(text) === undefined) return "Hit points start at 1";
  return undefined;
}

export const detailsSummary = (
  draft: DetailsDraft,
  details: CharacterDetails,
) =>
  detailsBlockedReason(draft, details)
    ? undefined
    : `${ordinal(details.level)} level · ${parseHitPoints(details.hitPoints?.value)} hp`;

export const spellSlots = (row: ClassLevel) =>
  (row.spells ?? [])
    .map((count, i) => ({ level: ordinal(i + 1), count }))
    .filter(({ count }) => count > 0);
