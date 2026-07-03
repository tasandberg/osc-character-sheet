import { Select } from "./Select";

export default { title: "Controls / Select" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 320 }}>
    <Select defaultValue="fighter">
      <option value="fighter">Fighter</option>
      <option value="magic-user">Magic-User</option>
      <option value="cleric">Cleric</option>
      <option value="thief">Thief</option>
    </Select>
    <Select invalid defaultValue="">
      <option value="">Select a class…</option>
      <option value="fighter">Fighter</option>
      <option value="magic-user">Magic-User</option>
    </Select>
  </div>
);
