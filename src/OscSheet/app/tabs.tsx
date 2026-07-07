import type { OSEActor } from "@domain/types";
import Abilities from "@features/abilities/AbilitiesView";
import Spells from "@features/spells/SpellsView";
import Notes from "@features/notes/NotesView";

export enum TabIds {
  ACTIONS = "page-actions",
  SPELLS = "page-spells",
  INVENTORY = "page-inventory",
  ABILITIES = "page-abilities",
  NOTES = "page-notes",
}

export type TabDef = {
  icon: string;
  label: string;
  /**
   * Body component for the tab. Omitted for ACTIONS / INVENTORY, which SheetShell
   * renders with the live `ActionsView` / `InventoryView` (the tab def only
   * supplies their icon/label/id).
   */
  Content?: React.ComponentType;
  id: TabIds;
  disabled?: boolean;
};

export const tabs = (actor: OSEActor) =>
  [
    {
      icon: "◈",
      label: "OSE.category.actions",
      id: TabIds.ACTIONS,
    },
    {
      icon: "▤",
      label: "OSE.category.inventory",
      id: TabIds.INVENTORY,
    },
    {
      icon: "✦",
      label: "OSE.category.spells",
      Content: Spells,
      id: TabIds.SPELLS,
      disabled: !actor.system.spells.enabled,
    },
    {
      icon: "❖",
      label: "OSE.category.abilities",
      Content: Abilities,
      id: TabIds.ABILITIES,
    },
    {
      icon: "✎",
      label: "OSE.category.notes",
      Content: Notes,
      id: TabIds.NOTES,
    },
  ] as TabDef[];
