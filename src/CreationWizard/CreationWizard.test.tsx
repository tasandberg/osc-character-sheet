// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CreationWizard } from "./CreationWizard";
import type { ClassDetail, CreationClass, CreationRules } from "./rules";
import type { AbilityScores } from "./scores/scoresDraft";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;
let rolls: { total: number; dice: number[] }[];
let details: Map<string, (detail: ClassDetail) => void>;

const level1 = { hitDie: "1d8", thac0: 19, nextLevelXp: 2000, skills: [] };
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
  modifiers: (scores) =>
    Object.fromEntries(
      Object.entries(scores).map(([key, value]) => [
        key,
        value! >= 13 ? 1 : value! <= 8 ? -1 : 0,
      ]),
    ) as AbilityScores,
  rollScore: async () => rolls.shift()!,
};

function open() {
  details = new Map();
  rolls = [12, 7, 10, 15, 8, 11].map((total) => ({
    total,
    dice: [total - 2, 1, 1],
  }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <CreationWizard worldName="Hollow Fen" houseRules={[]} rules={rules} />,
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

function type(label: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(
    `input[aria-label="${label}"]`,
  )!;
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

function enterScores(values: string[]) {
  press("Enter manually");
  values.forEach((value, i) => type(ABILITY_LABELS[i], value));
}

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

  it("offers only the classes the scores allow, then summarises the choice", () => {
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
    act(() => next().click());
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
});
