import type { OSEActor } from "@domain/types";
import type { ClassItems, ItemSource } from "../class/classItems";
import { TOME } from "../compendium";
import {
  PortraitUploadReportedError,
  portraitImageUploader,
} from "@features/portraitImage/applyPortraitImage";
import { cartItemSource } from "../gear/foundryGear";
import type { NewCharacter } from "./newCharacter";

const COIN_PACKS = [
  "classicfantasycompendium.equipment-coins",
  `${TOME}.equipment`,
];

type CoinDocument = {
  name: string;
  system: { treasure?: boolean };
  toObject(): ItemSource;
};
type CoinPacks = {
  get(id: string): { getDocuments(): Promise<CoinDocument[]> } | undefined;
};
type EmbeddedItem = { id: string };
type WritableActor = Omit<OSEActor, "items"> & {
  id: string;
  items: { map<T>(fn: (item: EmbeddedItem) => T): T[] };
  update(data: object): Promise<unknown>;
  createEmbeddedDocuments(type: "Item", data: ItemSource[]): Promise<unknown>;
  deleteEmbeddedDocuments(type: "Item", ids: string[]): Promise<unknown>;
  sheet?: { render(force: boolean): unknown } | null;
};
type AbilityDocument = {
  name: string;
  pack?: string | null;
  system?: { requirements?: string; targetFrom?: string };
  toObject(): ItemSource;
};
type AbilityLink = { uuid: string; level: number; target?: string };
type GrantingSource = {
  type: string;
  system: { key?: string; abilities?: AbilityLink[] };
};
type OwnedAbility = { name: string; requirements: string; source: string };
type ActorDocumentClass = {
  create(data: object): Promise<WritableActor | undefined>;
};

const denomination = (name: string) =>
  (name.match(/\((pp|gp|ep|sp|cp)\)/i) ??
    name.match(/^\s*(pp|gp|ep|sp|cp)\s*$/i))?.[1]?.toLowerCase();

async function packCoins() {
  const coins = new Map<string, CoinDocument>();
  for (const id of COIN_PACKS) {
    const pack = (game.packs as unknown as CoinPacks).get(id);
    for (const doc of (await pack?.getDocuments()) ?? []) {
      const denom = doc.system.treasure && denomination(doc.name);
      if (denom && !coins.has(denom)) coins.set(denom, doc);
    }
  }
  return coins;
}

async function coinSources(gold: number) {
  return [...(await packCoins())].map(([denom, coin]) => {
    const source = coin.toObject();
    foundry.utils.setProperty(
      source,
      "system.quantity.value",
      denom === "gp" ? gold : 0,
    );
    return source;
  });
}

const abilityKey = (name: string, requirements: string) =>
  `${name}|${requirements}`.toLocaleLowerCase().trim();

const isAbilityOwned = (
  owned: OwnedAbility[],
  candidate: { name: string; requirements: string; uuid: string },
) =>
  owned.some(
    (o) =>
      (o.source && o.source === candidate.uuid) ||
      abilityKey(o.name, o.requirements) ===
        abilityKey(candidate.name, candidate.requirements),
  );

const embeddable = (doc: AbilityDocument) =>
  doc.pack
    ? (
        game.items as unknown as { fromCompendium(d: object): ItemSource }
      ).fromCompendium(doc)
    : doc.toObject();

async function grantedAbilities(
  item: ItemSource,
  level: number,
  owned: OwnedAbility[],
) {
  const { type, system } = item as unknown as GrantingSource;
  const scope = game.system.id;
  const grantedBy = { type, key: system.key };
  const sources: ItemSource[] = [];
  for (const entry of (system.abilities ?? []).filter(
    (a) => a.level <= level,
  )) {
    const doc = (await fromUuid(entry.uuid)) as AbilityDocument | null;
    if (!doc) continue;
    const requirements = doc.system?.requirements ?? "";
    if (isAbilityOwned(owned, { name: doc.name, requirements, uuid: entry.uuid }))
      continue;
    owned.push({ name: doc.name, requirements, source: entry.uuid });
    const target = type === "class" ? entry.target || doc.system?.targetFrom : "";
    const flags = {
      grantedBy,
      ...(target && { classTarget: { classKey: system.key, target } }),
    };
    sources.push(
      foundry.utils.mergeObject(embeddable(doc), { flags: { [scope]: flags } }),
    );
  }
  return sources;
}

async function grantedSources(
  classSource: ItemSource,
  level: number,
  race: ItemSource | undefined,
) {
  const owned: OwnedAbility[] = [];
  const fromClass = await grantedAbilities(classSource, level, owned);
  const fromRace = race ? await grantedAbilities(race, 1, owned) : [];
  return [classSource, ...fromClass, ...(race ? [race] : []), ...fromRace];
}

async function itemSources(
  classItems: ClassItems,
  { class: cls, gear, gold, race }: NewCharacter,
) {
  const [granted, items, coins] = await Promise.all([
    grantedSources(classItems.source(cls), cls.level, race?.source),
    Promise.all(gear.map((line) => cartItemSource(line.uuid, line.quantity))),
    coinSources(gold),
  ]);
  return [...granted, ...items.flat(), ...coins] as ItemSource[];
}

async function imageData({ name, portrait, token }: NewCharacter) {
  const upload = portraitImageUploader(name);
  return {
    ...(portrait && { img: await upload(portrait) }),
    ...(token && { "prototypeToken.texture.src": await upload(token) }),
  };
}

type Images = Record<string, string>;

async function fill(
  actor: WritableActor,
  character: NewCharacter,
  items: ItemSource[],
  images: Images,
) {
  await actor.deleteEmbeddedDocuments(
    "Item",
    actor.items.map((item) => item.id),
  );
  await actor.update({
    ...foundry.utils.flattenObject({
      name: character.name,
      system: character.system,
    }),
    ...images,
  });
  await actor.createEmbeddedDocuments("Item", items);
  return actor;
}

const create = (character: NewCharacter, items: ItemSource[], images: Images) =>
  (CONFIG.Actor.documentClass as unknown as ActorDocumentClass).create({
    ...foundry.utils.expandObject(images),
    name: character.name,
    type: "character",
    system: character.system,
    items,
  });

export function createCharacter(classItems: ClassItems, existing?: OSEActor) {
  return async (character: NewCharacter) => {
    try {
      const [items, images] = await Promise.all([
        itemSources(classItems, character),
        imageData(character),
      ]);
      const actor = existing
        ? await fill(
            existing as unknown as WritableActor,
            character,
            items,
            images,
          )
        : await create(character, items, images);
      if (!actor) throw new Error("Foundry didn’t create the actor.");
      actor.sheet?.render(true);
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof PortraitUploadReportedError) return false;
      ui.notifications?.error(
        `Couldn’t create ${character.name}: ${(error as Error).message}`,
      );
      return false;
    }
  };
}
