import type { MouseEvent, ReactNode } from "react";
import { LeaderRow } from "./LeaderRow";
import { RollDieButton } from "./RollDieButton";

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
      {onRoll && <RollDieButton label={label} onRoll={onRoll} />}
    </LeaderRow>
  );
}
