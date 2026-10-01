import { skipRollDialog } from "@domain/rolls/skipRollDialog";
import type { RollEvent } from "@domain/types";
import type { MonsterActor, MonsterItem } from "./types";

export async function rollMonsterItem(item: MonsterItem, event?: RollEvent) {
  if (item.type === "weapon") {
    const remaining = Number(item.system.counter?.value) || 0;
    await item.update({ "system.counter.value": Math.max(0, remaining - 1) });
  }
  item.roll({ skipDialog: skipRollDialog(event) });
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

export function setPattern(item: MonsterItem, pattern: string) {
  return item.update({ "system.pattern": pattern });
}

export function setUses(item: MonsterItem, value: number) {
  return item.update({ "system.counter.value": Math.max(0, value) });
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
