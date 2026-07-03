import { Skeleton } from "./Skeleton";

export default { title: "Overlays / Skeleton" };

export const Bars = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <Skeleton width="60%" height={20} />
    <Skeleton width="90%" height={14} />
    <Skeleton width="75%" height={14} />
    <Skeleton width="40%" height={12} />
  </div>
);
