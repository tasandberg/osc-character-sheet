import { describe, it, expect } from "vitest";
import { formatMod } from "@domain/format";

describe("formatMod", () => {
  it("prefixes non-negative with +", () => {
    expect(formatMod(0)).toBe("+0");
    expect(formatMod(2)).toBe("+2");
  });
  it("keeps the native minus sign for negatives", () => {
    expect(formatMod(-3)).toBe("-3");
  });
});
