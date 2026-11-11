import type { IdentityVM, VitalsVM } from "@domain/vm-types";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";
import { Button } from "@ui/Button";
import { InlineEditValue } from "@ui/InlineEditValue";
import { useId, useLayoutEffect, useRef } from "react";
import { HoverPop } from "@ui/HoverPop";
import { useHpInput } from "@ui/useHpInput";

// Tiers are container queries: `app` for the XS compact header, `sheet` for the
// narrow left rail in the two-pane view. The two can never both match — `sheet`
// lives inside `app`, so it cannot be ≥700 while `app` is below md — so their
// relative order never decides anything. Sizes go through `var(--fs-*)` rather
// than the `tw:text-*` scale: the tokens are `calc(<rem> * var(--fs-scale))` and
// follow the sheet's font-size setting, the Tailwind scale is the raw rem.

// HP/AC column, hairline-divided. At XS it becomes a 52×76 narrow-tall column.
const VITAL =
  "osc-vital tw:relative tw:flex tw:flex-col tw:justify-center tw:gap-1 tw:px-2 tw:py-2 tw:text-center" +
  " tw:@max-md/app:flex tw:@max-md/app:min-h-[76px] tw:@max-md/app:flex-col tw:@max-md/app:items-center" +
  " tw:@max-md/app:justify-start tw:@max-md/app:gap-[1px]" +
  " tw:@max-md/app:px-[4px] tw:@max-md/app:pt-[5px] tw:@max-md/app:pb-[6px]";

const VITAL_BIG =
  "vv-big tw:font-mono tw:font-medium tw:text-(length:--fs-3xl) tw:leading-none tw:tabular-nums" +
  " tw:@max-md/app:text-(length:--fs-2xl)";

const VITAL_SUB =
  "vv-sub tw:flex tw:items-baseline tw:justify-center tw:gap-1 tw:whitespace-nowrap tw:text-(length:--fs-xs) tw:text-text-mute" +
  " tw:@max-md/app:gap-0 tw:@max-md/app:text-(length:--fs-2xs)";

/** Full label by default; the short form takes over at XS, where the card is 52px wide. */
const SUB_FULL = "full tw:@max-md/app:hidden";
const SUB_SHORT = "short tw:hidden tw:@max-md/app:inline";

const POP =
  "tw:grid tw:min-w-[150px] tw:grid-cols-[minmax(max-content,1fr)_max-content] tw:gap-x-3 tw:gap-y-[3px] tw:text-left";
const POP_HEAD =
  "vm-key tw:col-span-full tw:mb-[2px] tw:border-b tw:border-border-soft tw:pb-[3px]";
const POP_KEY = "tw:text-(length:--fs-xs) tw:text-text-dim";
const POP_VALUE =
  "tw:text-right tw:text-(length:--fs-xs) tw:whitespace-nowrap tw:text-text";

const VV_ROW = "vv-row tw:flex tw:items-center tw:justify-center tw:gap-1";

// Reserve width for the digits so the value's digit count never shifts the
// flanking − / + steppers as HP changes; tabular-nums keeps digit widths uniform.
const VV_VALUE = "vv-value tw:min-w-[1.2em] tw:text-center tw:tabular-nums";

function useIdentityHeight() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const head = ref.current;
    const ident = head?.querySelector<HTMLElement>(".osc-ident");
    if (!head || !ident) return;
    const measure = () =>
      head.style.setProperty("--osc-head-height", `${ident.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ident);
    return () => observer.disconnect();
  }, []);
  return ref;
}

type Props = {
  identity: IdentityVM;
  vitals: VitalsVM;
  /** Commit a new current-HP value; when provided, HP renders an editable input. */
  onSetHp?: (value: number) => void;
  baseMaxHp?: number;
  onSetMaxHp?: (value: number) => void;
  onPortraitClick?: React.MouseEventHandler<HTMLImageElement>;
  /** Right-click on the portrait (e.g. Token Variant Art's picker). */
  onPortraitContextMenu?: React.MouseEventHandler<HTMLImageElement>;
  canEditPortrait?: boolean;
};

/** Header band. Grid areas (see actions.scss) place portrait · name · HP/AC in
 *  medium, and stack them in the rail. */
export function HeaderBand({ identity, vitals, onSetHp, baseMaxHp, onSetMaxHp, onPortraitClick, onPortraitContextMenu, canEditPortrait }: Props) {
  const headRef = useIdentityHeight();
  const acPopId = useId();
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });
  return (
    <div className="osc-head" ref={headRef}>
      <Portrait
        identity={identity}
        canEdit={canEditPortrait}
        onClick={onPortraitClick}
        onContextMenu={onPortraitContextMenu}
      />
      <Identity identity={identity} />
      {/* minmax(0,…) so a wide value can't auto-expand a track past its share
          and shove the sibling card out of the container. */}
      <div className="osc-vitals tw:grid tw:w-[calc(var(--fs-base)*10.5)] tw:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] tw:self-stretch tw:@max-md/app:w-[112px] tw:@max-md/app:grid-cols-[repeat(2,52px)] tw:@max-md/app:items-stretch tw:@twopane/sheet:w-full">
        <div className={`${VITAL} hp`}>
          <span className="vm-key">HP</span>
          <div className={VV_ROW}>
            {/* medium+: − / + steppers around the value; XS: an editable input (toggled in CSS) */}
            {onSetHp && (
              <Button variant="link" className="vv-step" aria-label="Lose 1 HP" onClick={hp.dec}>−</Button>
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
              <Button variant="link" className="vv-step" aria-label="Heal 1 HP" onClick={hp.inc}>+</Button>
            )}
          </div>
          <div className={VITAL_SUB}>
            <span className={SUB_FULL}>of</span>
            <span className={SUB_SHORT}>/</span>
            <InlineEditValue
              label="Max HP"
              parse="int"
              value={String(vitals.hp.max)}
              editValue={String(baseMaxHp ?? vitals.hp.max)}
              className="tw:font-mono"
              onCommit={onSetMaxHp}
            />
          </div>
        </div>
        <div className={`${VITAL} ac tw:border-l tw:border-(--hair-soft)`}>
          <span className="vm-key">AC</span>
          <div className={VV_ROW}>
            <span
              tabIndex={vitals.ac.parts ? 0 : undefined}
              aria-describedby={vitals.ac.parts ? acPopId : undefined}
              className="tw:relative tw:cursor-default"
            >
              <span className={`${VITAL_BIG} tw:text-teal-accent`} data-testid="ac-value">{vitals.ac.value}</span>
              {vitals.ac.parts && (
                <HoverPop id={acPopId} align="center" className={POP}>
                  <span className={POP_HEAD}>AC {vitals.ac.value}</span>
                  {vitals.ac.parts.map((part) => (
                    <span key={part.label} className="tw:contents">
                      <span className={POP_KEY}>{part.label}</span>
                      <span className={POP_VALUE}>{part.value}</span>
                    </span>
                  ))}
                </HoverPop>
              )}
            </span>
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
