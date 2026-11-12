import type { MouseEvent } from "react";

export function RollDieButton({
  label,
  onRoll,
}: {
  label: string;
  onRoll: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="osc-roll-die"
      aria-label={`Roll ${label}`}
      title={`Roll ${label}`}
      onClick={onRoll}
    >
      <i className="fa-solid fa-dice-d20 roll-label-die" aria-hidden="true" />
    </button>
  );
}
