import type { OSEActor, OseClassItem } from "@domain/types";
import type { TopbarVM, XpTrackVM } from "@domain/vm-types";
import { selectClassDefaults, selectProgression, type Progression } from "@domain/classRules";

const bandPct = (value: number, floor: number, next: number | null) => {
  if (next == null) return 0;
  const span = next - floor;
  return span > 0 ? Math.min(100, Math.max(0, ((value - floor) / span) * 100)) : 0;
};

export function selectTopbar(actor: OSEActor): TopbarVM {
  const { level, xp } = actor.system.details;
  // OSE stores no band floor — only `xp.next` — so the floor comes from the
  // class XP table, and an unmatched (custom) class has none to read.
  const defaults = selectClassDefaults(actor);
  const floor = defaults.levelXp ?? 0;
  const progression = selectProgression(actor);
  const next = progression.source === "item" ? defaults.nextXp : xp.next;
  const levelUps = selectLevelUps(progression);
  const classTracks = progression.classes.length > 1 ? progression.classes.map(classTrack) : [];
  return {
    level,
    nextLevel: next == null ? null : level + 1,
    xp: { value: xp.value, floor, next },
    pct: bandPct(xp.value, floor, next),
    levelUps,
    classTracks,
  };
}

function classTrack(classItem: OseClassItem): XpTrackVM {
  const { level, xp, currentRow, nextRow } = classItem.system;
  const floor = currentRow?.xp ?? 0;
  const next = nextRow?.xp ?? null;
  return {
    name: classItem.name as string,
    level,
    nextLevel: next == null ? null : level + 1,
    xp: { value: xp, floor, next },
    pct: bandPct(xp, floor, next),
  };
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
