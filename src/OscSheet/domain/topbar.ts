import type { OSEActor } from "@domain/types";
import type { TopbarVM } from "@domain/vm-types";
import { selectClassDefaults } from "@domain/classRules";

export function selectTopbar(actor: OSEActor): TopbarVM {
  const { level, xp } = actor.system.details;
  // OSE stores no band floor — only `xp.next` — so the floor comes from the
  // class XP table, and an unmatched (custom) class has none to read.
  const floor = selectClassDefaults(actor).levelXp ?? 0;
  const span = xp.next - floor;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((xp.value - floor) / span) * 100)) : 0;
  return { level, nextLevel: level + 1, xp: { value: xp.value, floor, next: xp.next }, pct };
}
