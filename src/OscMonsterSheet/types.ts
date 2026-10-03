import type { OseRollType, RollEvent } from "@domain/types";

export type MonsterSaveKey =
  "death" | "wand" | "paralysis" | "breath" | "spell";

export type MonsterItem = {
  id: string;
  _id: string;
  name: string;
  type: string;
  img?: string;
  system: {
    pattern?: string;
    damage?: string;
    bonus?: number;
    slow?: boolean;
    counter?: { value: number; max: number };
    roll?: string;
    rollType?: OseRollType;
    rollTarget?: number;
    save?: string;
    description?: string;
    lvl?: number;
    memorized?: number;
    cast?: number;
  };
  roll: (options?: { skipDialog?: boolean }) => void;
  show: () => Promise<unknown>;
  update: (data: Record<string, unknown>) => Promise<unknown>;
  delete: () => Promise<unknown>;
  sheet?: { render: (force: boolean) => void } | null;
};

export type MonsterActor = {
  id: string;
  uuid: string;
  name: string;
  img: string;
  type: string;
  isOwner: boolean;
  items: {
    contents: MonsterItem[];
    get: (id: string) => MonsterItem | undefined;
  };
  system: {
    hp: { hd: string; value: number | null; max: number | null };
    ac: { value: number | null } | null;
    aac: { value: number | null } | null;
    thac0: { value: number | null; bba: number | null };
    saves: Record<MonsterSaveKey, { value: number | null }>;
    movement: { base: number | null; encounter?: number | null };
    details: {
      alignment?: string;
      xp?: number | string;
      biography?: string;
      morale?: number | string;
      movement?: string;
      specialAbilities?: number | string;
      appearing?: { d?: number | string; w?: number | string };
      treasure?: { table?: string | null; type?: string };
    };
    retainer?: { enabled: boolean; loyalty: number | null };
    config?: { enableInventory?: boolean };
    spells?: {
      enabled: boolean;
      slots?: { [n: number]: { used: number; max: number } };
      spellList?: Record<string, MonsterItem[]>;
    };
    attackPatterns?: Record<string, MonsterItem[]>;
    abilities?: MonsterItem[];
    isNew?: boolean;
  };
  update: (data: Record<string, unknown>) => Promise<unknown>;
  updateEmbeddedDocuments: (
    type: "Item",
    updates: Record<string, unknown>[],
  ) => Promise<unknown>;
  rollHitDice: (options?: {
    event?: RollEvent;
  }) => Promise<{ total?: number } | null | undefined>;
  rollMorale: (options?: { event?: RollEvent }) => void;
  rollReaction: (options?: { event?: RollEvent }) => void;
  rollLoyalty: (options?: { event?: RollEvent }) => void;
  rollAppearing: (options?: {
    event?: RollEvent;
    check?: "dungeon" | "wilderness";
  }) => void;
  rollSave: (save: MonsterSaveKey, options?: { event?: RollEvent }) => void;
  targetAttack: (
    data: { roll: Record<string, unknown> },
    type: undefined,
    options: { type: undefined; skipDialog: boolean },
  ) => void;
};
