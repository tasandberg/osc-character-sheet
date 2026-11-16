import type { ClassLevelRow } from "@ose-foundry-core/types";
import type { OseClassItem } from "@domain/types";

export const levelRow = (
  xp: number,
  hd: string,
  thac0: number,
  saves: [number, number, number, number, number],
  spellSlots: Record<string, number> = {},
): ClassLevelRow => {
  const [death, wand, paralysis, breath, spell] = saves;
  return {
    xp,
    hd,
    hdcon: true,
    thac0,
    bba: 19 - thac0,
    saves: { death, wand, paralysis, breath, spell },
    spellSlots,
  };
};

export const classItem = (
  name: string,
  level: number,
  xp: number,
  levels: ClassLevelRow[],
) =>
  ({
    name,
    system: {
      level,
      xp,
      levels,
      maxLevel: levels.length,
      requirements: {},
      hasTable: levels.length > 0,
      currentRow: levels[level - 1] ?? null,
      nextRow: levels[level] ?? null,
      canLevelUp: !!levels[level] && xp >= levels[level].xp,
    },
  }) as unknown as OseClassItem;
