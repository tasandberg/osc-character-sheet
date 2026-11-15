import { useId } from "react";
import type { AbilityVM } from "@domain/vm-types";
import { HoverPop } from "@ui/HoverPop";
import { Button } from "@ui/Button";
import { contributionAmount } from "@features/scores/scoreBreakdown";
import type { ActivateEvent } from "@ui/rollable";

type Props = {
  abilities: AbilityVM[];
  onRoll?: (key: string, event: ActivateEvent) => void;
  onOpen?: (key: string) => void;
};

const CELL =
  "tw:flex tw:h-full tw:flex-col tw:items-center tw:justify-between tw:gap-1 tw:px-1 tw:py-2 tw:text-center";

const VALUE_TEXT =
  "tw:font-mono tw:font-medium tw:text-(length:--fs-2xl) tw:leading-none tw:tabular-nums tw:text-text";

const VALUE = `${VALUE_TEXT} tw:cursor-default`;

const LINK_HOVER =
  "tw:transition-[color] tw:duration-[120ms] tw:hover:text-[var(--osc-link-hover,var(--gold))]";

const VALUE_BUTTON = `${VALUE_TEXT} ${LINK_HOVER} tw:cursor-pointer tw:p-0 tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold`;

const MOD = `osc-ability-mod vm-btn ${LINK_HOVER} tw:font-mono tw:text-(length:--fs-xs) tw:font-medium tw:leading-none tw:text-text-dim tw:focus-visible:text-[var(--osc-link-hover,var(--gold))]`;

const POP =
  "tw:grid tw:min-w-[170px] tw:grid-cols-[minmax(max-content,1fr)_max-content] tw:gap-x-3 tw:gap-y-[3px] tw:text-left";

const POP_RULE =
  "tw:col-span-full tw:my-[2px] tw:border-t tw:border-border-soft";

const POP_HEAD =
  "vm-key tw:col-span-full tw:mb-[2px] tw:border-b tw:border-border-soft tw:pb-[3px]";

const POP_KEY = "tw:text-(length:--fs-xs) tw:text-text-dim";

const POP_VALUE =
  "tw:text-right tw:text-(length:--fs-xs) tw:whitespace-nowrap tw:text-text";

function AbilityCell({
  ability,
  onRoll,
  onOpen,
}: {
  ability: AbilityVM;
  onRoll?: (key: string, event: ActivateEvent) => void;
  onOpen?: (key: string) => void;
}) {
  const popId = useId();
  const derivation = ability.breakdown?.contributions ?? [];
  const name = game.i18n.localize(ability.nameKey);
  const rollLabel = `Roll ${name} check`;
  return (
    <div className={`osc-ability tw:min-w-0 ${CELL}`}>
      {onRoll ? (
        <Button
          variant="stamp"
          size="xs"
          title={rollLabel}
          aria-label={rollLabel}
          data-testid={`ability-${ability.key}`}
          onClick={(event) => onRoll(ability.key, event)}
        >
          {ability.label}
        </Button>
      ) : (
        <span className="vm-key" data-testid={`ability-${ability.key}`}>
          {ability.label}
        </span>
      )}
      {onOpen ? (
        <button
          type="button"
          className={VALUE_BUTTON}
          aria-label={`${name} breakdown`}
          onClick={() => onOpen(ability.key)}
        >
          {ability.value}
        </button>
      ) : (
        <span className={VALUE}>{ability.value}</span>
      )}
      <span className="tw:flex">
        <button
          type="button"
          className={MOD}
          aria-label={`${name} ${ability.modLabel}`}
          aria-describedby={popId}
        >
          {ability.modLabel}
        </button>
        <HoverPop
          id={popId}
          align="center"
          anchorSelector=".osc-ability"
          className={POP}
        >
          <span className={POP_HEAD}>
            {name} {ability.value}
          </span>
          {derivation.length > 0 && (
            <>
              <span className={POP_KEY}>
                {game.i18n.localize("OSC.scores.Base")}
              </span>
              <span className={POP_VALUE}>{ability.breakdown?.base}</span>
              {derivation.map((c) => (
                <span key={c.id} className="tw:contents">
                  <span className={POP_KEY}>{c.name}</span>
                  <span className={POP_VALUE}>{contributionAmount(c)}</span>
                </span>
              ))}
              <span className={POP_RULE} aria-hidden="true" />
            </>
          )}
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
  );
}

export function AbilityPlaques({ abilities, onRoll, onOpen }: Props) {
  return (
    <section aria-label="Ability scores" className="osc-section">
      <div className="osc-abilities">
        {abilities.map((a) => (
          <AbilityCell
            key={a.key}
            ability={a}
            onRoll={onRoll}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}
