import { useState } from "react";
import { OverrideValue } from "./OverrideValue";

export default { title: "Controls / OverrideValue" };

// The interactive cell starts overridden; clicking the teal reset link returns
// it to the plain "rule default" hint. (Real callers route onResetRequest
// through a ConfirmDialog.)
export const States = () => {
  const [overridden, setOverridden] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Rule default (not overridden)</div>
        <OverrideValue overridden={false} defaultText="14" onResetRequest={() => {}} />
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Overridden (static)</div>
        <OverrideValue overridden defaultText="14" onResetRequest={() => {}} />
      </div>
      <div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Overridden → click to reset</div>
        <OverrideValue
          overridden={overridden}
          defaultText="14"
          onResetRequest={() => setOverridden(false)}
        />
      </div>
    </div>
  );
};
