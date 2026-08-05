/**
 * @file Ability scores and the values derived from them.
 *
 * The modifier tables below are Open Game Content from the Old-School Essentials SRD.
 */
import type { CharacterScores } from "@ose-foundry-core/types";

export type { CharacterScores };

type IncomingScore = {
  value: number;
  bonus: number;
};

export type BaseScore = IncomingScore & { mod: number };

export type Scores = {
  str: BaseScore;
  int: BaseScore;
  wis: BaseScore;
  dex: BaseScore;
  con: BaseScore;
  cha: BaseScore;
};

type OptionalScores = Partial<Scores>;

/** `[minimum score, value at or above that score]`, ascending, starting at 0. */
export type ScoreThreshold<T> = readonly [min: number, result: T];

export type ScoreTable<T> = readonly [ScoreThreshold<T>, ...ScoreThreshold<T>[]];

const emptyScore = (): IncomingScore => ({ value: 0, bonus: 0 });

const RETAINER_CAP_BASE = 4;
const RETAINER_MORALE_BASE = 7;

export default class OseDataModelCharacterScores implements CharacterScores {
  /** STR/INT/WIS/DEX/CON/CHA modifier, −3 to +3. */
  static standardAttributeMods: ScoreTable<number> = [
    [0, -3],
    [3, -3],
    [4, -2],
    [6, -1],
    [9, 0],
    [13, 1],
    [16, 2],
    [18, 3],
  ];

  /** Initiative and NPC reaction modifier, −2 to +2. */
  static cappedAttributeMods: ScoreTable<number> = [
    [0, -2],
    [3, -2],
    [4, -1],
    [6, -1],
    [9, 0],
    [13, 1],
    [16, 1],
    [18, 2],
  ];

  /** Chance in six to force open a stuck door. */
  static openDoorMods: ScoreTable<number> = [
    [0, 0],
    [3, 1],
    [9, 2],
    [13, 3],
    [16, 4],
    [18, 5],
  ];

  static literacyMods: ScoreTable<string> = [
    [0, ""],
    [3, "OSE.Illiterate"],
    [6, "OSE.LiteracyBasic"],
    [9, "OSE.Literate"],
  ];

  static spokenMods: ScoreTable<string> = [
    [0, "OSE.NativeBroken"],
    [3, "OSE.Native"],
    [13, "OSE.NativePlus1"],
    [16, "OSE.NativePlus2"],
    [18, "OSE.NativePlus3"],
  ];

  static valueFromTable<T>(table: ScoreTable<T>, score: number): T {
    let match = table[0][1];
    for (const [min, value] of table) {
      if (score < min) break;
      match = value;
    }
    return match;
  }

  #scores: Record<keyof Scores, IncomingScore> = {
    str: emptyScore(),
    int: emptyScore(),
    wis: emptyScore(),
    dex: emptyScore(),
    con: emptyScore(),
    cha: emptyScore(),
  };

  constructor(scores: OptionalScores = {}) {
    (Object.keys(this.#scores) as (keyof Scores)[]).forEach((key) => {
      const incoming = scores[key];
      if (incoming) this.#scores[key] = { value: incoming.value, bonus: incoming.bonus };
    });
  }

  #lookup<T>(key: keyof Scores, table: ScoreTable<T>): T {
    return OseDataModelCharacterScores.valueFromTable(table, this.#scores[key].value);
  }

  #mod(key: keyof Scores): number {
    return this.#lookup(key, OseDataModelCharacterScores.standardAttributeMods);
  }

  #base(key: keyof Scores): BaseScore {
    return { ...this.#scores[key], mod: this.#mod(key) };
  }

  #merge(key: keyof Scores, change: Partial<IncomingScore>) {
    this.#scores[key] = { ...this.#scores[key], ...change };
  }

  get str() {
    return {
      ...this.#base("str"),
      od: this.#lookup("str", OseDataModelCharacterScores.openDoorMods),
    };
  }

  set str(change) {
    this.#merge("str", change);
  }

  get int() {
    return {
      ...this.#base("int"),
      literacy: this.#lookup("int", OseDataModelCharacterScores.literacyMods),
      spoken: this.#lookup("int", OseDataModelCharacterScores.spokenMods),
    };
  }

  set int(change) {
    this.#merge("int", change);
  }

  get wis() {
    return this.#base("wis");
  }

  set wis(change) {
    this.#merge("wis", change);
  }

  get dex() {
    return {
      ...this.#base("dex"),
      init: this.#lookup("dex", OseDataModelCharacterScores.cappedAttributeMods),
    };
  }

  set dex(change) {
    this.#merge("dex", change);
  }

  get con() {
    return this.#base("con");
  }

  set con(change) {
    this.#merge("con", change);
  }

  get cha() {
    const mod = this.#mod("cha");
    return {
      ...this.#base("cha"),
      loyalty: RETAINER_MORALE_BASE + mod,
      retain: RETAINER_CAP_BASE + mod,
      npc: this.#lookup("cha", OseDataModelCharacterScores.cappedAttributeMods),
    };
  }

  set cha(change) {
    this.#merge("cha", change);
  }
}
