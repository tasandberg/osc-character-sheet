import type { LoyaltyVM } from "@domain/vm-types";
import type { ActivateEvent } from "@ui/rollable";

const BAND =
  "osc-retainer tw:flex tw:items-baseline tw:justify-center tw:gap-3 tw:py-0";

const BAND_LABEL =
  "tw:flex-none tw:font-display tw:text-(length:--fs-xs)" +
  " tw:tracking-[0.1em] tw:text-text";

const BAND_SEP =
  "tw:flex-none tw:font-display tw:text-(length:--fs-2xs) tw:text-text-mute";

const STAT =
  "tw:flex tw:flex-none tw:items-baseline tw:gap-2 tw:whitespace-nowrap";

const WAGE_STAT = "tw:flex tw:min-w-0 tw:items-baseline tw:gap-2";

const STAT_LABEL =
  "tw:flex-none tw:font-display tw:text-(length:--fs-2xs)" +
  " tw:tracking-[0.1em] tw:text-text-dim";

const STAT_VALUE = "tw:font-mono tw:text-(length:--fs-md) tw:text-text";

const WAGE_VALUE = `${STAT_VALUE} tw:min-w-0 tw:break-words`;

const ROLL_VALUE =
  `${STAT_VALUE} tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0` +
  " tw:transition-[color] tw:duration-120 tw:hover:not-disabled:text-gold" +
  " tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2" +
  " tw:focus-visible:outline-gold tw:disabled:cursor-default";

const DIVIDER = "tw:h-3 tw:w-px tw:flex-none tw:self-center tw:bg-border";

type Props = {
  retainer: LoyaltyVM | null;
  onRollLoyalty?: (event: ActivateEvent) => void;
};

export function RetainerRow({ retainer, onRollLoyalty }: Props) {
  if (!retainer) return null;
  const roll =
    retainer.value != null && onRollLoyalty ? onRollLoyalty : undefined;
  return (
    <div className={BAND} data-testid="retainer-row">
      <span className={BAND_LABEL}>Retainer</span>
      <span className={BAND_SEP} aria-hidden="true">
        -
      </span>
      <div className={STAT}>
        <span className={STAT_LABEL}>Loyalty</span>
        <button
          type="button"
          className={ROLL_VALUE}
          disabled={!roll}
          title={
            retainer.value == null
              ? `${retainer.fullLabel} — not set`
              : `Roll ${retainer.fullLabel} check`
          }
          aria-label={roll ? `Roll ${retainer.fullLabel} check` : undefined}
          data-testid="loyalty"
          onClick={roll}
        >
          {retainer.value ?? "—"}
        </button>
      </div>
      <span className={DIVIDER} aria-hidden="true" />
      <div className={WAGE_STAT}>
        <span className={STAT_LABEL}>Wage</span>
        <span className={WAGE_VALUE} data-testid="wage">
          {retainer.wage || "—"}
        </span>
      </div>
    </div>
  );
}
