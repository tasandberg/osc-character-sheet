import type { OSEActor } from "@domain/types";
import { formatMod } from "@domain/format";

export type ScoreKey = "str" | "int" | "wis" | "dex" | "con" | "cha";

type RawChange = { key: string; mode?: number; type?: string; value: unknown };

type AppliedEffect = {
  uuid: string;
  name: string;
  changes?: RawChange[];
  system?: { changes?: RawChange[] };
};

const MODE_TYPES: Record<number, string> = {
  0: "custom",
  1: "multiply",
  2: "add",
  3: "downgrade",
  4: "upgrade",
  5: "override",
};

const readChanges = (effect: AppliedEffect) =>
  (effect.system?.changes ?? effect.changes ?? []).map((c) => ({
    key: c.key,
    type: c.type ?? MODE_TYPES[c.mode ?? 2] ?? "add",
    value: c.value,
  }));

export interface ScoreContribution {
  id: string;
  name: string;
  type: string;
  amount: string;
}

export interface ScoreBreakdown {
  base: number;
  total: number;
  mod: string;
  contributions: ScoreContribution[];
  limited: boolean;
}

export function selectScoreBreakdown(
  actor: OSEActor,
  key: ScoreKey,
): ScoreBreakdown {
  const path = `system.scores.${key}.value`;
  const score = actor.system.scores[key];
  const base = actor._source?.system?.scores?.[key]?.value ?? score.value;
  const effects =
    (actor as unknown as { appliedEffects?: AppliedEffect[] }).appliedEffects ??
    [];
  const contributions = effects.flatMap((effect) =>
    readChanges(effect)
      .filter((change) => change.key === path)
      .map((change, index) => {
        const value = Number(change.value);
        return {
          id: `${effect.uuid}.${index}`,
          name: effect.name,
          type: change.type,
          amount:
            change.type === "add" && Number.isFinite(value)
              ? formatMod(value)
              : String(change.value),
        };
      }),
  );
  const additive = contributions.every((c) => c.type === "add");
  const sum = contributions.reduce(
    (total, c) => total + (c.type === "add" ? Number(c.amount) || 0 : 0),
    base,
  );
  return {
    base,
    total: score.value,
    mod: formatMod(score.mod),
    contributions,
    limited: additive && sum !== score.value,
  };
}
