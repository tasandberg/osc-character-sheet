import type { CharacterAC, CharacterEncumbrance, RollType, Save } from "@ose-foundry-core/types";
import type OseDataModelCharacterScores from "@domain/data-model-character-scores";
import type { TabIds } from "@app/tabs";
import type { ContextConnector } from "foundry-vtt-react";

/** Saving-throw category key, sourced from the OSE system's CONFIG (`saves_long`). */
export type OSESave = Save;

/** Structural shape OSE's roll dialog check reads — satisfied by DOM and React events. */
export type RollEvent = { ctrlKey: boolean; metaKey: boolean };

/** Attack range of a weapon mode. */
export type AttackKind = "melee" | "missile";
/** What OSE rolls as — non-characters have no melee/missile split. */
export type AttackType = AttackKind | "attack";

// Add props as needed
export type OscContext = {
  document: OSEActor;
  /** Foundry's `sheet.isEditable`, republished on every render (ownership can change
   *  while the sheet is open). Absent outside a Foundry sheet (Storybook / tests). */
  isEditable?: boolean;
};

export type OscSheetAppProps = {
  actor?: OSEActor;
  source?: OSEActor;
  contextConnector: ContextConnector<OscContext>;
  /** Foundry's `sheet.isEditable`. When omitted, edit gating falls back to
   *  `actor.isOwner` (e.g. Storybook / tests that mount the app directly). */
  isEditable?: boolean;
};

// Define the shape of your context value here
export interface OscSheetContextValue {
  actor: OSEActor;
  source: OSEActor;
  items: OseItem[];
  actorData: OSEActor["_source"]["system"];
  currentTab: TabIds;
  setCurrentTab: (tabId: TabIds) => void;
  /** Global edit gate: true for owners, false for observers/limited (read-only
   *  sheet). Components hide/disable write affordances when false. */
  canEdit: boolean;
  updateActor: (updateData: {
    [key: string]: string | number | boolean | string[];
  }) => Promise<OSEActor | void>;
  /** Apply an optimistic patch (flat dot-paths) to a doc immediately, run the real
   *  Foundry write, and reconcile/rollback async. `key` = item `_id` or "actor".
   *  Provided by OptimisticProvider; undefined outside it. */
  optimisticUpdate?: (
    key: string,
    patch: Record<string, unknown>,
    commit: () => Promise<unknown>,
    debounceMs?: number,
  ) => void;
}

export type OseSpellList = Record<number, OseSpell[]>;

export type OSEActor = Actor & {
  img: string;
  name: string;
  items: Actor["items"] | OseItem[] | { contents: OseItem[] };
  updatedAt?: string;
  system: {
    aac: CharacterAC;
    ac: CharacterAC;
    config?: {
      movementAuto?: boolean;
    };
    details: {
      alignment: string;
      class: string;
      biography: string;
      level: number;
      notes: string;
      title: string;
      xp: {
        bonus: number;
        value: number;
        next: number;
        share: number;
      };
    };
    encumbrance: CharacterEncumbrance;
    exploration: {
      ft: number;
      ld: number;
      od: number;
      sd: number;
    };
    languages: { value: string[] };
    movement: {
      base: number;
      encounter: number;
      overland: number;
    };
    spells: {
      spellList: OseSpellList;
      slots: { [n: number]: { used: number; max: number } };
      enabled: boolean;
    };
    scores: OseDataModelCharacterScores;
    abilities: Record<string, OseItem>;
    treasures: Record<string, OseItem>;
    hp: {
      value: number;
      max: number;
      hd: string;
    };
    saves: Record<OSESave, { value: number }>;
    initiative: { value: number; mod: number };
    /** To-hit: `value` = THAC0 (descending), `bba` = base attack bonus (ascending). */
    thac0: { value: number; bba: number };
    updatedAt?: string;
    weapons: OseWeapon[];
  };
  _source: OSEActor;
  targetAttack: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roll: { [key: string]: any },
    type: AttackType,
    options: {
      type: AttackType;
      skipDialog?: boolean;
    }
  ) => void;
  rollCheck: (
    score: string,
    options: { event?: RollEvent; fastForward?: boolean; chatMessage?: string }
  ) => void;
  rollExploration: (
    action: string,
    options: { event?: RollEvent; fastForward?: boolean; chatMessage?: string }
  ) => void;
  rollSave: (
    save: OSESave,
    options: { event?: RollEvent; fastForward?: boolean; chatMessage?: string }
  ) => void;
  update: (updateData: {
    [key: string]: string | number | boolean;
  }) => Promise<OSEActor>;
};

export type OseItem = Omit<Item, "type"> & {
  type: string;
  system: {
    quantity: {
      value: number;
      max: number;
    };
    containerId: string;
    contents: OseItem[];
    cost: number;
    cumulativeCost: number;
    cumulativeWeight: number;
    totalWeight?: number;
    equipped?: boolean;
    tags?: { label: string; value: string; icon: string }[];
    treasure: boolean;
    weight: number;
  };
  rollWeapon: (options: { skipDialog: boolean }) => void;
  update: (updateData: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: string | number | Record<any, any>;
  }) => Promise<OSEActor>;
};

export type OseWeapon = OseItem & {
  system: {
    damage: string;
    qualities: { label: string; value: string; icon: string }[];
    description: string;
    melee: boolean;
    missile: boolean;
    equipped: boolean;
    /** Save the target may roll against this weapon's attack. */
    save?: string;
  };
  bonus: number;
};

/** Roll-comparison key, sourced from the OSE system's CONFIG (`roll_type`). */
export type OseRollType = RollType;

export type OseAbility = OseItem & {
  system: {
    requirements?: string;
    /** Enriched/raw HTML feature text. */
    description?: string;
    /** Roll formula, e.g. "1d6". Empty for passive features. */
    roll?: string;
    /** result | above | below → = / ≥ / ≤ (via CONFIG.OSE.roll_type). */
    rollType?: OseRollType;
    /** Target number for the success comparison. 0 = none. */
    rollTarget?: number;
    /** Associated saving throw, if any. */
    save?: string;
    blindroll?: boolean;
  };
  /** OSE item roll dispatcher — for abilities, rolls the formula + posts to chat. */
  roll: (options?: { event?: Event }) => void;
};

export type OseSpell = OseItem & {
  system: {
    lvl: number;
    range: string;
    duration: string;
    save: string;
    memorized: number;
    cast: number;
    /** Optional roll formula, e.g. "1d6+1" — attack spells only (OSE `system.roll`). */
    roll?: string;
  };
  spendSpell: ({ skipDialog }: { skipDialog: boolean }) => Promise<void>;
  /** Post the spell's chat card (with follow-up roll buttons). */
  show: () => Promise<unknown>;
  /** Roll the spell's `system.roll` formula, posting a card. */
  rollFormula: (options?: Record<string, unknown>) => Promise<unknown>;
};
