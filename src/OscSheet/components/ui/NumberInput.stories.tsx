import { useState } from "react";
import { NumberInput } from "./NumberInput";

export default { title: "Controls / NumberInput" };

// NumberInput is controlled (value + onCommit), so stories drive it with local state.
function Demo({ initial, min, max, disabled }: { initial: number; min?: number; max?: number; disabled?: boolean }) {
  const [v, setV] = useState(initial);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
      <NumberInput className="ed-input" value={v} min={min} max={max} disabled={disabled} onCommit={setV} />
      <span style={{ opacity: 0.6 }}>committed: {v}</span>
    </label>
  );
}

export const States = () => (
  <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
    <div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>Default</div>
      <Demo initial={10} />
    </div>
    <div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>Clamped 1–20</div>
      <Demo initial={12} min={1} max={20} />
    </div>
    <div>
      <div style={{ fontSize: 11, opacity: 0.7 }}>Disabled</div>
      <Demo initial={7} disabled />
    </div>
  </div>
);
