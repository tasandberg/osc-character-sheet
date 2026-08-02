import type { OSEActor, OseAbility, OseRollType } from "@domain/types";
import { showDeleteDialog } from "@domain/foundryDialogs";
import { isFavorite, toggleFavorite } from "@domain/favorites";

export interface FeatureVM {
  id: string;
  name: string;
  img: string;
  /** Raw HTML description; enriched at render via Foundry's TextEditor. */
  description: string;
  /** Raw `requirements` (e.g. "elf" / "magic-user"). undefined when unset. */
  requirements?: string;
  /** Title-cased requirements for the tag under the name (e.g. "Elf"). undefined when unset. */
  requiresLabel?: string;
  /** True when the feature has a roll formula (passive features are false). */
  rollable: boolean;
  /** Composed tag, e.g. "1d6 ≤2" or "1d6" when there's no target. undefined when passive. */
  rollTag?: string;
  /** Bare formula, e.g. "1d6". undefined when passive. */
  rollFormula?: string;
  /** Comparison and target, e.g. "≤2". undefined when the ability sets no target. */
  rollTargetTag?: string;
  /** Flagged to appear on the Actions tab. */
  favorite: boolean;
  /** Calls the OSE ability item's own roll method (chat, success/fail, blind). */
  onRoll?: () => void;
  /** Same call, always present — rolls the formula, or prints the ability to chat when passive. */
  onActivate: () => void;
  /** Toggles the backing item's favorite flag. */
  onToggleFavorite: () => void;
  /** Opens the backing ability item's sheet. */
  onOpen: () => void;
  /** Opens the confirm-delete dialog for the backing item. */
  onDelete: () => void;
}

/** Symbol for the roll comparison (= / ≥ / ≤) from CONFIG.OSE. Falls back to "=". */
function rollSymbol(rollType?: OseRollType): string {
  const map = CONFIG.OSE?.roll_type;
  return (rollType && map?.[rollType]) || "=";
}

function composeTag(roll: string, rollType?: OseRollType, rollTarget?: number): string {
  // OSE only shows the target half when rollTarget is set (0/undefined ⇒ formula only).
  if (!rollTarget) return roll;
  return `${roll} ${rollSymbol(rollType)}${rollTarget}`;
}

/** Normalize a `requirements` string to a comparison/sort slug ("Magic User" ⇒ "magic-user"). */
function classSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "-");
}

/** Title-case a requirements value for the tag, e.g. "magic-user" ⇒ "Magic-User". */
function requiresLabel(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value
    .trim()
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

/**
 * Abilities — real `ability` Items on `actor.system.abilities`. Each item
 * self-declares its class/race via `requirements`. One flat list, sorted by
 * `requirements` (then name); empty-requirements abilities sort last.
 * (Distinct from `abilities.ts`, which is the six ability *scores*.)
 */
export function selectFeatures(actor: OSEActor): FeatureVM[] {
  const abilities = Object.values(actor.system.abilities ?? {}) as OseAbility[];
  const vms: FeatureVM[] = abilities.map((item) => {
    const s = item.system;
    const rollable = !!s.roll;
    const activate = () => item.roll();
    return {
      id: item._id as string,
      name: item.name,
      img: item.img,
      description: s.description ?? "",
      requirements: s.requirements || undefined,
      requiresLabel: requiresLabel(s.requirements),
      rollable,
      rollTag: rollable ? composeTag(s.roll!, s.rollType, s.rollTarget) : undefined,
      rollFormula: rollable ? s.roll! : undefined,
      rollTargetTag:
        rollable && s.rollTarget ? `${rollSymbol(s.rollType)}${s.rollTarget}` : undefined,
      favorite: isFavorite(item),
      onRoll: rollable ? activate : undefined,
      onActivate: activate,
      onToggleFavorite: () => void toggleFavorite(item),
      onOpen: () => item.sheet.render(true),
      onDelete: () => showDeleteDialog(item),
    };
  });
  return vms.sort((a, b) => {
    const sa = classSlug(a.requirements ?? "");
    const sb = classSlug(b.requirements ?? "");
    // empty requirements last; otherwise alphabetical by slug, then name
    if (!sa !== !sb) return sa ? -1 : 1;
    return sa.localeCompare(sb) || a.name.localeCompare(b.name);
  });
}

/** The abilities flagged to appear on the Actions tab, in the same order. */
export function selectFavoriteAbilities(actor: OSEActor): FeatureVM[] {
  return selectFeatures(actor).filter((f) => f.favorite);
}
