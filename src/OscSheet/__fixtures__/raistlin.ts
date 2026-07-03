import type { CharacterAC } from "@ose-foundry-core/types";
import type { OSEActor } from "@domain/types";
import OseDataModelCharacterScores from "@domain/data-model-character-scores";

// The constructor's param type wants full BaseScore (incl. derived `mod`), but it only
// reads value/bonus; pass the raw scores and cast to satisfy the declared signature.
const scores = new OseDataModelCharacterScores({
  str: { value: 9, bonus: 0 },
  int: { value: 17, bonus: 0 },
  wis: { value: 12, bonus: 0 },
  dex: { value: 13, bonus: 0 },
  con: { value: 10, bonus: 0 },
  cha: { value: 11, bonus: 0 },
} as unknown as ConstructorParameters<typeof OseDataModelCharacterScores>[0]);

// Static AC (DEX 13 → +1, ring mod +1): AAC 12 / DAC 7. The sheet only reads
// `.value`; correctness of the AC math is covered by E2E, not the fixture.
const aac: CharacterAC = { value: 12, mod: 1, base: 10, naked: 11, shield: 0 };
const ac: CharacterAC = { value: 7, mod: 1, base: 9, naked: 8, shield: 0 };

// Partial actor: only the fields view-models read. Cast through unknown because the
// real OSEActor is a full Foundry document with methods we don't exercise in unit tests.
export const raistlin = {
  name: "Raistlin Majere",
  img: "",
  system: {
    aac,
    ac,
    scores,
    details: {
      alignment: "Neutral",
      class: "Magic-User",
      biography: "",
      level: 3,
      notes: "",
      title: "Conjurer",
      xp: { bonus: 0, value: 6420, next: 10000, share: 100 },
    },
    movement: { base: 120, encounter: 40, overland: 24 },
    hp: { value: 8, max: 9, hd: "3d4" },
    saves: {
      death: { value: 13 },
      wand: { value: 14 },
      paralysis: { value: 13 },
      breath: { value: 16 },
      spell: { value: 15 },
    },
    exploration: { ft: 1, ld: 2, od: 2, sd: 1 },
    weapons: [
      {
        name: "Dagger",
        img: "",
        bonus: 0,
        system: {
          damage: "1d4",
          qualities: [{ label: "Thrown", value: "thrown", icon: "fa-bullseye-pointer" }],
          description: "",
          melee: true,
          missile: true,
          equipped: true,
        },
      },
      {
        name: "Quarterstaff",
        img: "",
        bonus: 0,
        system: {
          damage: "1d6",
          qualities: [
            { label: "Two-handed", value: "twohanded", icon: "fa-hand-fist" },
            { label: "Slow", value: "slow", icon: "fa-hourglass" },
          ],
          description: "",
          melee: true,
          missile: false,
          equipped: true,
        },
      },
    ],
    treasures: {
      gp: { name: "GP", img: "", system: { quantity: { value: 42 } } },
      sp: { name: "SP", img: "", system: { quantity: { value: 17 } } },
    },
  },
} as unknown as OSEActor;
