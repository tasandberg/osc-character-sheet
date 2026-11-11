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
    expect(selectAc(new AscAc(), new DescAc(), [], true)).toMatchObject({ value: 14, ascending: true });
  });

  it("observes the ascendingAC setting: uses the descending instance when off", () => {
    expect(selectAc(new AscAc(), new DescAc(), [], false)).toMatchObject({ value: 5, ascending: false });
  });

  it("breaks AC down into worn armour, DEX, shield and modifier", () => {
    class Ac {
      base = 10;
      naked = 11;
      shield = 1;
      mod = 2;
      value = 18;
    }
    const armor = [
      { name: "Chain mail", system: { type: "medium", aac: { value: 14 } } },
      { name: "Shield", system: { type: "shield", aac: { value: 1 } } },
    ] as unknown as Item[];
    expect(selectAc(new Ac(), new DescAc(), armor, true).parts).toEqual([
      { label: "Chain mail", value: "14" },
      { label: "DEX", value: "+1" },
      { label: "Shield", value: "+1" },
      { label: "Modifier", value: "+2" },
    ]);
  });
});
