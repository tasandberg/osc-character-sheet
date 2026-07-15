import { describe, it, expect } from "vitest";
import { consumeToast } from "@features/inventory/consumeToast";

describe("consumeToast", () => {
  it("a decrement (use one) yields a success toast naming the item + remaining", () => {
    expect(consumeToast("Arrows", 18, 17)).toEqual({
      intent: "success",
      title: "Used 1 Arrows",
      message: "17 left",
    });
  });

  it("reports the amount used when more than one drops off", () => {
    expect(consumeToast("Rations", 5, 2)).toEqual({
      intent: "success",
      title: "Used 3 Rations",
      message: "2 left",
    });
  });

  it("no toast when the quantity did not drop (no-op at 0)", () => {
    expect(consumeToast("Arrows", 0, 0)).toBeNull();
  });

  it("no toast on an increase", () => {
    expect(consumeToast("Arrows", 3, 5)).toBeNull();
  });
});
