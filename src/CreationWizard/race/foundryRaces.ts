import { enrich } from "../compendium";
import type { RaceDetail } from "../rules";
import {
  raceFromItem,
  type CreationRace,
  type ItemSource,
  type RaceItemSource,
} from "./raceItems";

type RaceDocument = {
  uuid: string;
  type: string;
  toObject(): RaceItemSource;
};
type ItemPack = {
  collection: string;
  documentName: string;
  getIndex(): Promise<Iterable<{ _id: string; type?: string }>>;
  getDocuments(query: object): Promise<RaceDocument[]>;
};
type AbilityDocument = {
  name: string;
  system?: { description?: string };
};

const worldItems = () =>
  game.items as unknown as {
    filter(fn: (item: RaceDocument) => boolean): RaceDocument[];
    fromCompendium(doc: object): ItemSource;
  };

async function packRaces() {
  const packs = (game.packs as unknown as { contents: ItemPack[] }).contents;
  const docs = await Promise.all(
    packs
      .filter((pack) => pack.documentName === "Item")
      .map(async (pack) => {
        try {
          const ids = [...(await pack.getIndex())]
            .filter((entry) => entry.type === "race")
            .map((entry) => entry._id);
          return ids.length ? await pack.getDocuments({ _id__in: ids }) : [];
        } catch (error) {
          console.warn(`Skipped ${pack.collection}`, error);
          return [];
        }
      }),
  );
  return docs.flat();
}

export const embeddable = (doc: { toObject(): object }) =>
  worldItems().fromCompendium(doc);

export async function loadRaces(): Promise<CreationRace[]> {
  const docs = [
    ...worldItems().filter((item) => item.type === "race"),
    ...(await packRaces()),
  ];
  const byKey = docs.reduce((races, doc) => {
    const race = raceFromItem(doc.uuid, doc.toObject(), game.system.id);
    const key = race.key || race.name;
    return races.has(key)
      ? races
      : races.set(key, { ...race, source: embeddable(doc) });
  }, new Map<string, CreationRace>());
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadRaceDetail(race: CreationRace): Promise<RaceDetail> {
  const abilities = await Promise.all(
    race.abilities.map(async ({ uuid, level }) => {
      const doc = (await fromUuid(uuid)) as AbilityDocument | null;
      return (
        doc && {
          name: doc.name,
          description: await enrich(doc.system?.description ?? ""),
          level,
        }
      );
    }),
  );
  return {
    description: await enrich(race.description),
    abilities: abilities.filter((a) => a !== null),
  };
}

export function foundryRaceDetail(races: CreationRace[]) {
  const cache = new Map<string, Promise<RaceDetail>>();
  return (uuid: string) => {
    const race = races.find((r) => r.uuid === uuid);
    if (!race) return Promise.reject(new Error(`Unknown race ${uuid}`));
    if (!cache.has(uuid)) {
      const load = loadRaceDetail(race);
      load.catch(() => cache.delete(uuid));
      cache.set(uuid, load);
    }
    return cache.get(uuid)!;
  };
}
