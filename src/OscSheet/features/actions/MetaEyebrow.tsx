import { Fragment, type ReactNode } from "react";
import type { EncumbranceVM, LoyaltyVM, MoveBands } from "@domain/vm-types";
import { armorTierLabel } from "@domain/format";
import { effectsLabel } from "@features/effects/effects";
import { LeaderRow } from "@ui/LeaderRow";
import { MoveTooltip } from "@ui/MovePop";
import { HoverTip } from "@ui/HoverTip";
import { RollLabel } from "@ui/RollLabel";
import { RollDieButton } from "@ui/RollDieButton";
import { InlineEditValue } from "@ui/InlineEditValue";
import type { ActivateEvent } from "@ui/rollable";

type Props = {
  moveBands: MoveBands;
  hitDice?: string;
  hitDiceParts?: { name: string; hd: string }[];
  onRollHitDice?: (event: ActivateEvent) => void;
  encumbrance?: EncumbranceVM;
  retainer?: LoyaltyVM | null;
  onRollLoyalty?: (event: ActivateEvent) => void;
  onOpenEffects?: () => void;
  effectCount?: number;
  onSetWage?: (wage: string) => void;
};

function Meta({
  label,
  onLabelClick,
  children,
}: {
  label: ReactNode;
  onLabelClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="tw:min-w-0">
      <LeaderRow
        label={
          onLabelClick ? (
            <RollLabel
              className="vm-key u-text-mute"
              glyph={false}
              tabIndex={-1}
              aria-hidden="true"
              onRoll={onLabelClick}
            >
              {label}
            </RollLabel>
          ) : (
            <span className="vm-key u-text-mute">{label}</span>
          )
        }
        valueClassName="tw:inline-flex tw:items-baseline tw:gap-1 tw:text-(length:--fs-xs) u-text-dim"
      >
        {children}
      </LeaderRow>
    </div>
  );
}

export function MetaEyebrow({
  moveBands,
  hitDice,
  hitDiceParts,
  onRollHitDice,
  encumbrance,
  retainer,
  onRollLoyalty,
  onOpenEffects,
  effectCount = 0,
  onSetWage,
}: Props) {
  const enc = encumbrance?.enabled ? encumbrance : undefined;
  const effects = onOpenEffects && effectsLabel("OSE.category.effects");
  return (
    <section
      aria-label="Statistics"
      className="tw:grid tw:grid-cols-2 tw:gap-x-5 tw:@min-[320px]/stats:grid-cols-[repeat(3,minmax(max-content,1fr))] tw:@min-[480px]/stats:gap-x-10 tw:@twopane/sheet:grid-cols-1"
    >
      <Meta
        label={
          <>
            <span className="tw:@max-[640px]/sheet:hidden">Movement</span>
            <span className="tw:hidden tw:@max-[640px]/sheet:inline">Move</span>
          </>
        }
      >
        <span tabIndex={0} className="tw:relative tw:cursor-default">
          <span className="tw:@max-md/app:hidden">
            {moveBands.explore}'({moveBands.encounter}')
          </span>
          <span className="tw:hidden tw:@max-md/app:inline">
            {moveBands.explore}ft
          </span>
          <MoveTooltip
            bands={moveBands}
            tier={enc?.tier}
            status={enc?.status}
            armor={enc?.armorTier ? armorTierLabel(enc.armorTier) : undefined}
          />
        </span>
      </Meta>
      {hitDice !== undefined && (
        <Meta label="HD">
          {hitDiceParts
            ? hitDiceParts.map((part, i) => (
                <Fragment key={part.name}>
                  {i > 0 && " / "}
                  <span
                    tabIndex={0}
                    aria-label={`${part.name}: ${part.hd}`}
                    className="tw:relative tw:cursor-default"
                  >
                    {part.hd}
                    <HoverTip>{part.name}</HoverTip>
                  </span>
                </Fragment>
              ))
            : hitDice || "—"}
          {hitDice && onRollHitDice && (
            <RollDieButton label="Hit Dice" onRoll={onRollHitDice} />
          )}
        </Meta>
      )}
      {onOpenEffects && effects && (
        <Meta label={effects} onLabelClick={onOpenEffects}>
          <RollLabel
            glyph={false}
            aria-label={effects}
            title={effects}
            data-testid="effect-count"
            onRoll={onOpenEffects}
          >
            {effectCount}
          </RollLabel>
        </Meta>
      )}
      {retainer && (
        <Meta label="Loyalty">
          <span data-testid="loyalty">{retainer.value ?? "—"}</span>
          {retainer.value != null && onRollLoyalty && (
            <RollDieButton label="Loyalty" onRoll={onRollLoyalty} />
          )}
        </Meta>
      )}
      {retainer && (
        <Meta label="Wage">
          <span data-testid="wage">
            <InlineEditValue
              label="Wage"
              value={retainer.wage}
              placeholder="—"
              onCommit={onSetWage}
            />
          </span>
        </Meta>
      )}
    </section>
  );
}
