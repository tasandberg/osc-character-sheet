import { Radio } from "./Radio";

export default { title: "Controls / Radio" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <Radio name="alignment" defaultChecked>
      Lawful
    </Radio>
    <Radio name="alignment">Chaotic</Radio>
  </div>
);
