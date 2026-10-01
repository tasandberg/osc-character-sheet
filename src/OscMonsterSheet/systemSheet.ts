import type { SheetClassEntry } from "@src/applications/header-controls";
import type { MonsterActor } from "./types";

type SystemMonsterSheet = { generateSave: () => Promise<unknown> };

export function findSaveGeneratorEntry<T extends SheetClassEntry>(
  entries: T[],
): T | undefined {
  const withGenerator = entries.filter(
    (entry) => typeof entry.cls?.prototype?.generateSave === "function",
  );
  return (
    withGenerator.find((entry) => entry.id?.startsWith("ose.")) ??
    withGenerator[0]
  );
}

export function openSaveGenerator(actor: MonsterActor): void {
  const entries = Object.values(
    CONFIG.Actor?.sheetClasses?.[actor.type as "base"] ?? {},
  ) as unknown as SheetClassEntry[];
  const entry = findSaveGeneratorEntry(entries);
  if (!entry?.cls) return;
  const SheetClass = entry.cls as unknown as new (options: {
    document: MonsterActor;
  }) => SystemMonsterSheet;
  void new SheetClass({ document: actor }).generateSave();
}
