import type { CreationClass } from "../rules";
import { formatXpModifier, xpAdjustment, xpTone } from "../rules/xpAdjustment";
import type { AbilityScores } from "../scores/scoresDraft";

export function XpAdjustmentText({
  cls,
  scores,
  withBasis,
}: {
  cls: CreationClass;
  scores: AbilityScores;
  withBasis?: boolean;
}) {
  const xp = xpAdjustment(cls, scores);
  if (!xp) return <>—</>;
  return (
    <span
      className={
        withBasis ? "u-text-dim" : `osc-creation-xp-${xpTone(xp.modifier)}`
      }
    >
      {formatXpModifier(xp.modifier)}
      {withBasis ? ` from ${xp.basis}` : " XP"}
    </span>
  );
}
