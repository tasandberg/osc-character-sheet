import type { OSEActor } from "@domain/types";
import { cartItemSource } from "../gear/foundryGear";
import type { NewCharacter } from "./newCharacter";

const COIN_PACK = "classicfantasycompendium.equipment-coins";

type ItemSource = Record<string, unknown>;
type CoinDocument = { name: string; toObject(): ItemSource };
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
  name.match(/\((pp|gp|ep|sp|cp)\)/i)?.[1]?.toLowerCase();

async function coinSources(gold: number) {
  const pack = (
    game.packs as unknown as {
      get(id: string): { getDocuments(): Promise<CoinDocument[]> } | undefined;
    }
  ).get(COIN_PACK);
  if (!pack) throw new Error("The coins compendium isn’t available.");
  return (await pack.getDocuments()).map((coin) => {
    const source = coin.toObject();
    foundry.utils.setProperty(
      source,
      "system.quantity.value",
      denomination(coin.name) === "gp" ? gold : 0,
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

async function fill(
  actor: WritableActor,
  character: NewCharacter,
  items: ItemSource[],
) {
  await actor.deleteEmbeddedDocuments(
    "Item",
    actor.items.map((item) => item.id),
  );
  await actor.update(
    foundry.utils.flattenObject({
      name: character.name,
      system: character.system,
    }),
  );
  await actor.createEmbeddedDocuments("Item", items);
  return actor;
}

const create = (character: NewCharacter, items: ItemSource[]) =>
  (CONFIG.Actor.documentClass as unknown as ActorDocumentClass).create({
    name: character.name,
    type: "character",
    system: character.system,
    items,
  });

export function createCharacter(existing?: OSEActor) {
  return async (character: NewCharacter) => {
    try {
      const items = await itemSources(character);
      const actor = existing
        ? await fill(existing as WritableActor, character, items)
        : await create(character, items);
      if (!actor) throw new Error("Foundry didn’t create the actor.");
      actor.sheet?.render(true);
      return true;
    } catch (error) {
      console.error(error);
      ui.notifications?.error(
        `Couldn’t create ${character.name}: ${(error as Error).message}`,
      );
      return false;
    }
  };
}
