import { describe, it, expect, vi } from "vitest";
import { preloadSheetFonts } from "@src/OscSheet/styles/vellum/preloadFonts";

function fakeFontSet(families: string[]) {
  const faces = families.map((family) => ({
    family,
    load: vi.fn(() => Promise.resolve()),
  }));
  const set = {
    forEach: (cb: (face: FontFace) => void) =>
      faces.forEach((face) => cb(face as unknown as FontFace)),
  } as unknown as FontFaceSet;
  return { faces, set };
}

describe("preloadSheetFonts", () => {
  it("loads every sheet face and leaves Foundry's fonts alone", () => {
    const { faces, set } = fakeFontSet([
      '"IM Fell English SC"',
      "IM Fell English",
      "IM Fell English",
      "Inter",
      '"JetBrains Mono"',
      "Signika",
      "Modesto Condensed",
    ]);

    preloadSheetFonts(set);

    const loaded = faces.filter((f) => f.load.mock.calls.length > 0);
    expect(loaded.map((f) => f.family)).toEqual([
      '"IM Fell English SC"',
      "IM Fell English",
      "IM Fell English",
      "Inter",
      '"JetBrains Mono"',
    ]);
  });
});
