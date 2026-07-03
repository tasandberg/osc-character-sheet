import { Check } from "./Check";

export default { title: "Controls / Check" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Check defaultChecked>Proficient</Check>
    <Check>Has Shield</Check>
  </div>
);
