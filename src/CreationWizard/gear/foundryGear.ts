import type { OSEActor } from "@domain/types";
import { selectEncumbrance } from "@features/inventory/encumbrance";
import { TOME, activeClassSet, squash } from "../class/foundryClasses";
import type {
  GearCategory,
  GearItem,
  LoadGearCatalog,
  PreviewLoad,
} from "./gearTypes";

type GearDocument = {
  uuid: string;
  name: string;
  img?: string | null;
  type: string;
  folder?: { id: string } | null;
  system: {
    cost?: number | null;
    weight?: number | null;
    treasure?: boolean;
    damage?: string;
    qualities?: { label: string }[];
    type?: string;
    ac?: { value?: number };
    aac?: { value?: number };
  };
};
type GearPack = {
  folders: { contents: { id: string; name: string }[] };
  getDocuments(): Promise<GearDocument[]>;
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

const gearPacks = () => game.packs as unknown as GearPacks;

function ascendingAC() {
  const settings = game.settings as unknown as {
    get(ns: string, key: string): unknown;
  };
  return !!settings.get(game.system.id, "ascendingAC");
}

function weaponDetail({ damage, qualities = [] }: GearDocument["system"]) {
  const tags = qualities.map((q) => q.label.toLocaleLowerCase()).join(", ");
  return [damage, tags].filter(Boolean).join(" · ") || undefined;
}

function armourDetail({ type, ac, aac }: GearDocument["system"]) {
  const descending = ac?.value ?? 0;
  const ascending = aac?.value ?? 0;
  if (type === "shield") return `+${ascending} AC`;
  return ascendingAC() ? `AC ${ascending}` : `AC ${descending} [${ascending}]`;
}

function detailOf(doc: GearDocument) {
  if (doc.type === "weapon") return weaponDetail(doc.system);
  if (doc.type === "armor") return armourDetail(doc.system);
  return undefined;
}

const toGearItem = (doc: GearDocument, category: GearCategory): GearItem => ({
  uuid: doc.uuid,
  name: doc.name,
  img: doc.img ?? "",
  category,
  cost: doc.system.cost ?? 0,
  weight: doc.system.weight ?? 0,
  detail: detailOf(doc),
});

const notTreasure = (doc: GearDocument) => !doc.system.treasure;

async function classicGear() {
  const lists = await Promise.all(
    CLASSIC_PACKS.map(async ([id, category]) => {
      const pack = gearPacks().get(id);
      if (!pack) return [];
      return (await pack.getDocuments())
        .filter(notTreasure)
        .map((doc) => toGearItem(doc, category));
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
  return (await pack.getDocuments()).flatMap((doc) => {
    const category = categories.get(doc.folder?.id ?? "");
    return category && notTreasure(doc) ? [toGearItem(doc, category)] : [];
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
  ) => OSEActor;
  const actor = new ActorClass({
    name: "New character",
    type: "character",
    items,
  });
  const { encumbrance, movement } = actor.system;
  return {
    enabled: encumbrance.enabled,
    carried: encumbrance.value,
    max: encumbrance.enabled ? encumbrance.max : null,
    tier: encumbrance.enabled ? selectEncumbrance(actor).status : null,
    movement: {
      base: movement.base,
      encounter: movement.encounter,
      overland: movement.overland,
    },
  };
};
