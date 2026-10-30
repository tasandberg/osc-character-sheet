import {
  ABILITIES,
  abbreviation,
  type Ability,
  type AbilityScores,
} from "./scoresDraft";

export type ClassRequirements = {
  name: string;
  requirements: Partial<Record<Ability, number>>;
};

export type ClassStanding = {
  name: string;
  status: "open" | "pending" | "failed";
  note: string;
};

export function classStanding(
  { name, requirements }: ClassRequirements,
  scores: AbilityScores,
): ClassStanding {
  const required = (Object.keys(requirements) as Ability[]).filter((a) =>
    ABILITIES.includes(a),
  );
  const describe = (a: Ability) => `${abbreviation(a)} ${requirements[a]}`;
  if (required.some((a) => (scores[a] ?? Infinity) < requirements[a]!))
    return { name, status: "failed", note: required.map(describe).join(", ") };
  const unknown = required.filter((a) => scores[a] === undefined);
  if (unknown.length)
    return {
      name,
      status: "pending",
      note: unknown.map((a) => `${describe(a)}+`).join(", "),
    };
  return { name, status: "open", note: "" };
}
