// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  resolveFontScale,
  applyFontScale,
  FONT_SCALES,
  FONT_SCALE_FACTOR,
} from "@src/OscSheet/fontScale";

describe("resolveFontScale", () => {
  it("defaults to md for unknown/empty input", () => {
    expect(resolveFontScale(undefined)).toBe("md");
    expect(resolveFontScale("")).toBe("md");
    expect(resolveFontScale("nonsense")).toBe("md");
  });

  it("accepts the valid scales", () => {
    expect(resolveFontScale("md")).toBe("md");
    expect(resolveFontScale("lg")).toBe("lg");
    expect(resolveFontScale("xl")).toBe("xl");
  });

  it("exposes the scale list", () => {
    expect(FONT_SCALES).toEqual(["md", "lg", "xl"]);
  });
});

describe("applyFontScale", () => {
  it("clears --fs-scale at md and sets the multiplier otherwise", () => {
    const el = document.createElement("div");
    applyFontScale(el, "xl");
    expect(el.style.getPropertyValue("--fs-scale")).toBe(
      String(FONT_SCALE_FACTOR.xl),
    );
    applyFontScale(el, "md");
    expect(el.style.getPropertyValue("--fs-scale")).toBe("");
  });
});
