// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreationWizard } from "./CreationWizard";
import type {
  ClassDetail,
  CreationClass,
  CreationRules,
  RaceDetail,
} from "./rules";
import type { AbilityScores } from "./scores/scoresDraft";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
let rolls: { total: number; dice: number[] }[];
let details: Map<string, (detail: ClassDetail) => void>;
let raceDetails: Map<string, (detail: RaceDetail) => void>;
let hitPointRolls: string[];

const levelTable = (die: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    xp: i * 1200,
    hd: `${i + 1}${die}`,
    thac0: 19 - i,
    saves: [13, 14, 13, 16, 15].map((save) => save - i),
  }));

const level1 = {
  hitDie: "1d8",
  thac0: 19,
  nextLevelXp: 2000,
  skills: [],
  levels: levelTable("d8", 1),
};
const classes: CreationClass[] = [
  {
    name: "Dwarf",
    requirements: { con: 9 },
    primeRequisites: ["str"],
    ...level1,
  },
  { name: "Fighter", requirements: {}, primeRequisites: ["str"], ...level1 },
  {
    name: "Halfling",
    requirements: { con: 9, dex: 9 },
    primeRequisites: ["dex", "str"],
    xpModifiers: [{ modifier: 10, anyOf: [{ dex: 13, str: 13 }] }],
    ...level1,
    hitDie: "1d6",
    levels: levelTable("d6", 1),
  },
  {
    name: "Thief",
    requirements: {},
    primeRequisites: ["dex"],
    hitDie: "1d4",
    thac0: 19,
    nextLevelXp: 1200,
    skills: [
      { key: "cs", chance: 87 },
      { key: "hn", chance: 2 },
    ],
    levels: levelTable("d4", 10),
  },
];

const thiefDetail: ClassDetail = {
  description: "<p>Thieves live by their skills of deception and stealth.</p>",
  armour: "Leather, no shields",
  weapons: "Any",
  abilities: [
    { name: "Back-stab", description: "<p>+4 to hit and double damage.</p>" },
  ],
  skillLabels: { cs: "Climb sheer surfaces", hn: "Hear noise" },
};

const rules: CreationRules = {
  classes,
  classDetail: (name) => new Promise((resolve) => details.set(name, resolve)),
  separateRaces: false,
  raceDetail: (name) =>
    new Promise((resolve) => raceDetails.set(name, resolve)),
  modifiers: (scores) =>
    Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [
        key,
        value! >= 13 ? 1 : value! <= 8 ? -1 : 0,
      ]),
    ) as AbilityScores,
  rollScore: async () => rolls.shift()!,
  maxHitPointsAtFirstLevel: false,
  maximumHitPoints: () => 8,
  rollHitPoints: async (formula) => {
    hitPointRolls.push(formula);
    return { total: 3, dice: [4] };
  },
  alignmentText: async () => ({
    neutral: "Neutral beings believe in a balance between Law and Chaos.",
  }),
};

function open(wizardRules = rules) {
  details = new Map();
  raceDetails = new Map();
  hitPointRolls = [];
  rolls = [12, 7, 10, 15, 8, 11].map((total) => ({
    total,
    dice: [total - 2, 1, 1],
  }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <CreationWizard
        worldName="Hollow Fen"
        houseRules={[]}
        rules={wizardRules}
      />,
    ),
  );
}

function close() {
  act(() => root.unmount());
  host.remove();
}

afterEach(close);

const buttons = () => [...host.querySelectorAll("button")];
const button = (name: string) =>
  buttons().find(
    (b) =>
      b.getAttribute("aria-label") === name ||
      b.textContent?.trim() === name ||
      (b.getAttribute("role") === "radio" && b.textContent?.startsWith(name)),
  );
const press = (name: string) => act(() => button(name)!.click());
const pressAsync = (name: string) =>
  act(async () => {
    button(name)!.click();
  });
const currentStep = () =>
  host.querySelector('[aria-current="step"]')?.textContent;
const next = () => buttons().find((b) => b.textContent?.startsWith("Next"))!;
const aside = () => host.querySelector("aside")!.textContent;
const rows = () =>
  [...host.querySelectorAll("tbody tr")].map((row) => ({
    text: row.textContent,
    disabled: row.getAttribute("aria-disabled") === "true",
  }));
const radio = (name: string) =>
  host.querySelector<HTMLInputElement>(
    `input[type=radio][aria-label="${name}"]`,
  )!;

const type = (label: string, value: string) =>
  setInput(
    host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!,
    value,
  );

const typeField = (label: string, value: string) =>
  setInput(
    [...host.querySelectorAll("label")]
      .find((l) => l.textContent?.startsWith(label))!
      .querySelector("input")!,
    value,
  );

function setInput(input: HTMLInputElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const ABILITY_LABELS = [
  "Strength",
  "Intelligence",
  "Wisdom",
  "Dexterity",
  "Constitution",
  "Charisma",
];

const choose = (label: string) =>
  act(() =>
    [...host.querySelectorAll("label")]
      .find((l) => l.textContent === label)!
      .querySelector("input")!
      .click(),
  );
const stepNames = () =>
  [...host.querySelectorAll('nav[aria-label="Creation steps"] li')].map(
    (li) => li.textContent,
  );
const openSeparate = () => open({ ...rules, separateRaces: true });

function enterScores(values: string[]) {
  press("Enter manually");
  values.forEach((value, i) => type(ABILITY_LABELS[i], value));
}

async function toDetails() {
  enterScores(["13", "8", "7", "15", "8", "11"]);
  act(() => next().click());
  act(() => radio("Thief").click());
  await act(async () => next().click());
}

const hitPoints = () =>
  host.querySelector<HTMLInputElement>('input[aria-label="Hit points"]')!.value;
const saves = () =>
  [
    ...host.querySelectorAll(
      'dl[aria-label="Saving throws, roll d20 at or above target"] dd',
    ),
  ].map((dd) => dd.textContent);

describe("CreationWizard", () => {
  it("holds Next until the current step is complete, then advances", () => {
    open();
    expect(currentStep()).toBe("1Scores");
    expect(next().getAttribute("aria-disabled")).toBe("true");
    expect(host.textContent).toContain("Roll your scores to continue");

    act(() => next().click());
    expect(currentStep()).toBe("1Scores");

    enterScores(["13", "8", "7", "15", "8", "11"]);
    expect(next().getAttribute("aria-disabled")).toBe("false");
    act(() => next().click());
    expect(currentStep()).toBe("2Class");
  });

  it("links back to done steps with their summary, but not to unfinished ones", () => {
    open();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());

    expect(button("3Details")).toBeUndefined();
    press("1Scores13 8 7 15 8 11");
    expect(currentStep()).toBe("1Scores");
  });

  it("shows Back only after the first step", () => {
    open();
    expect(button("Back")).toBeUndefined();

    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());
    press("Back");
    expect(currentStep()).toBe("1Scores");
  });

  it("starts fresh when the window is reopened", () => {
    open();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());
    close();

    open();
    expect(currentStep()).toBe("1Scores");
    expect(button("1Scores")).toBeUndefined();
  });

  it("rolls 3d6 in order one score at a time, then the rest together", async () => {
    open();
    expect(button("Roll INT")).toBeUndefined();

    await pressAsync("Roll STR");
    expect(host.textContent).toContain("12+0");
    expect(button("Roll remaining 5")).toBeDefined();
    expect(host.textContent).toContain("Roll five more to continue");

    await pressAsync("Roll remaining 5");
    expect(host.textContent).toContain("15+1");
    expect(host.textContent).toContain("7−1");
    expect(button("Roll remaining 0")).toBeUndefined();
    expect(next().getAttribute("aria-disabled")).toBe("false");
  });

  it("places rolled totals on abilities and returns them to the pool", async () => {
    open();
    press("Roll and arrange");
    await pressAsync("Roll six totals");
    expect(host.textContent).toContain("6 to place");

    press("15, rolled 13 1 1");
    press("Place 15 on DEX");
    expect(host.textContent).toContain("5 to place");
    expect(host.textContent).toContain("Place 5 more rolls to continue");

    press("DEX 15, return to the rolls");
    expect(host.textContent).toContain("6 to place");

    press("Place the rest in order");
    expect(next().getAttribute("aria-disabled")).toBe("false");
  });

  it("flags manual scores outside 3 to 18 and names what blocks Next", () => {
    open();
    enterScores(["13", "8", "7", "19", "8", ""]);

    expect(host.textContent).toContain("Scores run 3 to 18");
    expect(
      host
        .querySelector('input[aria-label="Dexterity"]')!
        .getAttribute("aria-invalid"),
    ).toBe("true");
    expect(host.textContent).toContain("Fix DEX and enter CHA to continue");
  });

  it("lists classes by what the scores allow so far", async () => {
    open();
    expect(aside()).toContain("after you roll");
    expect(aside()).not.toContain("Dwarf");

    enterScores(["13", "8", "7", "15"]);
    expect(aside()).toContain("waiting on CON, CHA");
    expect(aside()).toContain("DwarfCON 9+");

    type("Constitution", "8");
    expect(aside()).toContain("DwarfCON 9");
    expect(aside()).toContain("HalflingCON 9, DEX 9");
    expect(
      [...host.querySelectorAll("aside li")]
        .filter((row) => row.getAttribute("aria-disabled") === "true")
        .map((row) => row.textContent),
    ).toEqual(["DwarfCON 9", "HalflingCON 9, DEX 9"]);
  });

  it("shows the XP adjustment of each class the scores allow", () => {
    open();
    enterScores(["7", "8", "7", "15", "8", "11"]);
    expect(aside()).toContain("Fighter−10% XP");
    expect(aside()).toContain("Thief+5% XP");
    expect(aside()).toContain("DwarfCON 9");
  });

  it("offers only the classes the scores allow, then summarises the choice", async () => {
    open();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());

    expect(rows()).toEqual([
      { text: "DwarfSTRCON 91d8Dwarf requires CON 9", disabled: true },
      { text: "FighterSTR—1d8+5% from STR 13", disabled: false },
      {
        text: "HalflingDEX, STRCON 9, DEX 91d6Halfling requires CON 9 and DEX 9",
        disabled: true,
      },
      { text: "ThiefDEX—1d4+5% from DEX 15", disabled: false },
    ]);
    expect(radio("Dwarf").disabled).toBe(true);
    expect(next().getAttribute("aria-disabled")).toBe("true");
    expect(host.textContent).toContain("Choose a class to continue");

    act(() => radio("Thief").click());
    expect(next().getAttribute("aria-disabled")).toBe("false");
    await act(async () => next().click());
    expect(button("2ClassThief · +5% XP")).toBeDefined();
  });

  it("describes the chosen class once its compendium entries load", async () => {
    open();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());
    act(() => radio("Thief").click());

    const panel = () =>
      host.querySelector('aside[aria-label="Thief at first level"]')!;
    expect(panel().querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(panel().textContent).toContain("Hit die1d4");
    expect(panel().textContent).toContain("Prime req.+5% from DEX 15");
    expect(panel().textContent).toContain("THAC019 [+0]");
    expect(panel().textContent).toContain("Next level1,200 xp");

    await act(async () => details.get("Thief")!(thiefDetail));
    expect(panel().querySelector('[aria-busy="true"]')).toBeNull();
    expect(panel().textContent).toContain(
      "Thieves live by their skills of deception and stealth.",
    );
    expect(panel().textContent).toContain("ArmourLeather, no shields");
    expect(panel().textContent).toContain("WeaponsAny");
    const backStab = button("Back-stab")!;
    const backStabText = () =>
      document.getElementById(backStab.getAttribute("aria-controls")!)!;
    expect(backStab.getAttribute("aria-expanded")).toBe("false");
    expect(backStabText().hasAttribute("hidden")).toBe(true);
    act(() => backStab.click());
    expect(backStab.getAttribute("aria-expanded")).toBe("true");
    expect(backStabText().hasAttribute("hidden")).toBe(false);
    expect(backStabText().textContent).toBe("+4 to hit and double damage.");
    expect(panel().textContent).toContain("Climb sheer surfaces87%");
    expect(panel().textContent).toContain("Hear noise2-in-6");
  });

  it("adds a Race step by default when the world separates race and class", () => {
    open();
    expect(host.textContent).not.toContain("How race is chosen");
    close();

    openSeparate();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    expect(stepNames()).toEqual([
      "1Scores",
      "2Race",
      "3Class",
      "4Details",
      "5Gear",
      "6Review",
    ]);
    expect(aside()).toContain("2 of 10 open");
    expect(aside()).toContain("Half-Orc+1 CON, +1 STR, −2 CHA");
    expect(aside()).toContain("DuergarCON 9, INT 9");

    act(() => next().click());
    expect(currentStep()).toBe("2Race");
    expect(
      rows()
        .filter((r) => !r.disabled)
        .map((r) => r.text),
    ).toEqual([
      "Human—Noneany class, no limit",
      "Half-Orc—+1 CON, +1 STR, −2 CHA5 classes",
    ]);
    expect(rows().find((r) => r.text?.startsWith("Half-Elf"))!.text).toContain(
      "Needs CON 9",
    );

    press("Back");
    choose("As class");
    expect(stepNames()).toHaveLength(5);
  });

  it("applies the race’s modifiers, then offers only the classes it allows", async () => {
    openSeparate();
    enterScores(["13", "8", "7", "15", "8", "11"]);
    act(() => next().click());
    act(() => radio("Half-Orc").click());
    expect(host.querySelector("aside")!.textContent).toContain(
      "Your scoresSTR 14 · CON 9 · CHA 9",
    );

    act(() => next().click());
    expect(rows().map((r) => r.text)).toEqual([
      "FighterSTR1d810th+5% from STR 14",
      "ThiefDEX1d48th+5% from DEX 15",
    ]);
    act(() => radio("Thief").click());
    await act(async () => next().click());
    expect(button("2RaceHalf-Orc")).toBeDefined();
    expect(button("3ClassHalf-Orc Thief · +5% XP")).toBeDefined();
  });

  it("derives racial abilities and save bonuses from the adjusted scores", async () => {
    openSeparate();
    enterScores(["13", "8", "7", "15", "10", "11"]);
    act(() => next().click());
    act(() => radio("Dwarf").click());

    await act(async () =>
      raceDetails.get("Dwarf")!({
        description: "<p>Dwarves are stout.</p>",
        abilities: [
          { name: "Infravision", description: "<p>See in the dark.</p>" },
          { name: "Resilience", description: "<p>Hardy folk.</p>" },
        ],
      }),
    );
    const racePanel = () => host.querySelector("aside")!.textContent;
    expect(racePanel()).toContain("Dwarves are stout.");
    expect(racePanel()).toContain("Infravision60′");
    expect(racePanel()).toContain("Resilience+3 saves (CON 11)");
    const resilience = button("Resilience details")!;
    act(() => resilience.click());
    expect(
      document.getElementById(resilience.getAttribute("aria-controls")!)!
        .hidden,
    ).toBe(false);

    act(() => next().click());
    expect(rows().map((r) => r.text?.split("1d")[0])).toEqual([
      "FighterSTR",
      "ThiefDEX",
    ]);
    act(() => radio("Thief").click());
    const classPanel = host.querySelector(
      'aside[aria-label="Thief at first level"]',
    )!.textContent;
    expect(classPanel).toContain("Max level9th, as a dwarf");
    expect(classPanel).toContain(
      "Saves+3 vs poison, spells, wands (Resilience, CON 11)",
    );
    expect(classPanel).toContain(
      "LanguagesAlignment, Common, Dwarvish, Gnomish, Goblin, Kobold",
    );
  });
});

describe("CreationWizard details", () => {
  it("names the character, sets alignment and rolls hit points before Gear", async () => {
    open();
    await toDetails();
    expect(currentStep()).toBe("3Details");
    expect(host.textContent).toContain("Name your character to continue");

    typeField("Name", "Wren Ashdown");
    expect(host.textContent).toContain("Choose an alignment to continue");
    choose("Neutral");
    expect(host.textContent).toContain(
      "Neutral beings believe in a balance between Law and Chaos.",
    );
    expect(host.textContent).toContain("Roll hit points to continue");
    expect(next().getAttribute("aria-disabled")).toBe("true");

    await pressAsync("Roll 1d4");
    expect(hitPointRolls).toEqual(["max(1d4 + -1, 1)"]);
    expect(hitPoints()).toBe("3");
    expect(host.textContent).toContain(
      "Rolled 1d4 for Thief, −1 for Constitution.",
    );
    expect(host.textContent).toContain("−1 vs magic (WIS 7)");
    expect(saves()).toEqual(["13", "14", "13", "16", "15"]);

    act(() => next().click());
    expect(currentStep()).toBe("4Gear");
    expect(button("3DetailsWren Ashdown · 1st level · 3 hp")).toBeDefined();
  });

  it("keeps hit points editable, but not below 1", async () => {
    open();
    await toDetails();
    typeField("Name", "Wren");
    choose("Lawful");

    type("Hit points", "0");
    expect(host.textContent).toContain("Hit points start at 1");
    expect(next().getAttribute("aria-disabled")).toBe("true");

    type("Hit points", "5");
    expect(next().getAttribute("aria-disabled")).toBe("false");
  });

  it("takes saves, THAC0, XP and hit dice from the chosen level, up to the class maximum", async () => {
    open();
    await toDetails();
    await pressAsync("Roll 1d4");
    press("Raise level");
    press("Raise level");

    const stats = () =>
      [...host.querySelectorAll("h2")]
        .find((h) => h.textContent === "Thief · level")!
        .closest("aside")!.textContent;
    expect(stats()).toContain("Experience2,400 xp");
    expect(stats()).toContain("Next level3,600 xp");
    expect(stats()).toContain("Hit dice3d4");
    expect(stats()).toContain("THAC017 [+2]");
    expect(saves()).toEqual(["11", "12", "11", "14", "13"]);
    expect(hitPoints()).toBe("");
    await pressAsync("Roll 3d4");
    expect(hitPointRolls.at(-1)).toBe("max(3d4 + -3, 3)");

    for (let i = 0; i < 9; i++) press("Raise level");
    expect(stats()).toContain("Max level10th");
    expect(button("Raise level")!.getAttribute("aria-disabled")).toBe("true");
  });

  it("caps the level by race and adds the racial save bonus when race is separate", async () => {
    openSeparate();
    enterScores(["13", "8", "7", "15", "10", "11"]);
    act(() => next().click());
    act(() => radio("Dwarf").click());
    act(() => next().click());
    act(() => radio("Thief").click());
    await act(async () => next().click());

    expect(
      [...host.querySelectorAll("h2")].map((h) => h.textContent),
    ).toContain("Dwarf Thief · level");
    expect(host.textContent).toContain("Max level9th");
    expect(host.textContent).toContain(
      "+3 vs poison, spells, wands (Resilience, CON 11)",
    );
  });

  it("starts 1st-level characters at maximum hit points under the house rule", async () => {
    open({ ...rules, maxHitPointsAtFirstLevel: true });
    await toDetails();
    expect(hitPoints()).toBe("8");
    expect(host.textContent).toContain(
      "Maximum of 1d4 for Thief, −1 for Constitution, by house rule.",
    );

    press("Raise level");
    expect(hitPoints()).toBe("");
  });
});
