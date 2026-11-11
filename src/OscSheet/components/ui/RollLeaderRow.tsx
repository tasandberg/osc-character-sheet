import type { MouseEvent, ReactNode } from "react";
import { LeaderRow } from "./LeaderRow";

export function RollLeaderRow({
  label,
  prefix,
  onRoll,
  children,
}: {
  label: string;
  prefix?: ReactNode;
  onRoll?: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  return (
    <LeaderRow
      label={
        <>
          {prefix}
          <span className="vm-key">{label}</span>
        </>
      }
    >
      {children}
      {onRoll && (
        <button
          type="button"
          className="osc-roll-die"
          aria-label={`Roll ${label}`}
          title={`Roll ${label}`}
          onClick={onRoll}
        >
          <i
            className="fa-solid fa-dice-d20 roll-label-die"
            aria-hidden="true"
          />
        </button>
      )}
    </LeaderRow>
  );
}
