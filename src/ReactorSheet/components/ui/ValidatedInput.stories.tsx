import { useState } from "react";
import { ValidatedInput } from "./ValidatedInput";

export default { title: "Controls / ValidatedInput" };

// Validates on blur / Enter. Try clearing the required field or typing digits
// into the letters-only field, then blur to see the error state.
function Demo({
  initial,
  validate,
  hint,
  placeholder,
}: {
  initial: string;
  validate: (v: string) => string | null;
  hint?: string;
  placeholder?: string;
}) {
  const [v, setV] = useState(initial);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 260 }}>
      <ValidatedInput
        className="ed-input"
        value={v}
        validate={validate}
        onCommit={setV}
        hint={hint ? <span className="hint">{hint}</span> : undefined}
        placeholder={placeholder}
      />
    </label>
  );
}

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
    <Demo
      initial="Aldric"
      validate={(v) => (v.length === 0 ? "Name is required." : null)}
      hint="Blur an empty field to see the error."
      placeholder="Character name"
    />
    <Demo
      initial="Fighter"
      validate={(v) => (/^[a-z]+$/i.test(v) ? null : "Letters only.")}
      hint="Letters only — digits are rejected."
    />
  </div>
);
