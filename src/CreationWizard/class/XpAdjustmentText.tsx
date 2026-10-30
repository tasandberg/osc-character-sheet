import type { CreationClass, CreationRules } from "../rules";
import type { AbilityScores } from "../scores/scoresDraft";
import { formatXpModifier, xpAdjustment, xpTone } from "./classDraft";

export function XpAdjustmentText({
  cls,
  scores,
  xpBonus,
  withBasis,
}: {
  cls: CreationClass;
  scores: AbilityScores;
  xpBonus: CreationRules["xpBonus"];
  withBasis?: boolean;
}) {
  const xp = xpAdjustment(cls, scores, xpBonus);
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
