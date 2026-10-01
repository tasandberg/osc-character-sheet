import { composeTag } from "@features/abilities/features";
import type { MonsterActor, MonsterItem, MonsterSaveKey } from "./types";

export type MonsterSettings = { ascendingAC: boolean; morale: boolean };

export type EditableStat = {
  label: string;
  display: string;
  value: string;
  path: string;
};

export type DocumentLink = { uuid: string; label: string | null };

export type AttackRow = {
  id: string;
  name: string;
  pattern: string;
  count: number | null;
  damage: string | null;
  bonus: number | null;
  slow: boolean;
  save: string | null;
  uses: { value: number; max: number } | null;
  exhausted: boolean;
  alternative: boolean;
};

export type AbilityEntry = {
  id: string;
  name: string;
  description: string;
  rollTag: string | null;
  save: string | null;
};

export type SpellEntry = {
  id: string;
  name: string;
  cast: number;
  memorized: number;
};

export type SaveEntry = { key: MonsterSaveKey; label: string; value: string };

export const SAVE_LABELS: Record<MonsterSaveKey, string> = {
  death: "Death",
  wand: "Wands",
  paralysis: "Paralysis",
  breath: "Breath",
  spell: "Spells",
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

const text = (value: unknown) => (value == null ? "" : String(value).trim());

function formatXp(xp: unknown): string {
  return typeof xp === "number" ? xp.toLocaleString("en-US") : text(xp);
}

const orDash = (value: string) => value || EMPTY_VALUE;

function signed(value: unknown): string {
  const n = Number(value);
  if (value == null || text(value) === "" || !Number.isFinite(n))
    return EMPTY_VALUE;
  return n >= 0 ? `+${n}` : String(n);
}

export function isRollableFormula(formula: string): boolean {
  const trimmed = formula.trim();
  if (!/\d*d\d+/i.test(trimmed)) return false;
  const roll = (globalThis as { Roll?: { validate?: (f: string) => boolean } })
    .Roll;
  return roll?.validate ? roll.validate(trimmed) : true;
}

export function hitDiceLabel(hd: string, specialAbilities: unknown): string {
  const stars = "*".repeat(
    Math.max(0, Number.parseInt(text(specialAbilities), 10) || 0),
  );
  const formula = hd.replace(/\s+/g, "");
  if (!formula) return EMPTY_VALUE;
  if (/^1d4$/i.test(formula)) return `½${stars}`;
  if (/^1d1$/i.test(formula)) return `1hp${stars}`;
  const d8 = formula.match(/^(\d+)d8([+-]\d+)?$/i);
  return `${d8 ? `${d8[1]}${d8[2] ?? ""}` : hd.trim()}${stars}`;
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
  return name.replace(/^type\s+/i, "").trim();
}

const normaliseMovement = (value: string) =>
  value.toLowerCase().replace(/[’'′`\s]/g, "");

function movement(actor: MonsterActor) {
  const base = text(actor.system.movement?.base);
  const encounter = text(actor.system.movement?.encounter);
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
  return { base, display: primary, footnote };
}

const saveLabel = (save: string | undefined) =>
  save
    ? `save vs ${(SAVE_LABELS[save as MonsterSaveKey] ?? save).toLowerCase()}`
    : null;

function attackRows(patterns: Record<string, MonsterItem[]>): AttackRow[] {
  let colouredGroups = 0;
  return Object.entries(patterns).flatMap(([pattern, items]) => {
    const weapons = items.filter((item) => item.type === "weapon");
    if (!weapons.length) return [];
    const startsAlternative =
      !UNGROUPED_PATTERNS.has(pattern) && colouredGroups++ > 0;
    return weapons.map((item, index) => {
      const max = Number(item.system.counter?.max) || 0;
      const value = Number(item.system.counter?.value) || 0;
      const damage = text(item.system.damage);
      const bonus = Number(item.system.bonus) || 0;
      return {
        id: item.id,
        name: item.name,
        pattern,
        count: max > 0 ? max : null,
        damage: damage && damage !== "0" ? damage : null,
        bonus: bonus || null,
        slow: !!item.system.slow,
        save: saveLabel(item.system.save),
        uses: max > 0 ? { value: Math.max(0, value), max } : null,
        exhausted: max > 0 && value <= 0,
        alternative: startsAlternative && index === 0,
      };
    });
  });
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
    };
  });
}

function spellLevels(actor: MonsterActor) {
  const spells = actor.system.spells;
  if (!spells?.enabled) return [];
  return Object.entries(spells.spellList ?? {})
    .filter(([, list]) => list.length > 0)
    .map(([level, list]) => ({
      level: Number(level),
      spells: list.map<SpellEntry>((spell) => ({
        id: spell.id,
        name: spell.name,
        cast: Number(spell.system.cast) || 0,
        memorized: Number(spell.system.memorized) || 0,
      })),
    }));
}

export function selectMonster(actor: MonsterActor, settings: MonsterSettings) {
  const { system } = actor;
  const { details } = system;
  const acSource = settings.ascendingAC ? system.aac : system.ac;
  const ac = text(acSource?.value);
  const armourClass: EditableStat = {
    label: settings.ascendingAC ? "Ascending AC" : "Armour Class",
    display: orDash(ac),
    value: ac,
    path: settings.ascendingAC ? "system.aac.value" : "system.ac.value",
  };
  const attack: EditableStat = settings.ascendingAC
    ? {
        label: "Attack",
        display: signed(system.thac0?.bba),
        value: text(system.thac0?.bba),
        path: "system.thac0.bba",
      }
    : {
        label: "THAC0",
        display: orDash(text(system.thac0?.value)),
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
    xp: { display: formatXp(details.xp), value: text(details.xp) },
    hp: {
      value: text(system.hp.value),
      max: text(system.hp.max),
      rollable: isRollableFormula(hd),
    },
    hitDice: {
      display: hitDiceLabel(hd, details.specialAbilities),
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
    treasure: treasureLink
      ? {
          ...treasureLink,
          label: treasureLink.label ? treasureLabel(treasureLink.label) : null,
        }
      : null,
    saves: SAVE_ORDER.map<SaveEntry>((key) => ({
      key,
      label: SAVE_LABELS[key],
      value: text(system.saves?.[key]?.value),
    })),
    needsSaves: !!system.isNew,
    attacks: attackRows(system.attackPatterns ?? {}),
    abilities: abilities(system.abilities ?? []),
    spellLevels: spellLevels(actor),
  };
}

export type MonsterView = ReturnType<typeof selectMonster>;

export function nextPattern(current: string, colours: string[]): string {
  const cycle = [...colours, "transparent"];
  return cycle[(cycle.indexOf(current) + 1) % cycle.length];
}
