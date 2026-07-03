import type { OSEActor, OSESave, OseItem } from "@domain/types";
import type { RollSpec } from "@domain/vm-types";
import { selectAbilities } from "@features/actions/abilities";
import { selectAttacks } from "@features/actions/attacks";
import { selectSaves } from "@features/actions/saves";
import { selectExploration, rollExploration } from "@features/actions/exploration";
import { postRollCard } from "@domain/chat/attackCard";
import { buildItemMacroDragData } from "@features/inventory/dragToMacro";
import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import { AttacksTable } from "@features/actions/AttacksTable";
import { MemorizedSpells } from "@features/actions/MemorizedSpells";
import { SavesGrid, ExplorationGrid } from "@features/actions/SavesExploration";
import { SectionTitle } from "@ui/SectionTitle";

type Props = { actor: OSEActor };

/** Actions tab body — all sections stack (Abilities, Attacks, Spells, and at xs +
 *  md Saves/Exploration). At lg, Saves/Exploration live in the left rail instead,
 *  so they carry .actions-only (hidden at lg — see SheetShell/shell.scss). */
export function ActionsView({ actor }: Props) {
  const onAbility = (key: string) => actor.rollCheck(key, {});
  // Hit/Damage are custom formula rolls (OSE has no separate hit/damage roll). The
  // Vellum card is target-aware: a hit roll shows HIT/MISS vs the current target's AC,
  // a damage roll offers GMs an apply-damage button. No target → plain card.
  const onRoll = (spec: RollSpec) => void postRollCard(actor, spec);
  // The composite "Attack" uses OSE's own weapon roll dialog.
  const onAttack = (itemId: string) =>
    actor.system.weapons.find((w) => w._id === itemId)?.rollWeapon({ skipDialog: false });
  const onOpenWeapon = (itemId: string) => actor.items.get(itemId)?.sheet?.render(true);
  const onSave = (key: OSESave) => actor.rollSave(key, {});
  const onExploration = (key: string) => rollExploration(actor, key);
  // Drag a weapon card onto the macro hotbar → OSE's hotbarDrop creates an attack
  // macro, same as dragging the item's inventory row.
  const dragData = (itemId: string) => {
    const item = actor.items.get(itemId) as unknown as OseItem | undefined;
    return item ? buildItemMacroDragData(actor, item) : undefined;
  };

  const attacks = selectAttacks(actor);

  return (
    <>
      <AbilityPlaques abilities={selectAbilities(actor)} onRoll={onAbility} />
      <AttacksTable attacks={attacks} onRoll={onRoll} onAttack={onAttack} onOpen={onOpenWeapon} dragData={dragData} />
      <MemorizedSpells actor={actor} />
      {/* .actions-only: hidden at lg (Saves/Exploration live in the rail there). */}
      <section className="osc-section actions-only">
        <SectionTitle hint="roll-above d20">Saving Throws</SectionTitle>
        <SavesGrid saves={selectSaves(actor)} onRoll={onSave} />
      </section>
      <section className="osc-section actions-only">
        <SectionTitle hint="1-in-6">Exploration</SectionTitle>
        <ExplorationGrid exploration={selectExploration(actor)} onRoll={onExploration} />
      </section>
    </>
  );
}
