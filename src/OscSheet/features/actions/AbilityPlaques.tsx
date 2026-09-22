import type { AbilityVM, LoyaltyVM } from "@domain/vm-types";
import { cx } from "@ui/cx";
import { StatPlaque } from "@ui/StatPlaque";
import { rollable, type ActivateEvent } from "@ui/rollable";

type Props = {
  abilities: AbilityVM[];
  onRoll?: (key: string, event: ActivateEvent) => void;
  loyalty?: LoyaltyVM | null;
  onRollLoyalty?: (event: ActivateEvent) => void;
};

/** Six ability plaques (label · value · mod). Click rolls a roll-under check. */
export function AbilityPlaques({
  abilities,
  onRoll,
  loyalty,
  onRollLoyalty,
}: Props) {
  const rollLoyalty =
    loyalty?.value != null && onRollLoyalty ? onRollLoyalty : undefined;
  return (
    <section className="osc-section">
      <div className="osc-abilities">
        {abilities.map((a) => (
          <StatPlaque
            key={a.key}
            variant="ability"
            stampKey={a.label}
            value={a.value}
            caption={a.modLabel}
            onActivate={onRoll && ((e) => onRoll(a.key, e))}
            title={onRoll ? `Roll ${a.label} check` : undefined}
            data-testid={`ability-${a.key}`}
          />
        ))}
      </div>
      {loyalty && (
        <div className="osc-loyalty">
          <span className="lylab">{loyalty.fullLabel}:</span>
          <span
            className={cx("lyval", rollLoyalty && "rollable")}
            title={
              loyalty.value == null
                ? `${loyalty.fullLabel} — not set`
                : `Roll ${loyalty.fullLabel} check`
            }
            aria-label={
              rollLoyalty ? `Roll ${loyalty.fullLabel} check` : undefined
            }
            data-testid="loyalty"
            {...rollable(rollLoyalty)}
          >
            {loyalty.value ?? "—"}
          </span>
        </div>
      )}
    </section>
  );
}
