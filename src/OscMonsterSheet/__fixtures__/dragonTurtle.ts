import type { MonsterActor, MonsterItem } from "../types";

export function makeItem(
  over: Partial<MonsterItem> & { system?: MonsterItem["system"] },
): MonsterItem {
  const id = over.id ?? over.name ?? "item";
  return {
    id,
    _id: id,
    name: "Item",
    type: "weapon",
    roll: () => {},
    show: async () => {},
    update: async () => {},
    delete: async () => {},
    ...over,
    system: { pattern: "transparent", ...over.system },
  };
}

export function makeMonster(
  over: {
    system?: Partial<MonsterActor["system"]>;
    details?: Partial<MonsterActor["system"]["details"]>;
  } = {},
  items: MonsterItem[] = [
    makeItem({
      name: "Claw",
      system: { pattern: "red", damage: "1d8", counter: { value: 2, max: 2 } },
    }),
    makeItem({
      name: "Bite",
      system: {
        pattern: "red",
        damage: "1d6*10",
        counter: { value: 1, max: 1 },
      },
    }),
    makeItem({
      name: "Breath",
      system: {
        pattern: "yellow",
        damage: "0",
        save: "breath",
        counter: { value: 0, max: 1 },
      },
    }),
    makeItem({
      name: "Capsize",
      type: "ability",
      system: { description: "<p>May overturn ships.</p>" },
    }),
  ],
): MonsterActor {
  const weapons = items.filter((item) => item.type === "weapon");
  const attackPatterns = weapons.reduce<Record<string, MonsterItem[]>>(
    (groups, item) => {
      const pattern = item.system.pattern ?? "transparent";
      (groups[pattern] ??= []).push(item);
      return groups;
    },
    {},
  );
  return {
    id: "dragon-turtle",
    uuid: "Actor.dragon-turtle",
    name: "Dragon Turtle",
    img: "",
    type: "monster",
    isOwner: true,
    items: {
      contents: items,
      get: (id) => items.find((item) => item.id === id),
    },
    system: {
      hp: { hd: "30d8", value: 98, max: 135 },
      ac: { value: -2 },
      aac: { value: 21 },
      thac0: { value: 5, bba: 14 },
      saves: {
        death: { value: 4 },
        wand: { value: 5 },
        paralysis: { value: 6 },
        breath: { value: 5 },
        spell: { value: 8 },
      },
      movement: { base: 90, encounter: 30 },
      attackPatterns,
      abilities: items.filter((item) => item.type === "ability"),
      isNew: false,
      ...over.system,
      details: {
        alignment: "Chaotic",
        xp: "9,000",
        biography: "<p>Lurks beneath the waves.</p>",
        morale: 10,
        movement: "30' (10') on land",
        specialAbilities: 2,
        appearing: { d: "0", w: "1d4" },
        treasure: {
          table: "@UUID[Compendium.ose.treasure.RollTable.h]{Type H}",
          type: "",
        },
        ...over.details,
      },
    },
    update: async () => {},
    updateEmbeddedDocuments: async () => {},
    rollHitDice: async () => null,
    rollMorale: () => {},
    rollReaction: () => {},
    rollLoyalty: () => {},
    rollAppearing: () => {},
    rollSave: () => {},
    targetAttack: () => {},
  };
}
