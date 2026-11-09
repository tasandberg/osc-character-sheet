import type { OseClassItem } from "@domain/types";

const SAVE_KEYS = ["death", "wand", "paralysis", "breath", "spell"] as const;
const SPELL_LEVELS = ["1", "2", "3", "4", "5", "6"];

export interface ClassTableRow {
  level: number;
  xp: number;
  hd: string;
  hdcon: boolean;
  thac0: number;
  bba: number;
  saves: number[];
  spellSlots: (number | null)[];
  current: boolean;
}

export interface ClassTable {
  id: string;
  name: string;
  saveKeys: readonly string[];
  spellLevels: string[];
  rows: ClassTableRow[];
}

export const classTable = (item: OseClassItem): ClassTable | null => {
  if (!item.system.levels?.length) return null;
  const { levels, currentRow } = item.system;
  const spellLevels = SPELL_LEVELS.filter((lvl) =>
    levels.some((row) => row.spellSlots?.[lvl] > 0),
  );
  return {
    id: item.id ?? item.name,
    name: item.name,
    saveKeys: SAVE_KEYS,
    spellLevels,
    rows: levels.map((row, i) => ({
      level: i + 1,
      xp: row.xp,
      hd: row.hd,
      hdcon: row.hdcon,
      thac0: row.thac0,
      bba: row.bba,
      saves: SAVE_KEYS.map((key) => row.saves[key]),
      spellSlots: spellLevels.map((lvl) => row.spellSlots?.[lvl] ?? null),
      current: row === currentRow,
    })),
  };
};
