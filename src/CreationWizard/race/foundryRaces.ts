import {
  TOME,
  enrich,
  journalPageHtml,
  packs,
  squash,
} from "../class/foundryClasses";
import { parseClassPage } from "../class/classPage";
import type { RaceDetail } from "../rules";

const RACE_ABILITIES = `${TOME}.race-abilities`;
const NOT_AN_ABILITY = /^(available classes|racial abilities)/i;

async function racialAbilities(race: string) {
  const pack = packs().get(RACE_ABILITIES);
  if (!pack) return [];
  const folder = pack.folders.contents.find(
    (f) => squash(f.name) === squash(race),
  );
  if (!folder) return [];
  const index = await pack.getIndex({
    fields: ["system.description", "folder"],
  });
  return [...index]
    .filter((e) => e.folder === folder.id && !NOT_AN_ABILITY.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => ({ name: e.name, description: e.system?.description ?? "" }));
}

async function loadRaceDetail(race: string): Promise<RaceDetail> {
  const [html, abilities] = await Promise.all([
    journalPageHtml(`${TOME}.rules`, /races/i, race),
    racialAbilities(race),
  ]);
  return {
    description: await enrich(parseClassPage(html ?? "").description),
    abilities: await Promise.all(
      abilities.map(async (a) => ({
        name: a.name,
        description: await enrich(a.description),
      })),
    ),
  };
}

export const tomeActive = () => !!game.modules?.get(TOME)?.active;

export function foundryRaceDetail() {
  const cache = new Map<string, Promise<RaceDetail>>();
  return (race: string) => {
    if (!cache.has(race)) {
      const load = loadRaceDetail(race);
      load.catch(() => cache.delete(race));
      cache.set(race, load);
    }
    return cache.get(race)!;
  };
}
