// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useOscSettings } from "@src/OscSheet/settings";
import { stubLiveSettingsAsGM } from "../__fixtures__/liveSettings";
import { settingRules } from "../foundryRules";
import type { CreationRules } from "../rules";
import { WizardSettings } from "../WizardSettings";
import { ScoresStep } from "./ScoresStep";
import { emptyScoresDraft } from "./scoresDraft";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

const staticRules: Partial<CreationRules> = {
  classes: [],
  races: [],
  modifiers: () => ({}),
  xpBonus: () => 0,
  rollScore: async () => ({ total: 10, dice: [3, 3, 4] }),
};

function Wizard() {
  const settings = useOscSettings();
  const [draft, setDraft] = useState(() => emptyScoresDraft());
  return (
    <div className="osc-sheet-app">
      <ScoresStep
        draft={draft}
        rules={{ ...staticRules, ...settingRules(settings) } as CreationRules}
        onChange={setDraft}
      />
      <WizardSettings open onClose={() => {}} />
    </div>
  );
}

beforeEach(() => {
  stubLiveSettingsAsGM();
  vi.stubGlobal("Roll", { validate: (formula: string) => formula === "3d6" });
  host = document.body.appendChild(document.createElement("div"));
  root = createRoot(host);
  act(() => root.render(<Wizard />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

const button = (name: string) =>
  [...host.querySelectorAll("button")].find(
    (b) =>
      b.getAttribute("aria-label") === name || b.textContent?.trim() === name,
  )!;
const press = (name: string) => act(() => button(name).click());
const pressAsync = (name: string) =>
  act(async () => {
    button(name).click();
  });
const checkboxes = () =>
  [...host.querySelectorAll<HTMLInputElement>("input[type=checkbox]")].map(
    (input) => ({ input, label: input.closest("label")!.textContent }),
  );
const checkbox = (label: string) =>
  checkboxes().find((box) => box.label === label)!.input;
const toggle = (label: string) => act(() => checkbox(label).click());
const alerts = () =>
  [...host.querySelectorAll('[role="alert"]')].map((el) => el.textContent);

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

describe("Roll methods", () => {
  it("stays open while the offered methods go from one to two and back", () => {
    toggle("3d6 and arrange");
    expect(
      host.querySelector('[role=radiogroup][aria-label="Roll method"]'),
    ).not.toBeNull();
    expect(button("Custom")).toBeDefined();

    toggle("3d6 and arrange");
    expect(
      host.querySelector('[role=radiogroup][aria-label="Roll method"]'),
    ).toBeNull();
    expect(button("Custom")).toBeDefined();
  });

  it("keeps the last offered method ticked and says one is required", () => {
    toggle("3d6 down the line");
    expect(checkbox("3d6 down the line").checked).toBe(true);
    expect(alerts()).toEqual(["At least one roll method is required"]);
  });

  it("adds nothing when the label is missing or the formula is invalid", async () => {
    const offered = checkboxes().map((box) => box.label);
    press("Custom");
    await pressAsync("Add");
    expect(alerts()).toEqual(["Give the roll method a label"]);

    type("Roll method label", "Heroic");
    type("Roll formula", "lots of dice");
    await pressAsync("Add");
    expect(alerts()[0]).toContain("roll formula");
    press("Roll methods");
    expect(checkboxes().map((box) => box.label)).toEqual(offered);
  });
});
