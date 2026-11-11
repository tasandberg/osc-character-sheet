import type { EncumbranceVM, LoyaltyVM, MoveBands } from "@domain/vm-types";
import { armorTierLabel } from "@domain/format";
import { effectsLabel } from "@features/effects/effects";
import { LeaderRow } from "@ui/LeaderRow";
import { MoveTooltip } from "@ui/MovePop";
import { RollLabel } from "@ui/RollLabel";
import { RollLeaderRow } from "@ui/RollLeaderRow";
import type { ActivateEvent } from "@ui/rollable";

type Props = {
  moveBands: MoveBands;
  hitDice?: string;
  onRollHitDice?: (event: ActivateEvent) => void;
  encumbrance?: EncumbranceVM;
  retainer?: LoyaltyVM | null;
  onRollLoyalty?: (event: ActivateEvent) => void;
  onOpenEffects?: () => void;
  effectCount?: number;
};

const key = (label: string) => <span className="vm-key">{label}</span>;

export function StatsTable({
  moveBands,
  hitDice,
  onRollHitDice,
  encumbrance,
  retainer,
  onRollLoyalty,
  onOpenEffects,
  effectCount = 0,
}: Props) {
  const enc = encumbrance?.enabled ? encumbrance : undefined;
  return (
    <section aria-label="Statistics">
      <div className="tw:grid tw:grid-cols-2 tw:gap-x-5 tw:@md/app:grid-cols-3">
        <LeaderRow label={key("Move")}>
          <span
            tabIndex={0}
            className="tw:relative tw:cursor-default tw:underline tw:decoration-(--text-dim) tw:decoration-dotted tw:underline-offset-[2px]"
          >
            {moveBands.explore}ft
            <MoveTooltip
              bands={moveBands}
              tier={enc?.tier}
              status={enc?.status}
              armor={enc?.armorTier ? armorTierLabel(enc.armorTier) : undefined}
            />
          </span>
        </LeaderRow>
        {hitDice !== undefined && (
          <RollLeaderRow
            label="Hit Dice"
            onRoll={hitDice ? onRollHitDice : undefined}
          >
            {hitDice || "—"}
          </RollLeaderRow>
        )}
        {onOpenEffects && (
          <LeaderRow label={key(effectsLabel("OSE.category.effects"))}>
            <RollLabel
              glyph={false}
              aria-label={effectsLabel("OSE.category.effects")}
              title={effectsLabel("OSE.category.effects")}
              data-testid="effect-count"
              onRoll={onOpenEffects}
            >
              {effectCount}
            </RollLabel>
          </LeaderRow>
        )}
        {retainer && (
          <RollLeaderRow
            label="Loyalty"
            onRoll={retainer.value != null ? onRollLoyalty : undefined}
          >
            <span data-testid="loyalty">{retainer.value ?? "—"}</span>
          </RollLeaderRow>
        )}
        {retainer && (
          <LeaderRow label={key("Wage")}>
            <span data-testid="wage">{retainer.wage || "—"}</span>
          </LeaderRow>
        )}
      </div>
    </section>
  );
}
