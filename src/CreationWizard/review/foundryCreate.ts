import type { OSEActor } from "@domain/types";
import { TOME } from "../class/foundryClasses";
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

type ItemSource = Record<string, unknown>;
type CoinDocument = {
  name: string;
  system: { treasure?: boolean };
  toObject(): ItemSource;
};
type CoinPacks = {
  get(id: string): { getDocuments(): Promise<CoinDocument[]> } | undefined;
};
type WritableActor = OSEActor & {
  id: string;
  items: { map<T>(fn: (item: { id: string }) => T): T[] };
  update(data: object): Promise<unknown>;
  createEmbeddedDocuments(type: "Item", data: ItemSource[]): Promise<unknown>;
  deleteEmbeddedDocuments(type: "Item", ids: string[]): Promise<unknown>;
  sheet?: { render(force: boolean): unknown } | null;
};
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

async function itemSources({ gear, gold }: NewCharacter) {
  const [items, coins] = await Promise.all([
    Promise.all(gear.map((line) => cartItemSource(line.uuid, line.quantity))),
    coinSources(gold),
  ]);
  return [...items.flat(), ...coins] as ItemSource[];
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

export function createCharacter(existing?: OSEActor) {
  return async (character: NewCharacter) => {
    try {
      const [items, images] = await Promise.all([
        itemSources(character),
        imageData(character),
      ]);
      const actor = existing
        ? await fill(existing as WritableActor, character, items, images)
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
