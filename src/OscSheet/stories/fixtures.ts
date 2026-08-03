// One scratch character, shared by the whole-tab stories. Shallow casts, the
// same shape the unit tests use: these views only read data, so a literal is
// enough and a real Foundry document is not available in Storybook.
import type {
  OSEActor,
  OscSheetContextValue,
  OseAbility,
  OseSpell,
  OseWeapon,
} from "@domain/types";
import { MODULE_ID } from "@domain/flags";

const noop = () => {};
const log =
  (label: string) =>
  (...args: unknown[]) =>
    console.log(label, ...args);

const favorited = { flags: { [MODULE_ID]: { favorite: true } } };

const weapon = (
  id: string,
  name: string,
  damage: string,
  o: Partial<OseWeapon["system"]> = {},
): OseWeapon =>
  ({
    _id: id,
    name,
    img: "",
    type: "weapon",
    system: {
      damage,
      equipped: true,
      melee: true,
      missile: false,
      bonus: 0,
      description: "",
      qualities: [],
      quantity: { value: 1, max: 1 },
      weight: 30,
      cost: 5,
      treasure: false,
      tags: [],
      contents: [],
      containerId: "",
      cumulativeCost: 5,
      cumulativeWeight: 30,
      ...o,
    },
    sheet: { render: noop },
    update: () => Promise.resolve(undefined as never),
    rollWeapon: noop,
  }) as unknown as OseWeapon;

const ability = (
  id: string,
  name: string,
  o: {
    description?: string;
    requirements?: string;
    roll?: string;
    rollType?: string;
    rollTarget?: number;
    favorite?: boolean;
  } = {},
): OseAbility =>
  ({
    _id: id,
    name,
    img: "",
    type: "ability",
    ...(o.favorite ? favorited : {}),
    system: {
      description: o.description ?? "",
      requirements: o.requirements ?? "",
      roll: o.roll ?? "",
      rollType: o.rollType,
      rollTarget: o.rollTarget,
    },
    roll: log("ability.roll"),
    sheet: { render: log("ability.sheet.render") },
    update: () => Promise.resolve(undefined as never),
  }) as unknown as OseAbility;

const spell = (
  id: string,
  name: string,
  lvl: number,
  o: { memorized?: number; cast?: number; range?: string; duration?: string; roll?: string } = {},
): OseSpell =>
  ({
    _id: id,
    name,
    img: "",
    type: "spell",
    system: {
      lvl,
      memorized: o.memorized ?? 0,
      cast: o.cast ?? 0,
      range: o.range ?? "",
      duration: o.duration ?? "",
      save: "",
      roll: o.roll ?? "",
      description: "",
    },
    update: () => Promise.resolve(undefined as never),
    spendSpell: log("spell.spendSpell"),
    sheet: { render: log("spell.sheet.render") },
  }) as unknown as OseSpell;

export const abilities: Record<string, OseAbility> = {
  a1: ability("a1", "Turn Undead", {
    requirements: "cleric",
    description: "<p>Drive off or destroy the unliving by brandishing a holy symbol.</p>",
    roll: "2d6",
    rollType: "above",
    rollTarget: 7,
    favorite: true,
  }),
  a2: ability("a2", "Detect Secret Doors", {
    requirements: "elf",
    description: "<p>A short search reveals concealed doors.</p>",
    roll: "1d6",
    rollType: "below",
    rollTarget: 2,
    favorite: true,
  }),
  a3: ability("a3", "Infravision", {
    description: "<p>See heat and cold to 60'. Useless in the presence of normal light.</p>",
  }),
};

export const weapons: OseWeapon[] = [
  weapon("w1", "Mace +1", "1d6", { bonus: 1, qualities: [{ label: "Blunt", value: "blunt", icon: "" }] }),
  weapon("w2", "Sling", "1d4", { melee: false, missile: true, weight: 20 }),
  weapon("w3", "Dagger", "1d4", { missile: true, qualities: [{ label: "Thrown", value: "thrown", icon: "" }] }),
];

export const spellList = {
  1: [
    spell("s1", "Cure Light Wounds", 1, { memorized: 2, cast: 1, range: "touch", duration: "instant", roll: "1d6+1" }),
    spell("s2", "Protection from Evil", 1, { memorized: 1, cast: 1, range: "0", duration: "12 turns" }),
    spell("s3", "Light", 1, { range: "120'", duration: "6 turns" }),
  ],
  2: [
    spell("s4", "Hold Person", 2, { memorized: 1, cast: 0, range: "180'", duration: "9 turns" }),
    spell("s5", "Bless", 2, { range: "60'", duration: "6 turns" }),
  ],
};

const score = (value: number, mod: number) => ({ value, mod });

export const actor = {
  name: "Brother Aldric",
  img: "",
  uuid: "Actor.story",
  flags: {},
  items: { contents: [], get: (id: string) => weapons.find((w) => w._id === id) },
  system: {
    details: {
      alignment: "Lawful",
      class: "Cleric",
      level: 3,
      title: "Vicar",
      biography: "<p>Third son of a minor house, sworn to the Order of the Pale Lantern.</p>",
      notes: "<p>Owes the Thieves' Guild 200gp. They have not forgotten.</p>",
      xp: { value: 4200, next: 6000, bonus: 5, share: 100 },
    },
    scores: {
      str: score(12, 0),
      int: score(9, 0),
      wis: score(16, 2),
      dex: score(13, 1),
      con: score(14, 1),
      cha: score(8, -1),
    },
    saves: { death: { value: 11 }, wand: { value: 12 }, paralysis: { value: 14 }, breath: { value: 16 }, spell: { value: 15 } },
    exploration: { ld: 1, od: 2, sd: 1, ft: 1 },
    languages: { value: ["Common", "Lawful"] },
    thac0: { value: 19, bba: 0 },
    hp: { value: 11, max: 14, hd: "3d6" },
    initiative: { value: 1, mod: 0 },
    movement: { base: 120, encounter: 40, overland: 24 },
    config: {},
    abilities,
    treasures: {},
    weapons,
    spells: { spellList, slots: { 1: { used: 2, max: 3 }, 2: { used: 1, max: 2 } }, enabled: true },
  },
  _source: { system: { spells: {} } },
  rollCheck: log("actor.rollCheck"),
  rollSave: log("actor.rollSave"),
  rollExploration: log("actor.rollExploration"),
  targetAttack: log("actor.targetAttack"),
  update: () => Promise.resolve(undefined as never),
} as unknown as OSEActor;

export const context = (over: Partial<OscSheetContextValue> = {}): OscSheetContextValue =>
  ({
    actor,
    source: actor,
    items: [],
    actorData: actor._source,
    currentTab: "actions",
    setCurrentTab: noop,
    canEdit: true,
    updateActor: (data: Record<string, unknown>) => {
      console.log("updateActor", data);
      return Promise.resolve();
    },
    ...over,
  }) as unknown as OscSheetContextValue;
