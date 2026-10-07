import type { OseClass } from "@ose-foundry-core/types";
import type { ClassAbility, ClassDetail, CreationClass } from "../rules";
import { classRuleConstants } from "../rules/classConstants";
import { ABILITIES, type AbilityScores } from "../scores/scoresDraft";
import { parseClassPage } from "./classPage";

export type ClassSet = "classic" | "advanced";

const TOME = "ose-advancedfantasytome";
const TOME_ABILITIES = `${TOME}.abilities`;
const CLASS_BOOKS: Record<ClassSet, string> = {
  classic: "classicfantasycompendium.classic-fantasy-srd",
  advanced: `${TOME}.rules`,
};

type IndexEntry = {
  _id: string;
  name: string;
  folder?: string | null;
  sort?: number;
  system?: { description?: string };
};
type Pack = {
  collection: string;
  documentName: string;
  metadata: { label: string; packageName: string };
  folders: { contents: { id: string; name: string }[] };
  getIndex(options?: { fields: string[] }): Promise<Iterable<IndexEntry>>;
  getDocument(
    id: string,
  ): Promise<
    | { pages: { contents: { name: string; text?: { content?: string } }[] } }
    | undefined
  >;
};
type Packs = { get(id: string): Pack | undefined; contents: Pack[] };

const packs = () => game.packs as unknown as Packs;
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

type ClassMaps = Partial<Record<ClassSet, Record<string, OseClass>>>;
const classMaps = () => (CONFIG.OSE?.classes ?? {}) as ClassMaps;

export function activeClassSet(): ClassSet {
  const advanced = classMaps().advanced;
  return game.modules?.get(TOME)?.active &&
    advanced &&
    Object.keys(advanced).length
    ? "advanced"
    : "classic";
}

function classDefinitions(set: ClassSet): OseClass[] {
  const { classic = {}, advanced = {} } = classMaps();
  return [
    ...Object.values(classic),
    ...(set === "advanced" ? Object.values(advanced) : []),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

function toCreationClass(def: OseClass): CreationClass {
  const constants = classRuleConstants(def.name);
  const [first, second] = def.levels;
  return {
    name: def.name,
    requirements: Object.fromEntries(
      Object.entries(def.requirements ?? {}).filter(([key]) =>
        (ABILITIES as readonly string[]).includes(key),
      ),
    ) as AbilityScores,
    primeRequisites: constants?.primeRequisites ?? [],
    xpModifiers: constants?.xpModifiers,
    hitDie: first?.hd ?? "",
    thac0: first?.thac0 ?? 19,
    nextLevelXp: second?.xp ?? null,
    skills: Object.entries(def.skillChecks?.[0] ?? {}).map(([key, chance]) => ({
      key,
      chance,
    })),
  };
}

export const foundryClasses = (set: ClassSet) =>
  classDefinitions(set).map(toCreationClass);

async function classPageHtml(name: string, set: ClassSet) {
  const pack = packs().get(CLASS_BOOKS[set]);
  if (!pack) return undefined;
  const entries = [...(await pack.getIndex())].filter((e) =>
    /class/i.test(e.name),
  );
  for (const entry of entries) {
    const doc = await pack.getDocument(entry._id);
    const page = doc?.pages.contents.find(
      (p) => squash(p.name) === squash(name),
    );
    if (page) return page.text?.content ?? "";
  }
  return undefined;
}

function findPack(id: string, className: string) {
  const [packageName] = id.split(".");
  return (
    packs().get(id) ??
    packs().contents.find(
      (p) =>
        p.documentName === "Item" &&
        (squash(p.collection) === squash(id) ||
          (p.metadata.packageName === packageName &&
            squash(p.metadata.label).includes(squash(className)))),
    )
  );
}

async function abilitiesIn(pack: Pack, className: string) {
  const index = [
    ...(await pack.getIndex({
      fields: ["system.description", "folder", "sort"],
    })),
  ];
  const folders = pack.folders.contents;
  const folder = folders.find((f) => squash(f.name) === squash(className));
  if (folders.length && !folder) return [];
  return index
    .filter((e) => !folder || e.folder === folder.id)
    .filter((e) => !/level progression$/i.test(e.name))
    .sort(
      (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name),
    )
    .map((e) => ({ name: e.name, description: e.system?.description ?? "" }));
}

async function classAbilities(def: OseClass, set: ClassSet) {
  const candidates = [
    findPack(def.abilitiesPack ?? "", def.name),
    set === "advanced" ? packs().get(TOME_ABILITIES) : undefined,
  ];
  for (const pack of new Set(candidates)) {
    if (!pack) continue;
    const abilities = await abilitiesIn(pack, def.name);
    if (abilities.length) return abilities;
  }
  return [];
}

const SKILL_NAME = /^(.*?)\s*\(([A-Za-z]{2})\)\s*$/;
const sentenceCase = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function splitSkills(abilities: ClassAbility[], skillKeys: string[]) {
  const skillLabels: Record<string, string> = {};
  const rest = abilities.filter(({ name }) => {
    const [, label, key] = name.match(SKILL_NAME) ?? [];
    if (!key || !skillKeys.includes(key.toLowerCase())) return true;
    skillLabels[key.toLowerCase()] = sentenceCase(label);
    return false;
  });
  return { abilities: rest, skillLabels };
}

const enrich = (html: string) =>
  html
    ? foundry.applications.ux.TextEditor.enrichHTML(html, {
        documents: true,
        links: true,
        rolls: true,
      })
    : Promise.resolve("");

async function loadClassDetail(
  def: OseClass,
  set: ClassSet,
): Promise<ClassDetail> {
  const [html, rawAbilities] = await Promise.all([
    classPageHtml(def.name, set),
    classAbilities(def, set),
  ]);
  const page = parseClassPage(html ?? "");
  const { abilities, skillLabels } = splitSkills(
    rawAbilities,
    Object.keys(def.skillChecks?.[0] ?? {}),
  );
  return {
    ...page,
    description: await enrich(page.description),
    abilities: await Promise.all(
      abilities.map(async (a) => ({
        name: a.name,
        description: await enrich(a.description),
      })),
    ),
    skillLabels,
  };
}

export function foundryClassDetail(set: ClassSet) {
  const cache = new Map<string, Promise<ClassDetail>>();
  return (name: string) => {
    const def = classDefinitions(set).find((d) => d.name === name);
    if (!def) return Promise.reject(new Error(`Unknown class ${name}`));
    if (!cache.has(name)) {
      const load = loadClassDetail(def, set);
      load.catch(() => cache.delete(name));
      cache.set(name, load);
    }
    return cache.get(name)!;
  };
}
