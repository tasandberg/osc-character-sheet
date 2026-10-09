import { TOME, activeClassSet, squash } from "../class/foundryClasses";
import type {
  GearCategory,
  GearItem,
  LoadGearCatalog,
  PreviewLoad,
} from "./gearTypes";

type GearEntry = {
  uuid: string;
  name: string;
  img?: string | null;
  folder?: string | null;
  system?: { cost?: number | null; weight?: number | null; treasure?: boolean };
};
type GearPack = {
  folders: { contents: { id: string; name: string }[] };
  getIndex(options: { fields: string[] }): Promise<Iterable<GearEntry>>;
};
type GearPacks = { get(id: string): GearPack | undefined };

const CLASSIC_PACKS: [string, GearCategory][] = [
  ["classicfantasycompendium.equipment-weapons", "weapons"],
  ["classicfantasycompendium.equipment-armour", "armour"],
  ["classicfantasycompendium.equipment-adventuring-gear", "gear"],
  ["classicfantasycompendium.equipment-ammunition", "ammunition"],
];
const TOME_EQUIPMENT = `${TOME}.equipment`;
const TOME_FOLDERS: Record<string, GearCategory> = {
  weapons: "weapons",
  armour: "armour",
  adventuringgear: "gear",
  ammunition: "ammunition",
};
const FIELDS = ["system.cost", "system.weight", "system.treasure", "folder"];

const gearPacks = () => game.packs as unknown as GearPacks;

const toGearItem = (entry: GearEntry, category: GearCategory): GearItem => ({
  uuid: entry.uuid,
  name: entry.name,
  img: entry.img ?? "",
  category,
  cost: entry.system?.cost ?? 0,
  weight: entry.system?.weight ?? 0,
});

const notTreasure = (entry: GearEntry) => !entry.system?.treasure;

async function classicGear() {
  const lists = await Promise.all(
    CLASSIC_PACKS.map(async ([id, category]) => {
      const pack = gearPacks().get(id);
      if (!pack) return [];
      return [...(await pack.getIndex({ fields: FIELDS }))]
        .filter(notTreasure)
        .map((entry) => toGearItem(entry, category));
    }),
  );
  return lists.flat();
}

async function tomeGear() {
  const pack = gearPacks().get(TOME_EQUIPMENT);
  if (!pack) return [];
  const categories = new Map(
    pack.folders.contents.flatMap((f) => {
      const category = TOME_FOLDERS[squash(f.name)];
      return category ? [[f.id, category] as const] : [];
    }),
  );
  return [...(await pack.getIndex({ fields: FIELDS }))].flatMap((entry) => {
    const category = categories.get(entry.folder ?? "");
    return category && notTreasure(entry) ? [toGearItem(entry, category)] : [];
  });
}

export const loadGearCatalog: LoadGearCatalog = async () => {
  const sources =
    activeClassSet() === "advanced"
      ? [tomeGear, classicGear]
      : [classicGear, tomeGear];
  for (const source of sources) {
    const items = await source();
    if (items.length) return items.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [];
};

type ItemSource = { system?: { quantity?: { value?: number | null } } };
type LoadedActor = {
  system: {
    encumbrance: { enabled: boolean; value: number; max: number };
    movement: { base: number; encounter: number; overland: number };
  };
};

async function cartItemSource(uuid: string, quantity: number) {
  const doc = (await fromUuid(uuid)) as { toObject(): ItemSource } | null;
  if (!doc) return [];
  const source = doc.toObject();
  const perUnit = source.system?.quantity?.value || 1;
  foundry.utils.setProperty(
    source,
    "system.quantity.value",
    perUnit * quantity,
  );
  return [source];
}

export const previewLoad: PreviewLoad = async (cart, catalog) => {
  const known = new Set(catalog.map((item) => item.uuid));
  const items = (
    await Promise.all(
      cart
        .filter((line) => line.quantity > 0 && known.has(line.uuid))
        .map((line) => cartItemSource(line.uuid, line.quantity)),
    )
  ).flat();
  const ActorClass = CONFIG.Actor.documentClass as unknown as new (
    data: object,
  ) => LoadedActor;
  const { encumbrance, movement } = new ActorClass({
    name: "New character",
    type: "character",
    items,
  }).system;
  return {
    enabled: encumbrance.enabled,
    carried: encumbrance.value,
    max: encumbrance.enabled ? encumbrance.max : null,
    movement: {
      base: movement.base,
      encounter: movement.encounter,
      overland: movement.overland,
    },
  };
};
