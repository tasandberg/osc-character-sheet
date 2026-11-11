import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildSlotRepair,
  repairActorSlots,
  runSlotAdjustmentRepair,
  type EffectSource,
  type RepairActor,
} from "./migrationRepair";

const MIGRATION = { ose: { migration: true } };
const slot = (lvl: number, value: number | string) => ({
  key: `system.spells.${lvl}.max`,
  mode: 2,
  value: String(value),
});
const save = { key: "system.saves.death.value", mode: 2, value: "1" };
const blank = { "1": { max: 0 }, "2": { max: 0 } };

describe("buildSlotRepair", () => {
  it("drops slot adds made from blank stored slots, keeping the rest (v13 shape)", () => {
    const effect = { flags: MIGRATION, changes: [slot(1, -2), save, slot(2, -1)] };
    expect(buildSlotRepair(effect, blank, "ose")).toEqual({ update: { changes: [save] } });
  });

  it("handles the v14 shape under system.changes", () => {
    const changes = [
      { key: "system.spells.1.max", type: "add", value: -2 },
      { key: "system.thac0.value", type: "add", value: 2 },
    ];
    expect(buildSlotRepair({ flags: MIGRATION, system: { changes } }, blank, "ose")).toEqual({
      update: { "system.changes": [changes[1]] },
    });
  });

  it("deletes the effect when only blank-slot adds were in it", () => {
    const effect = { flags: MIGRATION, changes: [slot(1, -2)] };
    expect(buildSlotRepair(effect, blank, "ose")).toEqual({ delete: true });
  });

  it("treats a missing stored level as blank", () => {
    const effect = { flags: MIGRATION, changes: [slot(3, -1), save] };
    expect(buildSlotRepair(effect, undefined, "ose")).toEqual({ update: { changes: [save] } });
  });

  it("keeps an adjustment from a real stored slot max", () => {
    const effect = { flags: MIGRATION, changes: [slot(1, -1)] };
    expect(buildSlotRepair(effect, { "1": { max: 1 } }, "ose")).toBeNull();
  });

  it("keeps positive slot adds and non-add modes", () => {
    const effect = {
      flags: MIGRATION,
      changes: [slot(1, 1), { key: "system.spells.2.max", mode: 5, value: "0" }],
    };
    expect(buildSlotRepair(effect, blank, "ose")).toBeNull();
  });

  it("ignores effects the migration did not create", () => {
    expect(buildSlotRepair({ changes: [slot(1, -2)] }, blank, "ose")).toBeNull();
    expect(
      buildSlotRepair({ flags: { other: { migration: true } }, changes: [slot(1, -2)] }, blank, "ose"),
    ).toBeNull();
  });
});

const g = globalThis as unknown as { game?: unknown };

function effectDoc(source: EffectSource) {
  return {
    toObject: () => structuredClone(source),
    update: vi.fn(async () => undefined),
    delete: vi.fn(async () => undefined),
  };
}

function caster(effects: ReturnType<typeof effectDoc>[], type = "character"): RepairActor {
  return { type, _source: { system: { spells: blank } }, effects };
}

describe("repairActorSlots", () => {
  beforeEach(() => {
    g.game = { system: { id: "ose" } };
  });
  afterEach(() => {
    delete g.game;
  });

  it("updates or deletes each affected migration effect", async () => {
    const mixed = effectDoc({ flags: MIGRATION, changes: [slot(1, -2), save] });
    const slotsOnly = effectDoc({ flags: MIGRATION, changes: [slot(1, -2)] });
    const other = effectDoc({ changes: [slot(1, -2)] });

    expect(await repairActorSlots(caster([mixed, slotsOnly, other]))).toBe(2);
    expect(mixed.update).toHaveBeenCalledWith({ changes: [save] });
    expect(slotsOnly.delete).toHaveBeenCalled();
    expect(other.update).not.toHaveBeenCalled();
    expect(other.delete).not.toHaveBeenCalled();
  });

  it("leaves non-characters alone", async () => {
    const effect = effectDoc({ flags: MIGRATION, changes: [slot(1, -2)] });
    expect(await repairActorSlots(caster([effect], "monster"))).toBe(0);
    expect(effect.delete).not.toHaveBeenCalled();
  });
});

describe("runSlotAdjustmentRepair", () => {
  const gm = { id: "gm" };
  let worldEffect: ReturnType<typeof effectDoc>;
  let tokenEffect: ReturnType<typeof effectDoc>;
  let linkedEffect: ReturnType<typeof effectDoc>;

  beforeEach(() => {
    worldEffect = effectDoc({ flags: MIGRATION, changes: [slot(1, -2)] });
    tokenEffect = effectDoc({ flags: MIGRATION, changes: [slot(1, -2)] });
    linkedEffect = effectDoc({ flags: MIGRATION, changes: [slot(1, -2)] });
    g.game = {
      user: gm,
      users: { activeGM: gm },
      system: { id: "ose" },
      actors: [caster([worldEffect])],
      scenes: [
        {
          tokens: [
            { actorLink: false, actor: caster([tokenEffect]) },
            { actorLink: true, actor: caster([linkedEffect]) },
          ],
        },
      ],
    };
  });
  afterEach(() => {
    delete g.game;
  });

  it("repairs world actors and unlinked tokens, skipping linked ones", async () => {
    expect(await runSlotAdjustmentRepair()).toBe(2);
    expect(worldEffect.delete).toHaveBeenCalled();
    expect(tokenEffect.delete).toHaveBeenCalled();
    expect(linkedEffect.delete).not.toHaveBeenCalled();
  });

  it("only runs for the active GM", async () => {
    (g.game as { user: unknown }).user = { id: "player" };
    expect(await runSlotAdjustmentRepair()).toBe(0);
    expect(worldEffect.delete).not.toHaveBeenCalled();
  });

  it("is a no-op on a second pass", async () => {
    await runSlotAdjustmentRepair();
    const repaired = effectDoc({ flags: MIGRATION, changes: [save] });
    (g.game as { actors: RepairActor[] }).actors = [caster([repaired])];
    (g.game as { scenes: unknown[] }).scenes = [];
    expect(await runSlotAdjustmentRepair()).toBe(0);
    expect(repaired.update).not.toHaveBeenCalled();
  });
});
