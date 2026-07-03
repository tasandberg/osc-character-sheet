import { Toggle } from "./Toggle";

export default { title: "Controls / Toggle" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Toggle defaultChecked>Inspiration</Toggle>
    <Toggle>Encumbered</Toggle>
  </div>
);
