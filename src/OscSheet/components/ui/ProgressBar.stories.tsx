import { ProgressBar } from "./ProgressBar";

export default { title: "Display / ProgressBar" };

export const Bars = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <ProgressBar value={8} max={9} color="var(--crimson)" />
    <ProgressBar value={6420} max={10000} />
    <ProgressBar value={10} max={10} />
    <ProgressBar value={0} max={10} />
  </div>
);
