import type { AbilityVM, LoyaltyVM } from "@domain/vm-types";
import { StatPlaque } from "@ui/StatPlaque";
import type { ActivateEvent } from "@ui/rollable";

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
  return (
    <section className="osc-section">
      <div className={`osc-abilities${loyalty ? " has-loyalty" : ""}`}>
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
        {loyalty && (
          <StatPlaque
            variant="ability"
            stampKey={loyalty.label}
            value={loyalty.value ?? "—"}
            caption="2d6 ≤"
            onActivate={
              loyalty.value != null && onRollLoyalty
                ? (e) => onRollLoyalty(e)
                : undefined
            }
            title={
              loyalty.value == null
                ? `${loyalty.fullLabel} — not set`
                : `Roll ${loyalty.fullLabel} check`
            }
            data-testid="loyalty"
          />
        )}
      </div>
    </section>
  );
}
