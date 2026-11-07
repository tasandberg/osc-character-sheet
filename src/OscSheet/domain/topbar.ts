import type { OSEActor } from "@domain/types";
import type { TopbarVM } from "@domain/vm-types";
import { selectClassDefaults, selectProgression, type Progression } from "@domain/classRules";

export function selectTopbar(actor: OSEActor): TopbarVM {
  const { level, xp } = actor.system.details;
  // OSE stores no band floor — only `xp.next` — so the floor comes from the
  // class XP table, and an unmatched (custom) class has none to read.
  const defaults = selectClassDefaults(actor);
  const floor = defaults.levelXp ?? 0;
  const progression = selectProgression(actor);
  const next = progression.source === "item" ? defaults.nextXp : xp.next;
  const levelUps = selectLevelUps(progression);
  if (next == null) return { level, nextLevel: null, xp: { value: xp.value, floor, next: null }, pct: 100, levelUps };
  const span = next - floor;
  const pct = span > 0 ? Math.min(100, Math.max(0, ((xp.value - floor) / span) * 100)) : 0;
  return { level, nextLevel: level + 1, xp: { value: xp.value, floor, next }, pct, levelUps };
}

function selectLevelUps({ source, classes }: Progression): TopbarVM["levelUps"] {
  if (source !== "item") return [];
  return classes
    .filter((classItem) => classItem.system.canLevelUp)
    .map((classItem) => ({
      label: classes.length > 1 ? `Level up ${classItem.name}` : "Level up",
      classItem,
    }));
}
