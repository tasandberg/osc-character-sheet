import { useState, type MouseEvent } from "react";
import type { AttackKind, OSEActor, OSESave, OseItem } from "@domain/types";
import { skipRollDialog } from "@domain/rolls/skipRollDialog";
import { buildWeaponAttack } from "@domain/rolls/weaponAttack";
import type { RollSpec, EncumbranceVM } from "@domain/vm-types";
import { selectAbilities } from "@features/actions/abilities";
import { selectAttacks } from "@features/actions/attacks";
import { selectSaves } from "@features/actions/saves";
import {
  selectExploration,
  rollExploration,
} from "@features/actions/exploration";
import { postRollCard } from "@domain/chat/attackCard";
import { buildItemMacroDragData } from "@features/inventory/dragToMacro";
import { AbilityPlaques } from "@features/actions/AbilityPlaques";
import { MetaEyebrow } from "@features/actions/MetaEyebrow";
import { selectHdParts } from "@domain/classRules";
import { selectLoyalty, rollLoyalty } from "@features/actions/loyalty";
import { AttacksTable } from "@features/actions/AttacksTable";
import {
  clearUserTarget,
  selectAttackTargets,
  targetToken,
  useUserTarget,
} from "@features/actions/attackTargets";
import { useSetting } from "@src/OscSheet/settings";
import { FavoriteAbilities } from "@features/actions/FavoriteAbilities";
import { selectFavoriteAbilities } from "@features/abilities/features";
import { MemorizedSpells } from "@features/actions/MemorizedSpells";
import { SavesList, ExplorationGrid } from "@features/actions/SavesExploration";
import { SectionTitle } from "@ui/SectionTitle";
import type { ActivateEvent } from "@ui/rollable";
import { useOscSheetContext } from "@app/context";
import SavesModTag from "@src/OscSheet/components/ui/SavesModTag";
import { ScoreDialog } from "@features/scores/ScoreDialog";
import type { ScoreKey } from "@features/scores/scoreBreakdown";

type Props = {
  actor: OSEActor;
  encumbrance?: EncumbranceVM;
  onOpenEffects?: () => void;
  effectCount?: number;
};

/** Actions tab body — all sections stack (Abilities, Attacks, Spells, and at xs +
 *  md Saves/Exploration). At lg, Saves/Exploration live in the left rail instead,
 *  so they carry .actions-only (hidden at lg — see SheetShell/shell.scss). */
export function ActionsView({
  actor,
  encumbrance,
  onOpenEffects,
  effectCount,
}: Props) {
  // Chat-only rolls (ability/save/exploration/hit/dmg post a card, no actor write)
  // stay available even read-only; the composite Attack can write (missile ammo
  // decrement), so it's gated on the global edit permission.
  const { canEdit } = useOscSheetContext();
  const [openScore, setOpenScore] = useState<ScoreKey | null>(null);
  const promptForTarget = useSetting("promptForTarget");
  const currentTarget = useUserTarget();
  const onAbility = (key: string, event: ActivateEvent) =>
    actor.rollCheck(key, { event });
  // Hit/Damage are custom formula rolls (OSE has no separate hit/damage roll). The
  // Vellum card is target-aware: a hit roll shows HIT/MISS vs the current target's AC,
  // a damage roll offers GMs an apply-damage button. No target → plain card.
  const onRoll = (spec: RollSpec) => void postRollCard(actor, spec);
  // Straight to OSE's attack roll — the row's mode switch replaces its range dialog.
  const onAttack = (itemId: string, kind: AttackKind, event: MouseEvent) => {
    const weapon = actor.system.weapons.find((w) => w._id === itemId);
    if (!weapon) return;
    const { rollData, type } = buildWeaponAttack(actor, weapon, kind);
    actor.targetAttack(rollData, type, {
      type,
      skipDialog: skipRollDialog(event),
    });
  };
  const onOpenWeapon = (itemId: string) =>
    actor.items.get(itemId)?.sheet?.render(true);
  const onSave = (key: OSESave, event: ActivateEvent) =>
    actor.rollSave(key, { event });
  const onExploration = (key: string, event: ActivateEvent) =>
    rollExploration(actor, key, event);
  // Drag a weapon card onto the macro hotbar → OSE's hotbarDrop creates an attack
  // macro, same as dragging the item's inventory row.
  const dragData = (itemId: string) => {
    const item = actor.items.get(itemId) as unknown as OseItem | undefined;
    return item ? buildItemMacroDragData(actor, item) : undefined;
  };

  const attacks = selectAttacks(actor);
  const abilities = selectAbilities(actor);
  return (
    <>
      <div className="tw:space-y-8 tw:mb-8">
        <div className="tw:space-y-2">
          <MetaEyebrow
            moveBands={{
              encounter: Math.floor(actor.system.movement.encounter),
              explore: Math.floor(actor.system.movement.base),
              travel: Math.floor(actor.system.movement.overland),
            }}
            hitDice={
              selectHdParts(actor)
                ?.map((part) => part.hd)
                .join(" / ") ?? actor.system.hp.hd
            }
            onRollHitDice={
              canEdit ? (event) => actor.rollHitDice({ event }) : undefined
            }
            encumbrance={encumbrance}
            retainer={selectLoyalty(actor)}
            onRollLoyalty={(event) => rollLoyalty(actor, event)}
            onSetWage={
              canEdit
                ? (wage) => void actor.update({ "system.retainer.wage": wage })
                : undefined
            }
            onOpenEffects={onOpenEffects}
            effectCount={effectCount}
          />
          <AbilityPlaques
            abilities={abilities}
            onRoll={onAbility}
            onOpen={(key) => setOpenScore(key as ScoreKey)}
          />
        </div>
        <AttacksTable
          attacks={attacks}
          onRoll={onRoll}
          onAttack={canEdit ? onAttack : undefined}
          onOpen={onOpenWeapon}
          dragData={dragData}
          canAttack={canEdit}
          targeting={{
            listTargets: () => selectAttackTargets(actor),
            current: currentTarget,
            onTarget: targetToken,
            onClearTarget: clearUserTarget,
            promptForTarget,
          }}
        />
        <FavoriteAbilities
          features={selectFavoriteAbilities(actor)}
          dragData={dragData}
        />
        <MemorizedSpells actor={actor} />
        {/* Saves/Exploration live in the rail at lg, so these copies hide there. */}
        <section className="u-foundry-lg-display-none">
          <SectionTitle>
            <span className="tw:whitespace-nowrap">Saving Throws</span>
            <span className="hint">Roll d20 ≥ score</span>
            <SavesModTag wisdomAbility={abilities[2]} />
          </SectionTitle>
          <SavesList saves={selectSaves(actor)} onRoll={onSave} />
        </section>
        <section className="u-foundry-lg-display-none">
          <SectionTitle hint="1-in-6">Exploration</SectionTitle>
          <ExplorationGrid
            exploration={selectExploration(actor)}
            onRoll={onExploration}
          />
        </section>
      </div>
      <ScoreDialog scoreKey={openScore} onClose={() => setOpenScore(null)} />
    </>
  );
}
