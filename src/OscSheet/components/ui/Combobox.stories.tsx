import { useState } from "react";
import { Combobox, type ComboOption, type ComboboxProps } from "./Combobox";

export default { title: "Controls / Combobox" };

const CLASSES: ComboOption[] = [
  { value: "assassin", label: "Assassin" },
  { value: "bard", label: "Bard" },
  { value: "cleric", label: "Cleric" },
  { value: "druid", label: "Druid" },
  { value: "fighter", label: "Fighter" },
  { value: "magic-user", label: "Magic User" },
  { value: "paladin", label: "Paladin" },
  { value: "ranger", label: "Ranger" },
  { value: "thief", label: "Thief" },
];

// Combobox is controlled (value + onCommit), so stories drive it with local state.
function Demo({ initial = "", options = CLASSES, ...rest }: Partial<ComboboxProps> & { initial?: string }) {
  const [v, setV] = useState(initial);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280, minHeight: 300 }}>
      <Combobox {...rest} value={v} options={options} onCommit={setV} placeholder={rest.placeholder ?? "Class…"} />
      <span style={{ fontSize: 11, opacity: 0.6 }}>committed: {v || "—"}</span>
    </div>
  );
}

export const Default = () => <Demo />;
export const Preselected = () => <Demo initial="fighter" />;
export const CustomValue = () => <Demo initial="Warlock" />;
export const EmptyOptions = () => <Demo options={[]} placeholder="Type to add a class…" />;
export const Disabled = () => <Demo initial="cleric" disabled />;
export const NoCreate = () => <Demo allowCreate={false} />;

// The class-field configuration: leading hint before typing + "Custom: <x>" create row.
export const CustomCreateLabel = () => (
  <Demo newOptionLabel={(q) => `Custom: ${q}`} createHint="Type to add a custom class" />
);

// Per-option JSX via `node` (label still drives filtering + input text).
export const RichOptions = () => (
  <Demo
    options={CLASSES.map((o) => ({
      ...o,
      node: (
        <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          {o.label}
          <em style={{ opacity: 0.5 }}>class</em>
        </span>
      ),
    }))}
  />
);
