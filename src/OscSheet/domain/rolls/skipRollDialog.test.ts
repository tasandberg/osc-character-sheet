import { describe, it, expect, afterEach } from "vitest";
import { skipRollDialog } from "@domain/rolls/skipRollDialog";

function stubGame(inverted: boolean) {
  (globalThis as unknown as { game: unknown }).game = {
    system: { id: "ose" },
    settings: {
      get: (ns: string, key: string) =>
        ns === "ose" && key === "invertedCtrlBehavior" ? inverted : undefined,
    },
  };
}

const plain = { ctrlKey: false, metaKey: false };
const ctrl = { ctrlKey: true, metaKey: false };
const meta = { ctrlKey: false, metaKey: true };

afterEach(() => {
  delete (globalThis as unknown as { game?: unknown }).game;
});

describe("skipRollDialog", () => {
  it("normal behavior: modifier held → skip", () => {
    stubGame(false);
    expect(skipRollDialog(ctrl)).toBe(true);
    expect(skipRollDialog(meta)).toBe(true);
  });

  it("normal behavior: no modifier → show dialog", () => {
    stubGame(false);
    expect(skipRollDialog(plain)).toBe(false);
    expect(skipRollDialog(undefined)).toBe(false);
  });

  it("inverted behavior: modifier held → show dialog", () => {
    stubGame(true);
    expect(skipRollDialog(ctrl)).toBe(false);
    expect(skipRollDialog(meta)).toBe(false);
  });

  it("inverted behavior: no modifier → skip", () => {
    stubGame(true);
    expect(skipRollDialog(plain)).toBe(true);
    expect(skipRollDialog(undefined)).toBe(true);
  });

  it("no game/settings available → falls back to non-inverted", () => {
    expect(skipRollDialog(ctrl)).toBe(true);
    expect(skipRollDialog(plain)).toBe(false);
  });
});
