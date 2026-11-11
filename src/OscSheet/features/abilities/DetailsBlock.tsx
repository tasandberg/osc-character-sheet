import type { MouseEvent } from "react";
import { formatMod } from "@domain/format";
import { LeaderRow } from "@ui/LeaderRow";
import { RollLeaderRow } from "@ui/RollLeaderRow";
import { RuleFrame } from "@ui/RuleFrame";

type Props = {
  initMod: number;
  hitDice: string;
  onRollHitDice?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function DetailsBlock({ initMod, hitDice, onRollHitDice }: Props) {
  return (
    <RuleFrame
      as="section"
      aria-label="Details"
      className="osc-section"
      inset="u-px-3 u-py-2"
    >
      <div className="u-grid-2 tw:gap-x-5">
        <LeaderRow label={<span className="vm-key">Initiative</span>}>
          {formatMod(initMod)}
        </LeaderRow>
        <RollLeaderRow
          label="Hit Dice"
          onRoll={hitDice ? onRollHitDice : undefined}
        >
          {hitDice || "—"}
        </RollLeaderRow>
      </div>
    </RuleFrame>
  );
}
