import type { OSEActor } from "@domain/types";
import type { TopbarVM } from "@domain/vm-types";
import { selectClassDefaults, selectProgression } from "@domain/classRules";

export function selectTopbar(actor: OSEActor): TopbarVM {
  const { level, xp } = actor.system.details;
  // OSE stores no band floor — only `xp.next` — so the floor comes from the
  // class XP table, and an unmatched (custom) class has none to read.
  const defaults = selectClassDefaults(actor);
  const floor = defaults.levelXp ?? 0;
  const next = selectProgression(actor).source === "item" ? defaults.nextXp : xp.next;
  if (next == null) return { level, nextLevel: null, xp: { value: xp.value, floor, next: null }, pct: 100 };
  const span = next - floor;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((xp.value - floor) / span) * 100)) : 0;
  return { level, nextLevel: level + 1, xp: { value: xp.value, floor, next }, pct };
}
