import { Field, Input } from "./Field";

export default { title: "Controls / Field" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 320 }}>
    <Field label="Character Name" hint="Shown on the sheet header.">
      <Input placeholder="Aldric the Bold" />
    </Field>
    <Field label="Hit Points" error="Must be a positive number.">
      <Input invalid defaultValue="-3" />
    </Field>
  </div>
);
