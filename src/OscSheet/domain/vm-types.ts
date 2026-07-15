import type { AttackKind, OSESave, OseSpell } from "@domain/types";

export interface IdentityVM {
  name: string;
  img: string;
  classLabel: string;
  level: number;
  alignment: string;
  title: string;
}

/** The three OSE movement rates: ft/round · ft/turn · miles/day. */
export interface MoveBands {
  encounter: number;
  explore: number;
  travel: number;
}

export interface VitalsVM {
  hp: { value: number; max: number };
  /** Resolved AC for display: value matching the ascendingAC setting + the mode. */
  ac: { value: number; ascending: boolean };
  initMod: number;
  hd: string;
  move: number;
  /** Movement bands for the MOVE pill popover (per-round / per-turn / per-day). */
  moveBands: MoveBands;
}

export interface AbilityVM {
  key: string;
  label: string;
  value: number;
  mod: number;
  modLabel: string;
}

/** A clickable roll: what to show on the pill, the dice formula, and chat flavour. */
export interface RollSpec {
  /** Display label, e.g. "1d20 +1(str)" or "1d8". */
  label: string;
  /** Foundry roll formula, e.g. "1d20+1". */
  formula: string;
  /** Chat-message flavour. */
  flavor: string;
  /** Roll kind — drives the Vellum chat card (hit → AC compare, damage → apply button). */
  kind?: "hit" | "damage";
  /** Weapon name, for the chat card header. */
  weapon?: string;
}

/** One attack mode (melee or missile) of a weapon: its hit/damage rolls + displays. */
export interface AttackMode {
  kind: AttackKind;
  kindLabel: string;
  /** To-hit roll (1d20 + ability mod). */
  hit: RollSpec;
  /** Button text — always-signed mono, e.g. "+2" / "+0". */
  hitDisplay: string;
  /** Full hit formula with named mods for the popover, e.g. "1d20 + 1 (dex)". */
  hitTip: string;
  /** Damage roll (weapon die + ability mod). */
  dmg: RollSpec;
  /** Button text — always-signed mono, e.g. "1d6+0" / "1d10+2". */
  dmgDisplay: string;
  /** Full damage formula with named mods for the popover, e.g. "1d6 + 1 (str)". */
  dmgTip: string;
}

/** One equipped weapon. A weapon that is both melee+missile carries both modes
 *  (melee first); the row lets the player toggle which one is active. */
export interface AttackVM {
  id: string;
  itemId: string;
  name: string;
  img: string;
  /** One per attack mode, melee before missile. length 1 = a single static tag. */
  modes: AttackMode[];
  qualities: { label: string; icon: string }[];
}

export interface SaveVM {
  key: OSESave;
  label: string;
  icon: string;
  target: number;
}

export interface ExplorationVM {
  key: string;
  label: string;
  icon: string;
  inSix: number;
  /** Not modelled in OSE (Forage/Hunt) — fires a plain 1d6 instead of a skill roll. */
  simple: boolean;
}

export interface TopbarVM {
  level: number;
  nextLevel: number;
  xp: { value: number; next: number };
  /** Progress through the current level's XP band, 0–100. */
  pct: number;
}

export interface WealthMovementVM {
  coins: { name: string; img: string; qty: number }[];
  move: { encounter: number; explore: number; travel: number };
}

export type InventorySortKey = "manual" | "category" | "name" | "weight";
export type SortDir = "asc" | "desc";

export interface InventoryItemVM {
  id: string;
  name: string;
  img: string;
  category: string; // "Weapon" | "Armour" | "Gear" | "Container"
  categoryRank: number; // weapon 0, armour 1, gear 2, container 3
  /** Weapon damage die, e.g. "1d8". "" for non-weapons. */
  damage: string;
  /** Item tags from system.tags (label + icon), deduped. [] if none. */
  tags: { label: string; icon: string }[];
  /** Short monogram for the grid card when the item has no real art. */
  monogram: string;
  weight: number;
  /** Item cost in gp (system.cost). 0 when unset. */
  cost: number;
  /** Armour class for armour items — label is "AC"/"AAC" per the ascendingAC setting. null otherwise. */
  armorClass: { label: string; value: number } | null;
  sort: number; // manual order — osc-sheet `order` flag (falls back to item.sort)
  equippedSort: number; // manual order within the equipped tray — `equippedOrder` flag (falls back to `sort`)
  /** null when the item type can't be equipped (no `equipped` field). */
  equipped: boolean | null;
  /** null unless the item is a stack (qty > 1) or charged (max set). */
  quantity: { value: number; max: number } | null;
  isContainer: boolean;
  children: InventoryItemVM[]; // [] unless container; nested by containerId
}

/** @deprecated use InventoryVM.items (flat list with containers carrying children) */
export interface InventoryGroup {
  key: string;
  label: string;
  items: InventoryItemVM[];
}

export interface InventoryVM {
  items: InventoryItemVM[]; // top-level only; containers carry their children. Includes equipped items.
  /** Currently-equipped items, shown in the equipped tray (a subset of `items`). */
  equipped: InventoryItemVM[];
  count: number;
  /** @deprecated kept for grid view compatibility */
  groups: InventoryGroup[];
}

/** One spell level's panel: capacity, the prepared rows, and the full spellbook. */
export interface SpellLevelVM {
  level: number;
  /** used = casts still ready (sum of `cast`, drops as you cast); max = slot capacity. */
  slots: { used: number; max: number };
  /** Filled slots = sum of `memorized` (persists across casts); caps memorisation. */
  occupied: number;
  /** Selected spells (`memorized > 0`), shown as prepared rows (incl. fully spent). */
  prepared: OseSpell[];
  /** Every known spell at this level (for the expandable spellbook). */
  spellbook: OseSpell[];
}

export interface CoinVM {
  /** Uppercase denomination label, e.g. "GP". */
  denom: string;
  /** The backing treasure item's id (for quantity updates). */
  id: string;
  /** The backing item's actual name (e.g. "Gold Pieces", "[01.00] Gold (gp)"). */
  name: string;
  /** The backing item's image (Foundry item img); "" when unset. */
  img: string;
  value: number;
  /** gp value of one coin of this denom (system.cost, std fallback) — for the wealth total. */
  gpEach: number;
}

/** 0 unencumbered · 1/2/3 OSE movement breakpoints · 4 overloaded (over max). */
export type EncumbranceTier = 0 | 1 | 2 | 3 | 4;

export interface EncumbranceVM {
  enabled: boolean;
  value: number;
  max: number;
  /** Fraction 0–1 for the progress bar. */
  pct: number;
  /** Movement-rate tier, from OSE breakpoint flags (not our own % buckets). */
  tier: EncumbranceTier;
  /** e.g. "Unencumbered" — derived from `tier`. */
  status: string;
  /** Variant-aware value/max readout, e.g. "1071 / 1600 cn" or "10 / 16 items". */
  label: string;
  /** The three movement rates at the current tier (same source as the header MOVE pop). */
  moveBands: MoveBands;
  /** Tier boundaries as % of the bar, from the system's own variant-aware `steps`
   *  (empty when the bar's axis isn't weight — see selectEncumbrance). */
  bands: number[];
}
