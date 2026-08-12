import { describe, it, expect } from "vitest";
import {
  OWNERSHIP_LEVELS,
  canViewFullSheet,
  canUserViewFullSheet,
  resolveOwnershipLevel,
} from "@domain/ownership";

const USER = { id: "u1" };

function docAtLevel(level: number) {
  return {
    testUserPermission: (_user: unknown, permission: string) =>
      level >= (OWNERSHIP_LEVELS as Record<string, number>)[permission],
  };
}

describe("canViewFullSheet", () => {
  it("hides the full sheet at LIMITED", () => {
    expect(canViewFullSheet(OWNERSHIP_LEVELS.LIMITED)).toBe(false);
  });

  it("shows the full sheet at OBSERVER", () => {
    expect(canViewFullSheet(OWNERSHIP_LEVELS.OBSERVER)).toBe(true);
  });

  it("shows the full sheet at OWNER", () => {
    expect(canViewFullSheet(OWNERSHIP_LEVELS.OWNER)).toBe(true);
  });

  it("hides the full sheet at NONE and INHERIT", () => {
    expect(canViewFullSheet(OWNERSHIP_LEVELS.NONE)).toBe(false);
    expect(canViewFullSheet(OWNERSHIP_LEVELS.INHERIT)).toBe(false);
  });

  it("fails closed on unknown levels", () => {
    for (const level of [null, undefined, NaN, 99, -99, "OWNER", "3", {}, []])
      expect(canViewFullSheet(level)).toBe(false);
  });
});

describe("resolveOwnershipLevel", () => {
  it("returns the highest level the user holds", () => {
    expect(resolveOwnershipLevel(docAtLevel(3), USER)).toBe(
      OWNERSHIP_LEVELS.OWNER,
    );
    expect(resolveOwnershipLevel(docAtLevel(2), USER)).toBe(
      OWNERSHIP_LEVELS.OBSERVER,
    );
    expect(resolveOwnershipLevel(docAtLevel(1), USER)).toBe(
      OWNERSHIP_LEVELS.LIMITED,
    );
    expect(resolveOwnershipLevel(docAtLevel(0), USER)).toBe(
      OWNERSHIP_LEVELS.NONE,
    );
  });

  it("returns null when the document cannot answer", () => {
    expect(resolveOwnershipLevel(null, USER)).toBeNull();
    expect(resolveOwnershipLevel(undefined, USER)).toBeNull();
    expect(resolveOwnershipLevel({}, USER)).toBeNull();
  });
});

describe("canUserViewFullSheet", () => {
  it("hides for LIMITED, shows for OBSERVER and OWNER", () => {
    expect(canUserViewFullSheet(docAtLevel(1), USER)).toBe(false);
    expect(canUserViewFullSheet(docAtLevel(2), USER)).toBe(true);
    expect(canUserViewFullSheet(docAtLevel(3), USER)).toBe(true);
  });

  it("hides when the ownership level cannot be resolved", () => {
    expect(canUserViewFullSheet(null, USER)).toBe(false);
    expect(canUserViewFullSheet({}, USER)).toBe(false);
  });

  it("treats a GM as OWNER because testUserPermission already does", () => {
    const gmDoc = { testUserPermission: () => true };
    expect(canUserViewFullSheet(gmDoc, { id: "gm", isGM: true })).toBe(true);
  });
});
