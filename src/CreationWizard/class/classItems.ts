import type {
  ClassItemData,
  ClassLevelRow,
} from "@ose-foundry-core/types";
import { enrich, packs, TOME } from "../compendium";
import type { ClassDetail, ClassStats, CreationClass } from "../rules";
import {
  ABILITIES,
  type Ability,
  type AbilityScores,
} from "../scores/scoresDraft";

const SAVE_KEYS = ["death", "wand", "paralysis", "breath", "spell"];
const SPELL_LEVELS = ["1", "2", "3", "4", "5", "6"];

type LevelRow = ClassLevelRow;

export type ClassItemSystem = Pick<
  ClassItemData,
  | "key"
  | "description"
  | "requirements"
  | "maxLevel"
  | "hitDie"
  | "languages"
  | "levels"
  | "tables"
  | "abilities"
  | "armourText"
  | "weaponsText"
  | "demihuman"
> & { primeReqs: { ability: string }[] };

export type ClassItemDoc = {
  uuid: string;
  name: string;
  type: string;
  pack?: string | null;
  system: ClassItemSystem;
  toObject(): ItemSource;
};

export type ItemSource = Record<string, unknown>;

type AbilityDoc = { name: string; system?: { description?: string } };

type TransientActor = {
  items: {
    find(fn: (item: EmbeddedClass) => boolean): EmbeddedClass | undefined;
  };
  system: {
    scores: Record<Ability, { value: number; mod: number }>;
    details: { xp: { value: number } };
    hp: { hd: string };
    thac0: { value: number; bba: number };
    saves: Record<string, { value: number }>;
    spells: { slots?: Record<string, { max?: number } | undefined> };
    classXpBonus(cls: EmbeddedClass): number;
  };
};

type EmbeddedClass = {
  type: string;
  system: { levels: LevelRow[]; nextRow: LevelRow | null };
};

const isAbility = (key: string): key is Ability =>
  (ABILITIES as readonly string[]).includes(key);

function minimumScores(
  requirements: ClassItemData["requirements"] | undefined,
) {
  const out: Partial<Record<Ability, number>> = {};
  for (const [ability, bound] of Object.entries(requirements ?? {})) {
    if (isAbility(ability) && bound?.min) out[ability] = bound.min;
  }
  return out;
}

export function creationClassFrom(doc: ClassItemDoc): CreationClass {
  const s = doc.system;
  return {
    uuid: doc.uuid,
    key: s.key || doc.name,
    name: doc.name,
    requirements: minimumScores(s.requirements),
    primeRequisites: [
      ...new Set(s.primeReqs.map((r) => r.ability.toLowerCase())),
    ].filter(isAbility),
    hitDie: s.hitDie,
    maxLevel: Math.max(1, Math.min(s.maxLevel || Infinity, s.levels.length)),
    languages: s.languages ?? [],
    demihuman: !!s.demihuman,
    casts: s.levels.some((row) =>
      Object.values(row.spellSlots ?? {}).some((n) => n > 0),
    ),
    armour: s.armourText || undefined,
    weapons: s.weaponsText || undefined,
    tables: s.tables ?? [],
    ...(s.levels.length === 0 && { unusable: "has no level table" }),
  };
}

export function transientCharacter(
  scores: AbilityScores,
  items: ItemSource[] = [],
): TransientActor {
  const ActorClass = CONFIG.Actor.documentClass as unknown as new (
    data: object,
  ) => TransientActor;
  return new ActorClass({
    name: "New character",
    type: "character",
    system: {
      scores: Object.fromEntries(
        ABILITIES.map((a) => [a, { value: scores[a] ?? 0, bonus: 0 }]),
      ),
    },
    items,
  });
}

type WorldItems = {
  filter(fn: (item: ClassItemDoc) => boolean): ClassItemDoc[];
  some(fn: (item: ClassItemDoc) => boolean): boolean;
};

const isClass = (entry: { type?: string }) => entry.type === "class";

const worldItems = () => game.items as unknown as WorldItems | undefined;

const itemPacks = () =>
  (packs()?.contents ?? []).filter((pack) => pack.documentName === "Item");

export function hasClassItems(): boolean {
  return (
    !!worldItems()?.some(isClass) ||
    itemPacks().some((pack) => pack.index.some(isClass))
  );
}

export async function loadClassItems(): Promise<ClassItemDoc[]> {
  const world = worldItems()?.filter(isClass) ?? [];
  const fromPacks = await Promise.all(
    itemPacks().map(async (pack) => {
      try {
        const ids = [...(await pack.getIndex())]
          .filter(isClass)
          .map((entry) => entry._id);
        return ids.length
          ? ((await pack.getDocuments({ _id__in: ids })) as ClassItemDoc[])
          : [];
      } catch (error) {
        console.warn(`Skipped ${pack.collection}`, error);
        return [];
      }
    }),
  );
  const tome = (doc: ClassItemDoc) => doc.pack?.startsWith(`${TOME}.`);
  const byKey = new Map<string, ClassItemDoc>();
  for (const doc of [
    ...world,
    ...fromPacks.flat().filter(tome),
    ...fromPacks.flat().filter((doc) => !tome(doc)),
  ]) {
    const key = doc.system.key || doc.name;
    if (!byKey.has(key)) byKey.set(key, doc);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const withProgress = (source: ItemSource, level: number): ItemSource => {
  const system = (source.system ?? {}) as { levels?: LevelRow[] };
  const levels = system.levels ?? [];
  return {
    ...source,
    system: {
      ...system,
      level,
      xp: levels[Math.min(level, levels.length) - 1]?.xp ?? 0,
    },
  };
};

export type ClassProgress = { uuid: string; level: number; xp: number };

export class ClassItems {
  #docs = new Map<string, ClassItemDoc>();
  #stats = new Map<string, ClassStats>();
  #bonuses = new Map<string, number>();
  #details = new Map<string, Promise<ClassDetail>>();

  constructor(docs: ClassItemDoc[]) {
    for (const doc of docs) this.#docs.set(doc.uuid, doc);
  }

  get classes() {
    return [...this.#docs.values()].map(creationClassFrom);
  }

  source({ uuid, level }: Pick<ClassProgress, "uuid" | "level">) {
    const doc = this.#docs.get(uuid);
    if (!doc) throw new Error(`Unknown class ${uuid}`);
    const base = doc.pack
      ? (
          game.items as unknown as { fromCompendium(d: object): ItemSource }
        ).fromCompendium(doc)
      : doc.toObject();
    return withProgress(base, level);
  }

  stats(cls: CreationClass, level: number): ClassStats {
    const key = `${cls.uuid}@${level}`;
    let stats = this.#stats.get(key);
    if (!stats) {
      const actor = transientCharacter({}, [
        this.source({ uuid: cls.uuid, level }),
      ]);
      const item = actor.items.find((i) => i.type === "class")!;
      const { details, hp, thac0, saves, spells } = actor.system;
      stats = {
        xp: details.xp.value,
        nextXp: item.system.nextRow?.xp ?? null,
        hd: hp.hd,
        thac0: thac0.value,
        bba: thac0.bba,
        saves: SAVE_KEYS.map((k) => saves[k]?.value ?? 0),
        spellSlots: SPELL_LEVELS.map((lvl) => spells.slots?.[lvl]?.max ?? 0),
        conLevels: item.system.levels.slice(0, level).filter((r) => r.hdcon)
          .length,
      };
      this.#stats.set(key, stats);
    }
    return stats;
  }

  xpBonus(cls: CreationClass, scores: AbilityScores): number {
    const key = `${cls.uuid}@${ABILITIES.map((a) => scores[a] ?? "").join(",")}`;
    let bonus = this.#bonuses.get(key);
    if (bonus === undefined) {
      const actor = transientCharacter(scores, [
        this.source({ uuid: cls.uuid, level: 1 }),
      ]);
      const item = actor.items.find((i) => i.type === "class")!;
      bonus = actor.system.classXpBonus(item) ?? 0;
      this.#bonuses.set(key, bonus);
    }
    return bonus;
  }

  detail(uuid: string): Promise<ClassDetail> {
    const doc = this.#docs.get(uuid);
    if (!doc) return Promise.reject(new Error(`Unknown class ${uuid}`));
    if (!this.#details.has(uuid)) {
      const load = loadDetail(doc);
      load.catch(() => this.#details.delete(uuid));
      this.#details.set(uuid, load);
    }
    return this.#details.get(uuid)!;
  }
}

async function loadDetail(doc: ClassItemDoc): Promise<ClassDetail> {
  const abilities = await Promise.all(
    [...doc.system.abilities]
      .sort((a, b) => a.level - b.level)
      .map(async ({ uuid, level }) => {
        const ability = (await fromUuid(uuid)) as AbilityDoc | null;
        return ability
          ? {
              name: ability.name,
              description: await enrich(ability.system?.description ?? ""),
              level,
            }
          : [];
      }),
  );
  return {
    description: await enrich(doc.system.description ?? ""),
    abilities: abilities.flat(),
  };
}
