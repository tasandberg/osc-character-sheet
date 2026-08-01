import type { OSEActor, RollEvent } from "@domain/types";
import type { ExplorationVM } from "@domain/vm-types";
import { FLAGS, flagPath, readFlag } from "@domain/flags";

export interface ExplorationSkill {
  key: string;
  inSix: number;
  label?: string;
  icon?: string;
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
  { key: "fg", label: "Forage", icon: "fas fa-mushroom", inSix: 2 },
  { key: "hn", label: "Hunt", icon: "fas fa-bow-arrow", inSix: 1 },
];

const CUSTOM_ICON = "fas fa-dice-d6";
const FALLBACK_IN_SIX = 1;

function knownSkill(key: string): SkillMeta | undefined {
  return KNOWN_SKILLS.find((s) => s.key === key);
}

function systemTarget(actor: OSEActor, key: string): number | undefined {
  const value = actor.system.exploration?.[key];
  return typeof value === "number" ? value : undefined;
}

export function storedSkills(actor: OSEActor): ExplorationSkill[] {
  return readFlag<ExplorationSkill[]>(actor, FLAGS.explorationSkills) ?? [];
}

function storedTarget(actor: OSEActor, key: string): number | undefined {
  return storedSkills(actor).find((s) => s.key === key)?.inSix;
}

function explorationTarget(actor: OSEActor, key: string): number {
  return (
    storedTarget(actor, key) ??
    systemTarget(actor, key) ??
    knownSkill(key)?.inSix ??
    FALLBACK_IN_SIX
  );
}

export function selectExploration(actor: OSEActor): ExplorationVM[] {
  const custom = storedSkills(actor).filter((s) => !knownSkill(s.key));
  return [
    ...KNOWN_SKILLS.map(({ key, label, icon }) => ({
      key,
      label,
      icon,
      inSix: explorationTarget(actor, key),
      custom: false,
    })),
    ...custom.map(({ key, label, icon }) => ({
      key,
      label: label ?? key,
      icon: icon ?? CUSTOM_ICON,
      inSix: explorationTarget(actor, key),
      custom: true,
    })),
  ];
}

function patchSkills(
  skills: ExplorationSkill[],
  key: string,
  patch: Partial<ExplorationSkill>,
): ExplorationSkill[] {
  if (!skills.some((s) => s.key === key)) {
    return [...skills, { key, inSix: knownSkill(key)?.inSix ?? FALLBACK_IN_SIX, ...patch }];
  }
  return skills.map((s) => (s.key === key ? { ...s, ...patch } : s));
}

function skillsUpdate(skills: ExplorationSkill[]): Record<string, unknown> {
  return { [flagPath(FLAGS.explorationSkills)]: skills };
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function freeKey(skills: ExplorationSkill[], label: string): string {
  const base = slugify(label) || "skill";
  const taken = (key: string) => !!knownSkill(key) || skills.some((s) => s.key === key);
  if (!taken(base)) return base;
  let suffix = 2;
  while (taken(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function setTargetUpdate(
  actor: OSEActor,
  key: string,
  inSix: number,
): Record<string, unknown> {
  if (storedTarget(actor, key) === undefined && systemTarget(actor, key) !== undefined) {
    return { [`system.exploration.${key}`]: inSix };
  }
  return skillsUpdate(patchSkills(storedSkills(actor), key, { inSix }));
}

export function addSkillUpdate(actor: OSEActor, label: string): Record<string, unknown> {
  const skills = storedSkills(actor);
  return skillsUpdate([...skills, { key: freeKey(skills, label), label, inSix: FALLBACK_IN_SIX }]);
}

export function renameSkillUpdate(
  actor: OSEActor,
  key: string,
  label: string,
): Record<string, unknown> {
  return skillsUpdate(patchSkills(storedSkills(actor), key, { label }));
}

export function removeSkillUpdate(actor: OSEActor, key: string): Record<string, unknown> {
  return skillsUpdate(storedSkills(actor).filter((s) => s.key !== key));
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
