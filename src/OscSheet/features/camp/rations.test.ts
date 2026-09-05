import { describe, expect, it } from "vitest";
import {
  rationDaysLeft,
  selectRations,
  timeSinceInWords,
} from "@features/camp/rations";
import type { OseItem } from "@domain/types";

const item = (name: string, qty: number, type = "item") =>
  ({ _id: name, name, type, system: { quantity: { value: qty } } }) as OseItem;

describe("selectRations", () => {
  it("matches ration items by name, case-insensitively", () => {
    const items = [
      item("Rations, standard", 7),
      item("Iron Ration", 3),
      item("Rope", 1),
    ];
    expect(selectRations(items).map((it) => it.name)).toEqual([
      "Rations, standard",
      "Iron Ration",
    ]);
  });

  it("excludes empty stacks", () => {
    const items = [item("Rations, standard", 0), item("Iron Ration", 2)];
    expect(selectRations(items).map((it) => it.name)).toEqual(["Iron Ration"]);
  });

  it("excludes non-item types even when named like a ration", () => {
    expect(selectRations([item("Ration Blade", 1, "weapon")])).toEqual([]);
  });
});

describe("rationDaysLeft", () => {
  it("sums remaining quantities", () => {
    expect(
      rationDaysLeft([item("Rations, standard", 7), item("Iron Ration", 3)]),
    ).toBe(10);
  });

  it("is 0 with no rations", () => {
    expect(rationDaysLeft([])).toBe(0);
  });
});

describe("timeSinceInWords", () => {
  it("uses the largest whole unit", () => {
    expect(timeSinceInWords(30)).toBe("moments");
    expect(timeSinceInWords(60)).toBe("1 minute");
    expect(timeSinceInWords(59 * 60)).toBe("59 minutes");
    expect(timeSinceInWords(2 * 3600)).toBe("2 hours");
    expect(timeSinceInWords(3 * 86400)).toBe("3 days");
    expect(timeSinceInWords(15 * 86400)).toBe("2 weeks");
  });
});
