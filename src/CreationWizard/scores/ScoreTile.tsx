import type { ReactNode } from "react";
import { formatModifier } from "./scoreFace";
import { ABILITY_NAMES, abbreviation, type Ability } from "./scoresDraft";

export function ScoreFigure({
  value,
  mod,
}: {
  value: ReactNode;
  mod?: number;
}) {
  return (
    <>
      <span className="vm-score-figure">{value}</span>
      {mod !== undefined && (
        <span className="vm-score-mod">{formatModifier(mod)}</span>
      )}
    </>
  );
}

export function DiceRow({ dice }: { dice?: number[] }) {
  if (!dice)
    return (
      <span className="vm-score-dice" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="vm-score-die vm-score-die-pending" />
        ))}
      </span>
    );
  return (
    <span
      className="vm-score-dice"
      role="img"
      aria-label={`Dice ${dice.join(", ")}`}
    >
      {dice.map((die, i) => (
        <span key={i} className="vm-score-die">
          {die}
        </span>
      ))}
    </span>
  );
}

type Props = {
  ability: Ability;
  face: ReactNode;
  dice?: ReactNode;
  footer?: ReactNode;
};

export function ScoreTile({ ability, face, dice, footer }: Props) {
  return (
    <div className="vm-score-stack">
      <div className="vm-score-tile">
        <span
          className="vm-score-stamp vm-score-stamp-strip"
          aria-hidden="true"
        >
          {abbreviation(ability)}
        </span>
        {face}
      </div>
      {dice}
      {footer ?? (
        <span className="vm-score-name">{ABILITY_NAMES[ability]}</span>
      )}
    </div>
  );
}

export function ScoreGrid({ children }: { children: ReactNode }) {
  return <div className="u-grid tw:grid-cols-6 u-gap-3">{children}</div>;
}
