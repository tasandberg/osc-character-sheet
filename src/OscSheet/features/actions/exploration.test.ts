import { describe, it, expect } from "vitest";
import { selectExploration } from "@features/actions/exploration";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

describe("selectExploration", () => {
  const vm = selectExploration(raistlin);

  it("returns the four data-backed skills plus the simple Forage/Hunt rolls", () => {
    expect(vm.map((e) => e.key)).toEqual(["ld", "od", "sd", "ft", "forage", "hunt"]);
    const od = vm.find((e) => e.key === "od")!;
    expect(od.label).toBe("Open Stuck Door");
    expect(od.inSix).toBe(2);
    expect(od.simple).toBe(false);
    // Forage/Hunt aren't in OSE's schema — flagged simple, default 1-in-6.
    expect(vm.find((e) => e.key === "forage")!.simple).toBe(true);
  });
});
