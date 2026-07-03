import { describe, it, expect } from "vitest";
import { resolveTheme, THEMES } from "@src/OscSheet/theme";

describe("resolveTheme", () => {
  it("defaults to dark for unknown/empty input", () => {
    expect(resolveTheme(undefined)).toBe("dark");
    expect(resolveTheme("")).toBe("dark");
    expect(resolveTheme("nonsense")).toBe("dark");
  });

  it("accepts the two valid themes", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("cream")).toBe("cream");
  });

  it("exposes the valid theme list", () => {
    expect(THEMES).toEqual(["dark", "cream"]);
  });
});
