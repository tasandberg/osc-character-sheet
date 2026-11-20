import type { OSEActor } from "@domain/types";
import type { ClassItems, ItemSource } from "../class/classItems";
import {
  PortraitUploadReportedError,
  portraitImageUploader,
} from "@features/portraitImage/applyPortraitImage";
import { isBlankCharacter } from "@features/creation/blankCharacter";
import { cartItemSource, coinSources } from "../gear/foundryGear";
import type { NewCharacter } from "./newCharacter";

type EmbeddedItem = { id: string };
type GrantingItem = Parameters<NonNullable<OSEActor["offerAbilities"]>>[0];
type WritableActor = Omit<OSEActor, "items"> & {
  id: string;
  items: { map<T>(fn: (item: EmbeddedItem) => T): T[] };
  update(data: object): Promise<unknown>;
  createEmbeddedDocuments(type: "Item", data: ItemSource[]): Promise<unknown>;
  deleteEmbeddedDocuments(type: "Item", ids: string[]): Promise<unknown>;
  delete(): Promise<unknown>;
  addClass(
    data: ItemSource,
    options: { level: number; rollHp: boolean },
  ): Promise<GrantingItem | undefined>;
  setRace(
    data: ItemSource,
    options: { modifiersIncluded: boolean },
  ): Promise<GrantingItem | undefined>;
  sheet?: { render(force: boolean): unknown } | null;
};
type ActorDocumentClass = {
  create(data: object): Promise<WritableActor | undefined>;
};

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
  onWritten: () => void,
) {
  await actor.deleteEmbeddedDocuments(
    "Item",
    actor.items.map((item) => item.id),
  );
  await actor.update({
    "system.languages.value": [],
    ...foundry.utils.flattenObject({
      name: character.name,
      system: character.system,
    }),
    ...images,
  });
  onWritten();
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

async function grantClassAndRace(
  actor: WritableActor,
  classItems: ClassItems,
  { class: cls, race }: NewCharacter,
) {
  const embeddedRace = race
    ? await actor.setRace(race.source, { modifiersIncluded: false })
    : undefined;
  const embeddedClass = await actor.addClass(classItems.source(cls), {
    level: cls.level,
    rollHp: false,
  });
  const grant = (item: GrantingItem | undefined, level: number) =>
    item && actor.offerAbilities?.(item, level, { upTo: true, confirm: false });
  await grant(embeddedClass, cls.level);
  await grant(embeddedRace, 1);
}

const inWorld = (actor: WritableActor) =>
  !!(game.actors as { get(id: string): unknown } | undefined)?.get(actor.id);

export function createCharacter(classItems: ClassItems, existing?: OSEActor) {
  const given = existing as unknown as WritableActor | undefined;
  let started: WritableActor | undefined;
  return async (character: NewCharacter) => {
    let created: WritableActor | undefined;
    let finished: WritableActor;
    try {
      const [items, images] = await Promise.all([
        itemSources(character),
        imageData(character),
      ]);
      if (started && started !== given && !inWorld(started))
        started = undefined;
      const target = started ?? given;
      if (
        target &&
        !started &&
        !isBlankCharacter(target as unknown as OSEActor)
      )
        throw new Error(
          "this character already has scores or items, so the wizard won’t overwrite it.",
        );
      const actor = target
        ? await fill(target, character, items, images, () => {
            started = target;
          })
        : (created = await create(character, items, images));
      if (!actor) throw new Error("Foundry didn’t create the actor.");
      await grantClassAndRace(actor, classItems, character);
      finished = actor;
    } catch (error) {
      console.error(error);
      const leftover = created;
      if (leftover)
        started = await leftover.delete().then(
          () => undefined,
          (deleteError) => {
            console.error(deleteError);
            return leftover;
          },
        );
      if (error instanceof PortraitUploadReportedError) return false;
      ui.notifications?.error(
        `Couldn’t create ${character.name}: ${(error as Error).message}`,
      );
      return false;
    }
    try {
      finished.sheet?.render(true);
    } catch (error) {
      console.error(error);
    }
    return true;
  };
}
