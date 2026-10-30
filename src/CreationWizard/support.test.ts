import { describe, it, expect } from "vitest";
import { creationWizardSupported } from "./support";

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
  it("needs OSE 3.1.0 or later", () => {
    expect(withSystem("3.0.1")).toBe(false);
    expect(withSystem("3.1.0")).toBe(true);
    expect(withSystem("3.1.0-beta.2")).toBe(true);
    expect(withSystem("999.0.0-dev")).toBe(true);
    expect(withSystem(undefined)).toBe(false);
  });
});
