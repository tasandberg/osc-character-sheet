import { Die } from "./Die";

export default { title: "Display / Die" };

export const Dice = () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
    <Die sides={4} value={3} />
    <Die sides={6} value={5} />
    <Die sides={8} value={6} />
    <Die sides={20} value={14} />
    <Die sides={20} value={20} verdict="crit" />
    <Die sides={20} value={1} verdict="fumble" />
  </div>
);
