import type { IdentityVM, VitalsVM } from "@domain/vm-types";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";
import { Button } from "@ui/Button";
import { InlineEditValue } from "@ui/InlineEditValue";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { HoverPop } from "@ui/HoverPop";
import { useHpInput } from "@ui/useHpInput";

// Tiers are container queries: `app` for the XS compact header, `sheet` for the
// narrow left rail in the two-pane view. The two can never both match — `sheet`
// lives inside `app`, so it cannot be ≥700 while `app` is below md — so their
// relative order never decides anything. Sizes go through `var(--fs-*)` rather
// than the `tw:text-*` scale: the tokens are `calc(<rem> * var(--fs-scale))` and
// follow the sheet's font-size setting, the Tailwind scale is the raw rem.

// HP/AC column. At XS it becomes a 52×76 narrow-tall column.
const VITAL =
  "osc-vital tw:relative tw:flex tw:flex-col tw:justify-start tw:gap-1 tw:text-center" +
  " tw:@max-md/app:min-h-[76px] tw:@max-md/app:items-center tw:@max-md/app:gap-[1px]" +
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

function useHeaderHeight(hasStats: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const head = ref.current;
    const ident = head?.querySelector<HTMLElement>(".osc-ident");
    const vitals = head?.querySelector<HTMLElement>(".osc-vitals");
    if (!head || !ident || !vitals) return;
    const stats = head.querySelector<HTMLElement>(".osc-head-stats");
    const measure = () => {
      const top = ident.getBoundingClientRect().top;
      const rowBottom = Math.max(
        ident.getBoundingClientRect().bottom,
        vitals.getBoundingClientRect().bottom,
      );
      const bottom = stats?.getBoundingClientRect().bottom ?? rowBottom;
      head.style.setProperty("--osc-ident-height", `${rowBottom - top}px`);
      head.style.setProperty("--osc-head-height", `${bottom - top}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of [ident, vitals, stats]) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasStats]);
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
  stats?: ReactNode;
};

/** Header band. Grid areas (see actions.scss) place portrait · name · HP/AC in
 *  medium, and stack them in the rail. */
export function HeaderBand({ identity, vitals, onSetHp, baseMaxHp, onSetMaxHp, onPortraitClick, onPortraitContextMenu, canEditPortrait, stats }: Props) {
  const headRef = useHeaderHeight(!!stats);
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
      <div className="osc-vitals tw:grid tw:grid-cols-[auto_auto] tw:gap-x-4 tw:self-start tw:@max-md/app:w-[112px] tw:@max-md/app:grid-cols-[repeat(2,52px)] tw:@max-md/app:gap-x-0 tw:@max-md/app:items-stretch tw:@twopane/sheet:w-full tw:@twopane/sheet:grid-cols-2">
        <div className={`${VITAL} hp`}>
          <span className="vm-key">HP</span>
          <div className={VV_ROW}>
            {onSetHp && (
              <Button variant="link" className="vv-step" aria-label="Lose 1 HP" onClick={hp.dec}>−</Button>
            )}
            <InlineEditValue
              label="Current HP"
              parse="int"
              value={String(vitals.hp.value)}
              className={`${VITAL_BIG} ${VV_VALUE} tw:text-crimson`}
              onCommit={onSetHp}
            />
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
        <div className={`${VITAL} ac`}>
          <span className="vm-key">AC</span>
          <div className={VV_ROW}>
            <span
              tabIndex={vitals.ac.parts ? 0 : undefined}
              aria-describedby={vitals.ac.parts ? acPopId : undefined}
              className="tw:relative tw:block tw:cursor-default"
            >
              <span className={`${VITAL_BIG} tw:block tw:text-teal-accent`} data-testid="ac-value">{vitals.ac.value}</span>
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
            <span>{vitals.ac.ascending ? "asc" : "desc"}</span>
          </div>
        </div>
      </div>
      {stats && <div className="osc-head-stats tw:@container/stats">{stats}</div>}
    </div>
  );
}
