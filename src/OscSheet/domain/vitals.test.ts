import { describe, expect, it } from "vitest";
import { selectAc } from "@domain/vitals";

// Minimal stand-ins for OSE's AC class (the real calc is the system's job, not ours).
// Distinct constructors prove which scheme's instance selectAc picked for the setting.
class AscAc {
  base = 10;
  naked = 11;
  mod = 0;
  value = 14;
}
class DescAc {
  base = 9;
  naked = 8;
  mod = 0;
  value = 5;
}

describe("selectAc", () => {
  it("observes the ascendingAC setting: uses the ascending instance when on", () => {
    expect(selectAc(new AscAc(), new DescAc(), [], true)).toEqual({ value: 14, ascending: true });
  });

  it("observes the ascendingAC setting: uses the descending instance when off", () => {
    expect(selectAc(new AscAc(), new DescAc(), [], false)).toEqual({ value: 5, ascending: false });
  });
});
