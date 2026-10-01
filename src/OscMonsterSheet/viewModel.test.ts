import { beforeAll, describe, expect, it } from "vitest";
import { makeItem, makeMonster } from "./__fixtures__/dragonTurtle";
import { hitDiceLabel, nextPattern, selectMonster } from "./viewModel";

const descending = { ascendingAC: false, morale: true };
const ascending = { ascendingAC: true, morale: true };

beforeAll(() => {
  (globalThis as { CONFIG?: unknown }).CONFIG = {
    OSE: { roll_type: { result: "=", above: "≥", below: "≤" } },
  };
});

describe("selectMonster", () => {
  it.each([
    ["30d8", 2, "30**"],
    ["11d8+2", 0, "11+2"],
    ["1d4", 0, "½"],
    ["1d1", 1, "1hp*"],
    ["2d6", 0, "2d6"],
  ])(
    "labels Hit Dice %s with %s special abilities as %s",
    (hd, stars, label) => {
      expect(hitDiceLabel(hd, stars)).toBe(label);
    },
  );

  it("only offers dice rolls for values that contain dice", () => {
    const view = selectMonster(
      makeMonster({
        system: { hp: { hd: "5", value: 5, max: 5 } },
        details: { morale: "Varies", appearing: { d: "0", w: "see below" } },
      }),
      descending,
    );
    expect(view.hitDice.rollable).toBe(false);
    expect(view.hp.rollable).toBe(false);
    expect(view.morale?.rollable).toBe(false);
    expect(view.appearing.rollableDungeon).toBe(false);
    expect(view.appearing.rollableLair).toBe(false);
    expect(view.morale?.value).toBe("Varies");
  });

  it("shows ascending AC and attack bonus when the world uses ascending AC", () => {
    const view = selectMonster(makeMonster(), ascending);
    expect(view.armourClass).toMatchObject({
      label: "Ascending AC",
      display: "21",
      path: "system.aac.value",
    });
    expect(view.attack).toMatchObject({
      label: "Attack",
      display: "+14",
      path: "system.thac0.bba",
    });

    const classic = selectMonster(makeMonster(), descending);
    expect(classic.armourClass).toMatchObject({
      label: "Armour Class",
      display: "-2",
      path: "system.ac.value",
    });
    expect(classic.attack).toMatchObject({
      label: "THAC0",
      display: "5",
      path: "system.thac0.value",
    });
  });

  it("shows a dash for a missing armour class", () => {
    const view = selectMonster(
      makeMonster({ system: { ac: null } }),
      descending,
    );
    expect(view.armourClass.display).toBe("—");
  });

  it("hides morale when the world morale rule is off", () => {
    expect(
      selectMonster(makeMonster(), { ascendingAC: false, morale: false })
        .morale,
    ).toBeNull();
  });

  it("footnotes movement details only when they add something", () => {
    expect(selectMonster(makeMonster(), descending).movement).toEqual({
      base: "90",
      display: "90′ (30′)",
      footnote: "30' (10') on land",
    });
    const repeated = makeMonster({ details: { movement: "90’ (30’)" } });
    expect(selectMonster(repeated, descending).movement.footnote).toBeNull();
  });

  it("lists weapons by pattern, marking later coloured groups as alternatives", () => {
    const attacks = selectMonster(makeMonster(), descending).attacks;
    expect(attacks.map((a) => [a.name, a.alternative])).toEqual([
      ["Claw", false],
      ["Bite", false],
      ["Breath", true],
    ]);
    expect(attacks[0]).toMatchObject({
      count: 2,
      damage: "1d8",
      uses: { value: 2, max: 2 },
      exhausted: false,
    });
    expect(attacks[2]).toMatchObject({
      damage: null,
      save: "save vs breath",
      exhausted: true,
    });
  });

  it("describes abilities with their roll and save", () => {
    const monster = makeMonster({}, [
      makeItem({
        name: "Sleeping",
        type: "ability",
        system: {
          roll: "1d100",
          rollType: "below",
          rollTarget: 5,
          save: "spell",
        },
      }),
    ]);
    expect(selectMonster(monster, descending).abilities).toEqual([
      {
        id: "Sleeping",
        name: "Sleeping",
        description: "",
        rollTag: "1d100 ≤5",
        save: "save vs spells",
      },
    ]);
  });

  it("links the treasure table and drops the 'Type' prefix", () => {
    expect(selectMonster(makeMonster(), descending).treasure).toEqual({
      uuid: "Compendium.ose.treasure.RollTable.h",
      label: "H",
    });
    expect(
      selectMonster(
        makeMonster({ details: { treasure: { table: "" } } }),
        descending,
      ).treasure,
    ).toBeNull();
  });

  it("lists memorised spells by level only for spellcasters", () => {
    const spell = makeItem({
      name: "Charm",
      type: "spell",
      system: { cast: 1, memorized: 2 },
    });
    const caster = makeMonster({
      system: { spells: { enabled: true, spellList: { 1: [spell], 2: [] } } },
    });
    expect(selectMonster(caster, descending).spellLevels).toEqual([
      {
        level: 1,
        spells: [{ id: "Charm", name: "Charm", cast: 1, memorized: 2 }],
      },
    ]);
    const disabled = makeMonster({
      system: { spells: { enabled: false, spellList: { 1: [spell] } } },
    });
    expect(selectMonster(disabled, descending).spellLevels).toEqual([]);
  });
});

describe("nextPattern", () => {
  it("cycles through the colours, then transparent, then back", () => {
    const colours = ["green", "red"];
    expect(nextPattern("green", colours)).toBe("red");
    expect(nextPattern("red", colours)).toBe("transparent");
    expect(nextPattern("transparent", colours)).toBe("green");
  });
});
