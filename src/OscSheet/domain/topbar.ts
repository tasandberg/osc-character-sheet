import type { OSEActor } from "@domain/types";
import type { TopbarVM } from "@domain/vm-types";
import { selectClassDefaults } from "@domain/classRules";

export function selectTopbar(actor: OSEActor): TopbarVM {
  const { level, xp } = actor.system.details;
  // Progress runs across the current level's band [floor, next], not [0, next].
  // The floor comes from the class XP table; `next` is the actor's stored value
  // (editable in the Edit modal). Use the table floor only when it's consistent
  // with the stored XP (value at/above floor, floor below next) — otherwise the
  // table doesn't match this actor's data, so fall back to a 0-based bar.
  const levelXp = selectClassDefaults(actor).levelXp ?? 0;
  const floor = levelXp <= xp.value && levelXp < xp.next ? levelXp : 0;
  const span = xp.next - floor;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((xp.value - floor) / span) * 100)) : 0;
  return { level, nextLevel: level + 1, xp: { value: xp.value, next: xp.next }, pct };
}
