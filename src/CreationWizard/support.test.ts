import { describe, it, expect } from "vitest";
import { supportsCreationWizard } from "./support";

describe("supportsCreationWizard", () => {
  it("requires OSE 2.2.2 or later with class data", () => {
    expect(supportsCreationWizard("2.2.1", true)).toBe(false);
    expect(supportsCreationWizard("2.2.2", true)).toBe(true);
    expect(supportsCreationWizard("2.10.0", true)).toBe(true);
    expect(supportsCreationWizard("999.0.0-dev", true)).toBe(true);
    expect(supportsCreationWizard("2.3.0", false)).toBe(false);
    expect(supportsCreationWizard(undefined, true)).toBe(false);
  });
});
