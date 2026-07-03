import { useState } from "react";
import { StampCell } from "./StampCell";

export default { title: "Display / StampCell" };

// StampCell is the editable ink-stamp cell (NumberInput + caption). Stories hold
// the value in local state so the input commits round-trip.
function Cell(props: {
  stampKey: string;
  fullName?: string;
  initial: number;
  caption: string;
  overridden?: boolean;
  warn?: boolean;
  warnTitle?: string;
  withReset?: boolean;
}) {
  const [v, setV] = useState(props.initial);
  const [overridden, setOverridden] = useState(!!props.overridden);
  return (
    <StampCell
      stampKey={props.stampKey}
      fullName={props.fullName}
      value={v}
      min={3}
      max={18}
      caption={props.caption}
      overridden={overridden}
      warn={props.warn}
      warnTitle={props.warnTitle}
      onChange={setV}
      onResetRequest={props.withReset ? () => setOverridden(false) : undefined}
    />
  );
}

export const States = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
    <Cell stampKey="STR" fullName="Strength" initial={13} caption="+1" />
    <Cell stampKey="DEX" fullName="Dexterity" initial={16} caption="+2" overridden withReset />
    <Cell stampKey="CON" fullName="Constitution" initial={6} caption="−1" warn warnTitle="Below class requirement" />
  </div>
);
