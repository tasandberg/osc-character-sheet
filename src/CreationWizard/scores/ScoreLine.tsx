import { ABILITIES, abbreviation, type AbilityScores } from "./scoresDraft";

export function ScoreLine({
  scores,
  label,
}: {
  scores: AbilityScores;
  label: string;
}) {
  return (
    <span className="vm-sheet-head-hint u-row u-gap-3" aria-label={label}>
      {ABILITIES.map((ability) => (
        <span key={ability} className="u-inline-flex u-gap-1 u-items-baseline">
          <span className="vm-key u-text-muted">{abbreviation(ability)}</span>
          <span>{scores[ability]}</span>
        </span>
      ))}
    </span>
  );
}
