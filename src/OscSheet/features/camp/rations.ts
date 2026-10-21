import { FLAGS, readFlag, setFlag } from "@domain/flags";
import type { OSEActor, OseItem } from "@domain/types";

const RATION_NAME = /ration/i;

/** By name or OSR Helper's ration flag, since OSE has no ration item type or tag. */
export function isRation(it: OseItem): boolean {
  const osrHelper = (
    it.flags as Record<string, { itemType?: string }> | undefined
  )?.["osr-helper"];
  return (
    it.type === "item" &&
    (RATION_NAME.test(it.name ?? "") || osrHelper?.itemType === "ration")
  );
}

/** Ration stacks with at least one remaining. */
export function selectRations(items: OseItem[]): OseItem[] {
  return items.filter(
    (it) => isRation(it) && (it.system.quantity?.value ?? 0) > 0,
  );
}

export function secondsSinceLastAte(actor: OSEActor): number | undefined {
  const lastAteAt = readFlag<number>(actor, FLAGS.lastAteAt);
  const now = worldTimeNow();
  return lastAteAt !== undefined && now !== undefined && now >= lastAteAt
    ? now - lastAteAt
    : undefined;
}

export function eatRation(
  actor: OSEActor,
  it: OseItem,
): { cur: number; next: number } | undefined {
  const cur = it.system.quantity?.value ?? 0;
  if (cur <= 0) return undefined;
  const next = cur - 1;
  void (
    actor as unknown as {
      updateEmbeddedDocuments(
        type: string,
        updates: Record<string, unknown>[],
      ): Promise<unknown>;
    }
  ).updateEmbeddedDocuments("Item", [
    { _id: it._id, "system.quantity.value": next },
  ]);
  const now = worldTimeNow();
  if (now !== undefined) void setFlag(actor, FLAGS.lastAteAt, now);
  return { cur, next };
}

export function rationDaysLeft(rations: OseItem[]): number {
  return rations.reduce((sum, it) => sum + (it.system.quantity?.value ?? 0), 0);
}

/** Current `game.time.worldTime` in seconds; undefined outside Foundry (tests). */
export function worldTimeNow(): number | undefined {
  return (globalThis as { game?: { time?: { worldTime?: number } } }).game?.time
    ?.worldTime;
}

/** Elapsed game seconds in words for the "since last ration" hint: largest
 *  whole unit of minutes/hours/days/weeks, "moments" under a minute. */
export function timeSinceInWords(seconds: number): string {
  const unit = (n: number, noun: string) =>
    `${n} ${noun}${n === 1 ? "" : "s"}`;
  if (seconds < 60) return "moments";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return unit(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return unit(hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return unit(days, "day");
  return unit(Math.floor(days / 7), "week");
}
