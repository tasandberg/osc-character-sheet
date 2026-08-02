import type { OSEActor, RollEvent } from "@domain/types";
import type { ExplorationVM } from "@domain/vm-types";
import { FLAGS, flagDeletePath, flagPath, readFlag } from "@domain/flags";

export interface ExplorationSkill {
  key: string;
  inSix: number;
}

interface SkillMeta {
  key: string;
  label: string;
  icon: string;
  inSix: number;
}

const KNOWN_SKILLS: SkillMeta[] = [
  { key: "ld", label: "Listen at Door", icon: "fas fa-ear-listen", inSix: 1 },
  { key: "od", label: "Open Stuck Door", icon: "fas fa-door-closed", inSix: 2 },
  { key: "sd", label: "Find Secret Door", icon: "fas fa-magnifying-glass", inSix: 1 },
  { key: "ft", label: "Find Trap", icon: "fas fa-radar", inSix: 1 },
  { key: "fg", label: "Forage", icon: "fas fa-mushroom", inSix: 1 },
  { key: "hn", label: "Hunt", icon: "fas fa-bow-arrow", inSix: 1 },
];

function knownSkill(key: string): SkillMeta | undefined {
  return KNOWN_SKILLS.find((s) => s.key === key);
}

function systemTarget(actor: OSEActor, key: string): number | undefined {
  const value = actor.system.exploration?.[key];
  return typeof value === "number" ? value : undefined;
}

export function storedSkills(actor: { flags?: unknown }): ExplorationSkill[] {
  return readFlag<ExplorationSkill[]>(actor, FLAGS.explorationSkills) ?? [];
}

function storedTarget(actor: OSEActor, key: string): number | undefined {
  return storedSkills(actor).find((s) => s.key === key)?.inSix;
}

function explorationTarget(actor: OSEActor, key: string): number {
  return storedTarget(actor, key) ?? systemTarget(actor, key) ?? knownSkill(key)!.inSix;
}

export function selectExploration(actor: OSEActor): ExplorationVM[] {
  return KNOWN_SKILLS.map(({ key, label, icon }) => ({
    key,
    label,
    icon,
    inSix: explorationTarget(actor, key),
  }));
}

function patchSkills(
  skills: ExplorationSkill[],
  key: string,
  inSix: number,
): ExplorationSkill[] {
  if (!skills.some((s) => s.key === key)) return [...skills, { key, inSix }];
  return skills.map((s) => (s.key === key ? { ...s, inSix } : s));
}

export function setTargetUpdate(
  actor: OSEActor,
  key: string,
  inSix: number,
): Record<string, unknown> {
  if (systemTarget(actor, key) === undefined) {
    return {
      [flagPath(FLAGS.explorationSkills)]: patchSkills(storedSkills(actor), key, inSix),
    };
  }
  const stored = storedSkills(actor);
  const remaining = stored.filter((s) => s.key !== key);
  const update: Record<string, unknown> = { [`system.exploration.${key}`]: inSix };
  if (remaining.length === stored.length) return update;
  if (remaining.length) update[flagPath(FLAGS.explorationSkills)] = remaining;
  else update[flagDeletePath(FLAGS.explorationSkills)] = null;
  return update;
}

export function rollExploration(actor: OSEActor, key: string, event?: RollEvent): void {
  if (storedTarget(actor, key) === undefined && systemTarget(actor, key) !== undefined) {
    actor.rollExploration(key, { event });
    return;
  }
  const skill = selectExploration(actor).find((s) => s.key === key);
  if (!skill) return;
  const speaker = ChatMessage.getSpeaker({ actor });
  void new Roll("1d6").toMessage(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { speaker, flavor: `${skill.label} (1d6 ≤ ${skill.inSix})` } as any,
  );
}
