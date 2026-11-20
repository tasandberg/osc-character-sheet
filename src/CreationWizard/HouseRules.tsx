import { useState, type MouseEvent } from "react";
import { Popover } from "@ui/Popover";
import type { Anchor } from "@ui/useFixedAnchor";
import type { HouseRule } from "./houseRuleSettings";

type Props = { worldName: string; rules: HouseRule[] };

export function HouseRules({ worldName, rules }: Props) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const toggle = (event: MouseEvent<HTMLButtonElement>) =>
    setAnchor((open) =>
      open ? null : event.currentTarget.getBoundingClientRect(),
    );
  return (
    <>
      <div
        role="group"
        aria-label="Campaign house rules"
        className="osc-creation-house-rules u-row u-gap-1 u-ml-auto"
      >
        <span className="vm-key">House rules</span>
        {rules.map((rule) => (
          <span key={rule.name} className="vm-tag vm-tag-xs">
            {rule.tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="osc-creation-house-rules-button vm-btn vm-btn-secondary u-ml-auto"
        aria-expanded={anchor !== null}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={toggle}
      >
        House rules · {rules.length}
      </button>
      {anchor && (
        <Popover
          anchor={anchor}
          placement="bottom-end"
          label="House rules"
          inset="u-stack u-gap-3 u-px-4 u-pt-3 u-pb-4"
          className="tw:w-[calc(var(--spacer-10)*8)]"
          onClose={() => setAnchor(null)}
        >
          <div className="vm-sheet-head">
            <h2 className="vm-sheet-head-title">Set by {worldName}</h2>
          </div>
          <p className="vm-help">
            Your referee chose these. They’re already applied; change them in
            the system settings.
          </p>
          <dl className="u-grid tw:grid-cols-[max-content_minmax(0,1fr)] u-gap-x-4 u-gap-y-2 u-items-baseline">
            {rules.map((rule) => (
              <div key={rule.name} className="tw:contents">
                <dt className="vm-key">{rule.name}</dt>
                <dd>{rule.detail}</dd>
              </div>
            ))}
          </dl>
        </Popover>
      )}
    </>
  );
}
