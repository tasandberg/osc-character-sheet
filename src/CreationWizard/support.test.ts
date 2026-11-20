import { describe, it, expect } from "vitest";
import {
  creationWizardAvailable,
  creationWizardSupported,
} from "./support";

const isNewerVersion = (a: string, b: string) => {
  const p = (v: string) => v.split(".").map((n) => parseInt(n, 10) || 0);
  const [x, y] = [p(a), p(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};
(globalThis as { foundry?: unknown }).foundry = { utils: { isNewerVersion } };
const withSystem = (version?: string) => {
  (globalThis as { game?: unknown }).game = { system: { version } };
  return creationWizardSupported();
};

describe("creationWizardSupported", () => {
  it("needs OSE 3.2.0 or later", () => {
    expect(withSystem("3.1.0")).toBe(false);
    expect(withSystem("3.2.0")).toBe(true);
    expect(withSystem("3.3.0")).toBe(true);
    expect(withSystem("999.0.0-dev")).toBe(true);
    expect(withSystem(undefined)).toBe(false);
  });
});

describe("creationWizardAvailable", () => {
  const classItem = { type: "class" };
  const weapon = { type: "weapon" };
  const available = ({
    version = "3.3.0",
    items = [] as { type: string }[],
    packs = [] as { documentName: string; index: { type: string }[] }[],
  }) => {
    (globalThis as { game?: unknown }).game = {
      system: { version },
      items,
      packs: { contents: packs },
    };
    return creationWizardAvailable();
  };

  it("needs a class item in the world or in an Item compendium", () => {
    expect(available({})).toBe(false);
    expect(
      available({
        items: [weapon],
        packs: [
          { documentName: "Item", index: [weapon] },
          { documentName: "Actor", index: [classItem] },
        ],
      }),
    ).toBe(false);
    expect(available({ items: [classItem] })).toBe(true);
    expect(
      available({ packs: [{ documentName: "Item", index: [classItem] }] }),
    ).toBe(true);
  });

  it("stays unavailable below OSE 3.2.0 even with class items", () => {
    expect(available({ version: "3.1.0", items: [classItem] })).toBe(false);
  });
});
