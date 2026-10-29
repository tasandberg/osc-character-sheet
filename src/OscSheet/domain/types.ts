import type {
  AbilityItemData,
  CharacterAC,
  CharacterEncumbrance,
  CharacterMove,
  ContainerItemData,
  ExplorationSkills,
  MiscItemData,
  PhysicalItemData,
  RollType,
  Save,
  SpellItemData,
  WeaponItemData,
} from "@ose-foundry-core/types";
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
   *  while the sheet is open). Absent outside a Foundry sheet (tests). */
  isEditable?: boolean;
  canViewFullSheet?: boolean;
};

export type OscSheetAppProps = {
  actor?: OSEActor;
  source?: OSEActor;
  contextConnector: ContextConnector<OscContext>;
  /** Foundry's `sheet.isEditable`. When omitted, edit gating falls back to
   *  `actor.isOwner` (e.g. tests that mount the app directly). */
  isEditable?: boolean;
  canViewFullSheet?: boolean;
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
  canViewFullSheet: boolean;
  updateActor: (updateData: Record<string, unknown>) => Promise<OSEActor | void>;
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
      /** Tweaks: drop the weapon bonus from this actor's damage rolls. */
      ignoreBonusDamage?: boolean;
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
        next: number | null;
        share: number;
      };
    };
    encumbrance: CharacterEncumbrance;
    exploration: ExplorationSkills & Record<string, number | undefined>;
    languages: { value: string[] };
    retainer?: {
      enabled: boolean;
      loyalty: number | null;
      wage: string;
    };
    movement: CharacterMove;
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
    init: number;
    /** To-hit: `value` = THAC0 (descending), `bba` = base attack bonus (ascending),
     *  `mod` = the Tweaks per-range attack bonuses. */
    thac0: { value: number; bba: number; mod?: { melee?: number; missile?: number } };
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
  rollLoyalty: (options: { event?: RollEvent }) => void;
  rollHitDice: (options: { event?: RollEvent }) => void;
  update: (updateData: Record<string, unknown>) => Promise<OSEActor>;
};

export type OseItem = Omit<Item, "type"> & {
  type: string;
  system: PhysicalItemData &
    Pick<MiscItemData, "treasure" | "cumulativeCost" | "cumulativeWeight"> &
    Partial<Pick<MiscItemData, "cumulativeItemslots" | "isCoinsOrGems">> &
    Partial<Pick<ContainerItemData, "contents" | "totalWeight">>;
  rollWeapon: (options: { skipDialog: boolean }) => void;
  update: (updateData: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: string | number | Record<any, any>;
  }) => Promise<OSEActor>;
};

export type OseWeapon = OseItem & { system: WeaponItemData };

/** Roll-comparison key, sourced from the OSE system's CONFIG (`roll_type`). */
export type OseRollType = RollType;

export type OseAbility = OseItem & {
  system: AbilityItemData;
  /** OSE item roll dispatcher — for abilities, rolls the formula + posts to chat. */
  roll: (options?: { event?: Event }) => void;
};

export type OseSpell = OseItem & {
  system: SpellItemData;
  spendSpell: ({ skipDialog }: { skipDialog: boolean }) => Promise<void>;
  /** Post the spell's chat card (with follow-up roll buttons). */
  show: () => Promise<unknown>;
  /** Roll the spell's `system.roll` formula, posting a card. */
  rollFormula: (options?: Record<string, unknown>) => Promise<unknown>;
};
