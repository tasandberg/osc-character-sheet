// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  resolveFontScale,
  applyFontScale,
  FONT_SCALES,
  FONT_SCALE_FACTOR,
} from "@src/OscSheet/fontScale";

describe("resolveFontScale", () => {
  it("defaults to medium for unknown/empty input", () => {
    expect(resolveFontScale(undefined)).toBe("medium");
    expect(resolveFontScale("")).toBe("medium");
    expect(resolveFontScale("nonsense")).toBe("medium");
  });

  it("accepts the valid scales", () => {
    expect(resolveFontScale("compact")).toBe("compact");
    expect(resolveFontScale("medium")).toBe("medium");
    expect(resolveFontScale("large")).toBe("large");
  });

  it("exposes the scale list", () => {
    expect(FONT_SCALES).toEqual(["compact", "medium", "large"]);
  });
});

describe("applyFontScale", () => {
  it("clears --fs-scale at compact and sets the multiplier otherwise", () => {
    const el = document.createElement("div");
    applyFontScale(el, "large");
    expect(el.style.getPropertyValue("--fs-scale")).toBe(
      String(FONT_SCALE_FACTOR.large),
    );
    applyFontScale(el, "medium");
    expect(el.style.getPropertyValue("--fs-scale")).toBe(
      String(FONT_SCALE_FACTOR.medium),
    );
    applyFontScale(el, "compact");
    expect(el.style.getPropertyValue("--fs-scale")).toBe("");
  });
});
