import { skipRollDialog } from "@domain/rolls/skipRollDialog";
import type { RollEvent } from "@domain/types";
import type { MonsterActor, MonsterItem } from "./types";
import { nextPattern } from "./viewModel";

export async function rollMonsterItem(item: MonsterItem, event?: RollEvent) {
  if (item.type === "weapon") {
    const remaining = Number(item.system.counter?.value) || 0;
    await item.update({ "system.counter.value": Math.max(0, remaining - 1) });
  }
  item.roll({ skipDialog: skipRollDialog(event) });
}

export async function rollHitPoints(actor: MonsterActor, event?: RollEvent) {
  const roll = await actor.rollHitDice({ event });
  const total = roll?.total;
  if (typeof total !== "number" || !Number.isFinite(total)) return;
  await actor.update({ "system.hp.max": total, "system.hp.value": total });
}

export function rollBareAttack(actor: MonsterActor, event?: RollEvent) {
  actor.targetAttack({ roll: {} }, undefined, {
    type: undefined,
    skipDialog: skipRollDialog(event),
  });
}

export function resetAttacks(actor: MonsterActor) {
  const updates = actor.items.contents
    .filter((item) => item.type === "weapon")
    .map((weapon) => ({
      _id: weapon.id,
      "system.counter.value":
        Number.parseInt(String(weapon.system.counter?.max ?? 0), 10) || 0,
    }));
  return actor.updateEmbeddedDocuments("Item", updates);
}

export function cyclePattern(item: MonsterItem) {
  const colours = Object.keys(CONFIG.OSE?.colors ?? {});
  return setPattern(
    item,
    nextPattern(item.system.pattern ?? "transparent", colours),
  );
}

export function setPattern(item: MonsterItem, pattern: string) {
  return item.update({ "system.pattern": pattern });
}

export function setUses(item: MonsterItem, value: number) {
  return item.update({ "system.counter.value": Math.max(0, value) });
}

export function setAttacksPerRound(item: MonsterItem, max: number) {
  const next = Math.max(0, max);
  const previous = Number(item.system.counter?.max) || 0;
  const remaining = Number(item.system.counter?.value) || 0;
  return item.update({
    "system.counter.max": next,
    "system.counter.value": Math.min(
      next,
      Math.max(0, remaining + next - previous),
    ),
  });
}

export function clearTreasure(actor: MonsterActor) {
  return actor.update({ "system.details.treasure.table": null });
}

export async function openDocument(uuid: string) {
  const document = (await fromUuid(uuid)) as {
    sheet?: { render: (force: boolean) => void };
  } | null;
  document?.sheet?.render(true);
}
