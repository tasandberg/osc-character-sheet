import { useRef } from "react";
import type { EncumbranceVM, IdentityVM, VitalsVM } from "@domain/vm-types";
import { armorTierLabel, formatMod } from "@domain/format";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";
import { Stamp } from "@ui/Stamp";
import { rollable, type ActivateEvent } from "@ui/rollable";
import { MoveTooltip } from "@ui/MovePop";
import { useHpInput } from "@ui/useHpInput";
import { useWrapStarts } from "@ui/useWrapStarts";

// Tiers are container queries: `app` for the XS compact header, `sheet` for the
// narrow left rail in the two-pane view. The two can never both match — `sheet`
// lives inside `app`, so it cannot be ≥700 while `app` is <480 — so their
// relative order never decides anything. Sizes go through `var(--fs-*)` rather
// than the `tw:text-*` scale: the tokens are `calc(<rem> * var(--fs-scale))` and
// follow the sheet's font-size setting, the Tailwind scale is the raw rem.

// Init / HD / Move: key + value inline, hairline-divided.
const TILE =
  "osc-tile tw:relative tw:inline-flex tw:flex-none tw:items-center tw:gap-2 tw:whitespace-nowrap" +
  " tw:@twopane/sheet:flex-col tw:@twopane/sheet:items-center tw:@twopane/sheet:gap-0";

const TILE_V =
  "osc-tile-v tw:text-(length:--fs-md) tw:tabular-nums tw:text-text-dim";

// HP/AC column, hairline-divided. At XS it becomes a 52×76 narrow-tall column.
const VITAL =
  "osc-vital tw:relative tw:px-[6px] tw:pt-[2px] tw:pb-[2px] tw:text-center" +
  " tw:@max-md/app:flex tw:@max-md/app:min-h-[76px] tw:@max-md/app:flex-col tw:@max-md/app:items-center" +
  " tw:@max-md/app:justify-start tw:@max-md/app:gap-[1px]" +
  " tw:@max-md/app:px-[4px] tw:@max-md/app:pt-[5px] tw:@max-md/app:pb-[6px]";

const VITAL_L = "vv-l tw:flex";

// The hero numeral. Colour is per-card, as above.
const VITAL_BIG =
  "vv-big tw:-mt-1 tw:font-display tw:text-(length:--fs-4xl) tw:leading-none" +
  " tw:@max-md/app:text-(length:--fs-3xl)";

const VITAL_SUB =
  "vv-sub tw:mt-1 tw:text-(length:--fs-xs) tw:text-text-dim tw:@max-md/app:text-(length:--fs-2xs)";

/** Full label by default; the short form takes over at XS, where the card is 52px wide. */
const SUB_FULL = "full tw:@max-md/app:hidden";
const SUB_SHORT = "short tw:hidden tw:@max-md/app:inline";

const VV_ROW = "vv-row tw:flex tw:items-center tw:justify-center tw:gap-2";

// Reserve width for the digits so the value's digit count never shifts the
// flanking − / + steppers as HP changes; tabular-nums keeps digit widths uniform.
const VV_VALUE = "vv-value tw:min-w-[1.2em] tw:text-center tw:tabular-nums";

type Props = {
  identity: IdentityVM;
  vitals: VitalsVM;
  /** Drives the encumbrance line in the MOVE hover — why the rates are what they are. */
  encumbrance?: EncumbranceVM;
  /** Commit a new current-HP value; when provided, HP renders an editable input. */
  onSetHp?: (value: number) => void;
  onPortraitClick?: React.MouseEventHandler<HTMLImageElement>;
  /** Right-click on the portrait (e.g. Token Variant Art's picker). */
  onPortraitContextMenu?: React.MouseEventHandler<HTMLImageElement>;
  canEditPortrait?: boolean;
  onRollHd?: (event: ActivateEvent) => void;
};

/** Header band. Grid areas (see actions.scss) place: portrait · name+Init/HD/Move
 *  · HP/AC in medium, and stack them in the rail. */
export function HeaderBand({ identity, vitals, encumbrance, onSetHp, onPortraitClick, onPortraitContextMenu, canEditPortrait, onRollHd }: Props) {
  const m = vitals.moveBands;
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });
  const rollHd = vitals.hd ? onRollHd : undefined;
  const hdLabel = rollHd ? game.i18n.localize("OSE.roll.hd") : undefined;
  const substatsRef = useRef<HTMLDivElement>(null);
  useWrapStarts(substatsRef);
  return (
    <div className="osc-head">
      <Portrait
        identity={identity}
        canEdit={canEditPortrait}
        onClick={onPortraitClick}
        onContextMenu={onPortraitContextMenu}
      />
      <Identity identity={identity} />
      <div ref={substatsRef} className="osc-substats tw:flex tw:items-center tw:self-start tw:@max-md/app:justify-center tw:@twopane/sheet:justify-center">
        <div className={TILE}>
          <Stamp ink>INIT</Stamp>
          <span className={TILE_V}>{formatMod(vitals.initMod)}</span>
        </div>
        <div className={TILE}>
          <Stamp
            ink
            className={rollHd ? "rollable" : undefined}
            title={hdLabel}
            aria-label={hdLabel}
            {...rollable(rollHd)}
          >
            HD
          </Stamp>
          <span className={TILE_V}>{vitals.hd}</span>
          {rollHd && (
            <span className="osc-roll-die" title={hdLabel} aria-hidden="true" onClick={rollHd}>
              <i className="fa-solid fa-dice-d20 roll-label-die" />
            </span>
          )}
        </div>
        <div className={`${TILE} tw:cursor-default`}>
          <Stamp ink>MOVE</Stamp>
          {/* dotted underline hints at the hover breakdown (all three rates + enc) */}
          <span className={`${TILE_V} tw:underline tw:decoration-(--text-dim) tw:decoration-dotted tw:underline-offset-[2px]`}>
            {vitals.move}ft
          </span>
          <MoveTooltip
            bands={m}
            tier={encumbrance?.enabled ? encumbrance.tier : undefined}
            status={encumbrance?.enabled ? encumbrance.status : undefined}
            armor={
              encumbrance?.enabled && encumbrance.armorTier
                ? armorTierLabel(encumbrance.armorTier)
                : undefined
            }
          />
        </div>
      </div>
      {/* minmax(0,…) so a wide value can't auto-expand a track past its share
          and shove the sibling card out of the container. */}
      <div className="osc-vitals tw:grid tw:w-[calc(var(--fs-base)*10.5)] tw:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw:self-start tw:@max-md/app:w-[112px] tw:@max-md/app:grid-cols-[repeat(2,52px)] tw:@max-md/app:items-stretch tw:@twopane/sheet:w-full">
        <div className={`${VITAL} hp`}>
          <Stamp ink className={VITAL_L}>HP</Stamp>
          <div className={VV_ROW}>
            {/* medium+: − / + steppers around the value; XS: an editable input (toggled in CSS) */}
            {onSetHp && (
              <button type="button" className="vv-step" aria-label="Lose 1 HP" onClick={hp.dec}>−</button>
            )}
            <div className={`${VITAL_BIG} ${VV_VALUE} tw:text-crimson`}>{vitals.hp.value}</div>
            {onSetHp && (
              <input
                className={`${VITAL_BIG} vv-input tw:text-crimson`}
                aria-label="Current HP"
                key={hp.key}
                {...hp.inputProps}
              />
            )}
            {onSetHp && (
              <button type="button" className="vv-step" aria-label="Heal 1 HP" onClick={hp.inc}>+</button>
            )}
          </div>
          <div className={VITAL_SUB}>
            <span className={SUB_FULL}>of {vitals.hp.max}</span>
            <span className={SUB_SHORT}>/{vitals.hp.max}</span>
          </div>
        </div>
        <div className={`${VITAL} ac tw:border-l tw:border-(--hair-soft)`}>
          <Stamp ink className={VITAL_L}>AC</Stamp>
          <div className={VV_ROW}>
            <div className={`${VITAL_BIG} tw:text-teal-accent`} data-testid="ac-value">{vitals.ac.value}</div>
          </div>
          <div className={VITAL_SUB}>
            <span className={SUB_FULL}>{vitals.ac.ascending ? "Ascending" : "Descending"}</span>
            <span className={SUB_SHORT}>{vitals.ac.ascending ? "asc" : "desc"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
