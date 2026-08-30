import type { EncumbranceVM, IdentityVM, VitalsVM } from "@domain/vm-types";
import { armorTierLabel, formatMod } from "@domain/format";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";
import { Stamp } from "@ui/Stamp";
import { MoveTooltip } from "@ui/MovePop";
import { useHpInput } from "@ui/useHpInput";

// Tiers are container queries: `app` for the XS compact header, `sheet` for the
// narrow left rail in the two-pane view. The two can never both match — `sheet`
// lives inside `app`, so it cannot be ≥700 while `app` is <480 — so their
// relative order never decides anything. Sizes go through `var(--fs-*)` rather
// than the `tw:text-*` scale: the tokens are `calc(<rem> * var(--fs-scale))` and
// follow the sheet's font-size setting, the Tailwind scale is the raw rem.

// Init / HD / Move tile: borderless in the flex layouts so HP/AC stay the only
// "boxes"; in the rail it gains a real box, because there it is a grid cell.
const TILE =
  "osc-tile tw:flex tw:min-w-[52px] tw:flex-none tw:flex-col tw:items-center tw:gap-1 tw:pt-[2px] tw:text-center" +
  " tw:@max-md/app:w-auto" +
  " tw:@twopane/sheet:w-auto tw:@twopane/sheet:rounded-md tw:@twopane/sheet:border" +
  " tw:@twopane/sheet:border-border-soft tw:@twopane/sheet:bg-surface" +
  " tw:@twopane/sheet:px-[6px] tw:@twopane/sheet:pt-[5px] tw:@twopane/sheet:pb-1";

// Smaller, snugger than the stamp's own `.sm`. The rail trims the sides further
// still — see the clipped-MOVE note on `.osc-twopane .osc-tile .stamp` in
// shell.scss, which stays SCSS: at (0,3,0) it out-ranks these utilities.
const TILE_STAMP =
  "tw:block tw:w-full tw:px-[4px] tw:pt-[3px] tw:pb-[2px] tw:text-center" +
  " tw:text-[length:var(--fs-3xs)] tw:whitespace-nowrap";

const TILE_V =
  "osc-tile-v tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text" +
  " tw:@twopane/sheet:text-[length:var(--fs-xs)]";

// HP/AC card. Carries NO border colour: hp and ac each supply their own, and two
// class-level utilities for one property are ordered by Tailwind rather than by
// the order they are written, so a shared base plus an override could come out
// either way. At XS the card becomes a 52×76 narrow-tall box.
const VITAL =
  "osc-vital tw:relative tw:rounded-md tw:border tw:bg-surface tw:px-[10px] tw:pt-[6px] tw:pb-[8px] tw:text-center" +
  " tw:@max-md/app:flex tw:@max-md/app:min-h-[76px] tw:@max-md/app:flex-col tw:@max-md/app:items-center" +
  " tw:@max-md/app:justify-start tw:@max-md/app:gap-[1px]" +
  " tw:@max-md/app:px-[4px] tw:@max-md/app:pt-[5px] tw:@max-md/app:pb-[6px]";

// The <Stamp> label fills the box width (black bar) like the others.
const VITAL_L =
  "vv-l tw:mb-[2px] tw:block tw:w-full" +
  " tw:@max-md/app:px-[6px] tw:@max-md/app:pt-[4px] tw:@max-md/app:pb-[3px]" +
  " tw:@max-md/app:text-[length:var(--fs-2xs)]";

// The hero numeral. Colour is per-card, as above.
const VITAL_BIG =
  "vv-big tw:my-[1px] tw:font-display tw:text-[length:var(--fs-4xl)] tw:leading-[1.05]" +
  " tw:@max-md/app:text-[length:var(--fs-3xl)]";

const VITAL_SUB =
  "vv-sub tw:font-mono tw:text-[length:var(--fs-2xs)] tw:text-text-mute" +
  " tw:@max-md/app:text-[length:var(--fs-3xs)]";

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
  /** Right-click on the portrait (e.g. Token Variant Art's picker). */
  onPortraitContextMenu?: React.MouseEventHandler<HTMLImageElement>;
  /** When true, left-click opens the image FilePicker (core `editImage` action). */
  canEditPortrait?: boolean;
};

/** Header band. Grid areas (see actions.scss) place: portrait · name+Init/HD/Move
 *  · HP/AC in medium, and stack them in the rail. */
export function HeaderBand({ identity, vitals, encumbrance, onSetHp, onPortraitContextMenu, canEditPortrait }: Props) {
  const m = vitals.moveBands;
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });
  return (
    <div className="osc-head">
      <Portrait
        identity={identity}
        canEdit={canEditPortrait}
        onContextMenu={onPortraitContextMenu}
      />
      <Identity identity={identity} />
      <div className="osc-substats tw:flex tw:gap-2 tw:self-start tw:@max-md/app:grid tw:@max-md/app:grid-cols-3 tw:@twopane/sheet:grid tw:@twopane/sheet:w-full tw:@twopane/sheet:grid-cols-3">
        <div className={TILE}>
          <Stamp className={TILE_STAMP}>INIT</Stamp>
          <div className={TILE_V}>{formatMod(vitals.initMod)}</div>
        </div>
        <div className={TILE}>
          <Stamp className={TILE_STAMP}>HD</Stamp>
          <div className={TILE_V}>{vitals.hd}</div>
        </div>
        <div className={`${TILE} tw:cursor-default`}>
          <Stamp className={TILE_STAMP}>MOVE</Stamp>
          {/* dotted underline hints at the hover breakdown (all three rates + enc) */}
          <div className={`${TILE_V} tw:underline tw:decoration-text-faint tw:decoration-dotted tw:underline-offset-[2px]`}>
            {vitals.move}ft
          </div>
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
      <div className="osc-vitals tw:grid tw:w-[calc(var(--fs-base)*11.5)] tw:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw:gap-2 tw:self-start tw:@max-md/app:w-[112px] tw:@max-md/app:grid-cols-[repeat(2,52px)] tw:@max-md/app:items-stretch tw:@twopane/sheet:w-full">
        <div className={`${VITAL} hp tw:border-[color-mix(in_srgb,var(--crimson)_55%,transparent)]`}>
          <Stamp className={VITAL_L}>HP</Stamp>
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
            <span className={SUB_FULL}>Max {vitals.hp.max}</span>
            <span className={SUB_SHORT}>/{vitals.hp.max}</span>
          </div>
        </div>
        <div className={`${VITAL} ac tw:border-[color-mix(in_srgb,var(--teal)_50%,transparent)]`}>
          <Stamp className={VITAL_L}>AC</Stamp>
          <div className={VV_ROW}>
            <div className={`${VITAL_BIG} tw:text-teal`} data-testid="ac-value">{vitals.ac.value}</div>
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
