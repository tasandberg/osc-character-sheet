import { useId } from "react";
import type { AbilityVM } from "@domain/vm-types";
import { HoverPop } from "@ui/HoverPop";
import { Stamp } from "@ui/Stamp";
import { rollable, type ActivateEvent } from "@ui/rollable";

type Props = {
  abilities: AbilityVM[];
  onRoll?: (key: string, event: ActivateEvent) => void;
};

const COLUMN =
  "tw:flex tw:aspect-square tw:@max-md/app:aspect-auto tw:min-w-0 tw:flex-col tw:items-stretch tw:text-center";

const ROLL_BUTTON =
  "osc-stat-button osc-ability-roll vm-bevel vm-btn-muted vm-key tw:block tw:px-px tw:pt-1 tw:pb-[2px] tw:leading-none";

const VALUE =
  "tw:cursor-default tw:font-sans tw:font-medium tw:text-(length:--fs-4xl) tw:leading-none tw:tabular-nums tw:text-text-dim";

const MOD =
  "osc-ability-mod vm-btn tw:font-mono tw:text-(length:--fs-xs) tw:font-medium tw:leading-none tw:text-text-dim";

const POP =
  "tw:grid tw:min-w-[170px] tw:grid-cols-[minmax(max-content,1fr)_max-content] tw:gap-x-3 tw:gap-y-[3px] tw:text-left";

const POP_HEAD =
  "vm-key tw:col-span-full tw:mb-[2px] tw:border-b tw:border-border-soft tw:pb-[3px]";

const POP_KEY = "tw:text-(length:--fs-xs) tw:text-text-dim";

const POP_VALUE =
  "tw:text-right tw:text-(length:--fs-xs) tw:whitespace-nowrap tw:text-text";

function AbilityColumn({
  ability,
  onRoll,
}: {
  ability: AbilityVM;
  onRoll?: (key: string, event: ActivateEvent) => void;
}) {
  const popId = useId();
  const name = game.i18n.localize(ability.nameKey);
  const rollLabel = onRoll ? `Roll ${name} check` : undefined;
  return (
    <div className={COLUMN}>
      {onRoll ? (
        <span
          className={ROLL_BUTTON}
          title={rollLabel}
          aria-label={rollLabel}
          data-testid={`ability-${ability.key}`}
          {...rollable((e) => onRoll(ability.key, e))}
        >
          {ability.label}
        </span>
      ) : (
        <Stamp ink data-testid={`ability-${ability.key}`}>
          {ability.label}
        </Stamp>
      )}
      <div className="osc-ability-score tw:relative tw:grid tw:min-h-0 tw:flex-1 tw:place-items-center tw:@max-md/app:flex tw:@max-md/app:flex-col tw:@max-md/app:items-center tw:@max-md/app:gap-1 tw:@max-md/app:py-2">
        <span className={VALUE}>{ability.value}</span>
        <span className="tw:absolute tw:top-1 tw:right-1 tw:flex tw:@max-md/app:static">
          <button
            type="button"
            className={MOD}
            aria-label={`${name} ${ability.modLabel}`}
            aria-describedby={popId}
          >
            {ability.modLabel.slice(0, 1)}
            <span className="vm-dotted">{ability.modLabel.slice(1)}</span>
          </button>
          <HoverPop id={popId} align="center" className={POP}>
            <span className={POP_HEAD}>
              {name} {ability.value}
            </span>
            {ability.details.map((d) => (
              <span key={d.labelKey} className="tw:contents">
                <span className={POP_KEY}>
                  {game.i18n.localize(d.labelKey)}
                </span>
                <span className={POP_VALUE}>
                  {d.localizeValue ? game.i18n.localize(d.value) : d.value}
                </span>
              </span>
            ))}
          </HoverPop>
        </span>
      </div>
    </div>
  );
}

export function AbilityPlaques({ abilities, onRoll }: Props) {
  return (
    <section className="osc-section">
      <div className="osc-abilities">
        {abilities.map((a) => (
          <AbilityColumn key={a.key} ability={a} onRoll={onRoll} />
        ))}
      </div>
    </section>
  );
}
