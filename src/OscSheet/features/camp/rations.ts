import type { OseItem } from "@domain/types";

const RATION_NAME = /ration/i;

/** Ration stacks with at least one remaining — matched by name, since OSE has no
 *  ration item type or tag. */
export function selectRations(items: OseItem[]): OseItem[] {
  return items.filter(
    (it) =>
      it.type === "item" &&
      RATION_NAME.test(it.name ?? "") &&
      (it.system.quantity?.value ?? 0) > 0,
  );
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
