import { describe, it, expect } from "vitest";
import { classItems, isDerivedFromClasses } from "./classItems";
import type { OSEActor } from "./types";

const actorWith = (system: Record<string, unknown>) =>
  ({ system }) as unknown as OSEActor;

describe("classItems", () => {
  it("is empty on systems without class items", () => {
    expect(classItems(actorWith({}))).toEqual([]);
  });

  it("returns the actor's class items", () => {
    const fighter = { name: "Fighter", system: { level: 2, xp: 2500 } };
    expect(classItems(actorWith({ classes: [fighter] }))).toEqual([fighter]);
  });
});

describe("isDerivedFromClasses", () => {
  it("is false unless the system says so", () => {
    expect(isDerivedFromClasses(actorWith({}))).toBe(false);
    expect(isDerivedFromClasses(actorWith({ derivedFromClasses: false }))).toBe(false);
    expect(isDerivedFromClasses(actorWith({ derivedFromClasses: true }))).toBe(true);
  });
});
