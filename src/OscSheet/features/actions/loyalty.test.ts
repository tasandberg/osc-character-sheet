import { describe, it, expect, vi } from "vitest";
import type { OSEActor } from "@domain/types";
import { selectLoyalty, rollLoyalty } from "@features/actions/loyalty";
import { selectIdentity } from "@domain/identity";
import { raistlin } from "@src/OscSheet/__fixtures__/raistlin";

const withRetainer = (retainer: unknown) =>
  ({
    ...raistlin,
    system: { ...raistlin.system, retainer },
  }) as unknown as OSEActor;

describe("selectLoyalty", () => {
  it("returns null when the actor has no retainer data at all", () => {
    expect(selectLoyalty(raistlin)).toBeNull();
  });

  it("returns null when the actor is not a retainer", () => {
    expect(
      selectLoyalty(withRetainer({ enabled: false, loyalty: 8, wage: "5gp" })),
    ).toBeNull();
  });

  it("reads the rating for a retainer", () => {
    expect(
      selectLoyalty(withRetainer({ enabled: true, loyalty: 8, wage: "5gp" })),
    ).toEqual({ label: "LR", fullLabel: "Loyalty Rating", value: 8 });
  });

  it("reports an unset rating as null rather than 0", () => {
    expect(
      selectLoyalty(withRetainer({ enabled: true, loyalty: null, wage: "" }))
        ?.value,
    ).toBeNull();
  });
});

describe("selectIdentity retainer fields", () => {
  it("keeps the title for a normal character", () => {
    const vm = selectIdentity(raistlin);
    expect(vm.title).toBe("Conjurer");
    expect(vm.isRetainer).toBe(false);
    expect(vm.wage).toBe("");
  });

  it("carries the wage for a retainer", () => {
    const vm = selectIdentity(
      withRetainer({ enabled: true, loyalty: 8, wage: "5gp/month" }),
    );
    expect(vm.isRetainer).toBe(true);
    expect(vm.wage).toBe("5gp/month");
  });
});

describe("rollLoyalty", () => {
  it("delegates straight to the OSE actor's own 2d6 roll-under check", () => {
    const actor = { rollLoyalty: vi.fn() } as unknown as OSEActor;
    const event = { ctrlKey: true, metaKey: false };

    rollLoyalty(actor, event);

    expect(actor.rollLoyalty).toHaveBeenCalledTimes(1);
    expect(actor.rollLoyalty).toHaveBeenCalledWith({ event });
  });
});
