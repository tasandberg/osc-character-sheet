import type { AbilityVM } from "@domain/vm-types";
import { StatPlaque } from "@ui/StatPlaque";
import type { ActivateEvent } from "@ui/rollable";

type Props = { abilities: AbilityVM[]; onRoll?: (key: string, event: ActivateEvent) => void };

/** Six ability plaques (label · value · mod). Click rolls a roll-under check. */
export function AbilityPlaques({ abilities, onRoll }: Props) {
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
    </section>
  );
}
