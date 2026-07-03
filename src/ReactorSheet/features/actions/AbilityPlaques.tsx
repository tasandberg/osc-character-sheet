import type { AbilityVM } from "@domain/vm-types";
import { StatPlaque } from "@ui/StatPlaque";

type Props = { abilities: AbilityVM[]; onRoll?: (key: string) => void };

/** Six ability plaques (label · value · mod). Click rolls a roll-under check. */
export function AbilityPlaques({ abilities, onRoll }: Props) {
  return (
    <section className="rs-section">
      <div className="rs-abilities">
        {abilities.map((a) => (
          <StatPlaque
            key={a.key}
            className="rs-abil"
            stampClassName="rs-abil-k"
            stampKey={a.label}
            value={a.value}
            caption={a.modLabel}
            valueClassName="av"
            captionClassName="am"
            onActivate={onRoll && (() => onRoll(a.key))}
            title={onRoll ? `Roll ${a.label} check` : undefined}
            data-testid={`ability-${a.key}`}
          />
        ))}
      </div>
    </section>
  );
}
