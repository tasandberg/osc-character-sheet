import { composeTag } from "@features/abilities/features";
import type { MonsterActor, MonsterItem, MonsterSaveKey } from "./types";

export type MonsterSettings = { ascendingAC: boolean; morale: boolean };

export type EditableStat = { label: string; value: string; path: string };

export type DocumentLink = { uuid: string; label: string | null };

export type AttackRow = {
  id: string;
  name: string;
  pattern: string;
  damage: string | null;
  bonus: number | null;
  slow: boolean;
  save: string | null;
  uses: { value: number; max: number } | null;
  exhausted: boolean;
};

export type AttackGroup = {
  pattern: string;
  coloured: boolean;
  attacks: AttackRow[];
};

export type AbilityEntry = {
  id: string;
  name: string;
  description: string;
  rollTag: string | null;
  save: string | null;
  pattern: string;
};

export type SaveEntry = { key: MonsterSaveKey; label: string; value: string };

export const SAVE_LABELS: Record<MonsterSaveKey, string> = {
  death: "Death",
  wand: "Wand",
  paralysis: "Paralysis",
  breath: "Breath",
  spell: "Spell",
};

const SAVE_ORDER: MonsterSaveKey[] = [
  "death",
  "wand",
  "paralysis",
  "breath",
  "spell",
];

const UNGROUPED_PATTERNS = new Set(["white", "transparent"]);

export const EMPTY_VALUE = "—";

const SHORT_TABLE_NAME = 12;

const text = (value: unknown) => (value == null ? "" : String(value).trim());

function formatXp(xp: unknown): string {
  return typeof xp === "number" ? xp.toLocaleString("en-US") : text(xp);
}

function signed(value: unknown): string {
  const n = Number(value);
  if (value == null || text(value) === "" || !Number.isFinite(n)) return "";
  return n >= 0 ? `+${n}` : String(n);
}

export function isRollableFormula(formula: string): boolean {
  const trimmed = formula.trim();
  if (!/\d*d\d+/i.test(trimmed)) return false;
  const roll = (globalThis as { Roll?: { validate?: (f: string) => boolean } })
    .Roll;
  return roll?.validate ? roll.validate(trimmed) : true;
}

export function parseDocumentLink(
  link: string | null | undefined,
): DocumentLink | null {
  const match = link?.match(/@(\w+)\[([^\]]+)\](?:\{([^}]*)\})?/);
  if (!match) return null;
  const [, kind, target, label] = match;
  return {
    uuid: kind === "UUID" ? target : `${kind}.${target}`,
    label: label ?? null,
  };
}

export function treasureLabel(name: string): string {
  if (name.length <= SHORT_TABLE_NAME) return name.trim();
  return name.replace(/^type\s+/i, "").trim();
}

const normaliseMovement = (value: string) =>
  value.toLowerCase().replace(/[’'′`\s]/g, "");

function movement(actor: MonsterActor) {
  const base = text(actor.system.movement?.base);
  const rawEncounter = actor.system.movement?.encounter;
  const encounter = text(
    typeof rawEncounter === "number" ? Math.floor(rawEncounter) : rawEncounter,
  );
  const primary = base
    ? encounter
      ? `${base}′ (${encounter}′)`
      : `${base}′`
    : EMPTY_VALUE;
  const details = text(actor.system.details.movement);
  const footnote =
    details && normaliseMovement(details) !== normaliseMovement(primary)
      ? details
      : null;
  return { base, display: primary, details, footnote };
}

const saveLabel = (save: string | undefined) =>
  save
    ? `save vs ${(SAVE_LABELS[save as MonsterSaveKey] ?? save).toLowerCase()}`
    : null;

function attackRow(item: MonsterItem, pattern: string): AttackRow {
  const max = Number(item.system.counter?.max) || 0;
  const value = Number(item.system.counter?.value) || 0;
  const damage = text(item.system.damage);
  const bonus = Number(item.system.bonus) || 0;
  return {
    id: item.id,
    name: item.name,
    pattern,
    damage: damage && damage !== "0" ? damage : null,
    bonus: bonus || null,
    slow: !!item.system.slow,
    save: saveLabel(item.system.save),
    uses: max > 0 ? { value: Math.max(0, value), max } : null,
    exhausted: max > 0 && value <= 0,
  };
}

function attackGroups(patterns: Record<string, MonsterItem[]>): AttackGroup[] {
  return Object.entries(patterns)
    .map(([pattern, items]) => ({
      pattern,
      coloured: !UNGROUPED_PATTERNS.has(pattern),
      attacks: items
        .filter((item) => item.type === "weapon")
        .map((item) => attackRow(item, pattern)),
    }))
    .filter((group) => group.attacks.length > 0);
}

function abilities(items: MonsterItem[]): AbilityEntry[] {
  return items.map((item) => {
    const roll = text(item.system.roll);
    return {
      id: item.id,
      name: item.name,
      description: text(item.system.description),
      rollTag: roll
        ? composeTag(roll, item.system.rollType, item.system.rollTarget)
        : null,
      save: saveLabel(item.system.save),
      pattern: item.system.pattern || "transparent",
    };
  });
}

export function selectMonster(actor: MonsterActor, settings: MonsterSettings) {
  const { system } = actor;
  const { details } = system;
  const acSource = settings.ascendingAC ? system.aac : system.ac;
  const ac = text(acSource?.value);
  const armourClass: EditableStat = {
    label: settings.ascendingAC ? "Ascending AC" : "Armour Class",
    value: ac,
    path: settings.ascendingAC ? "system.aac.value" : "system.ac.value",
  };
  const attack: EditableStat = settings.ascendingAC
    ? {
        label: "Attack",
        value: signed(system.thac0?.bba),
        path: "system.thac0.bba",
      }
    : {
        label: "THAC0",
        value: text(system.thac0?.value),
        path: "system.thac0.value",
      };
  const hd = text(system.hp.hd);
  const morale = text(details.morale);
  const appearing = {
    dungeon: text(details.appearing?.d),
    lair: text(details.appearing?.w),
  };
  const treasureLink = parseDocumentLink(details.treasure?.table);

  return {
    name: actor.name,
    img: actor.img,
    alignment: text(details.alignment),
    xp: formatXp(details.xp),
    hp: {
      value: text(system.hp.value),
      max: text(system.hp.max),
      rollable: isRollableFormula(hd),
    },
    hitDice: {
      value: hd,
      rollable: isRollableFormula(hd),
    },
    armourClass,
    attack,
    movement: movement(actor),
    morale: settings.morale
      ? { value: morale, rollable: Number(morale) > 0 }
      : null,
    loyalty: system.retainer?.enabled ? text(system.retainer.loyalty) : null,
    appearing: {
      ...appearing,
      rollableDungeon: isRollableFormula(appearing.dungeon),
      rollableLair: isRollableFormula(appearing.lair),
    },
    treasure: treasureLink,
    saves: SAVE_ORDER.map<SaveEntry>((key) => ({
      key,
      label: SAVE_LABELS[key],
      value: text(system.saves?.[key]?.value),
    })),
    needsSaves: !!system.isNew,
    attackGroups: attackGroups(system.attackPatterns ?? {}),
    abilities: abilities(system.abilities ?? []),
  };
}

export type MonsterView = ReturnType<typeof selectMonster>;

export function nextPattern(current: string, colours: string[]): string {
  const cycle = [...colours, "transparent"];
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}
