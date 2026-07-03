import { Topbar } from "@layout/Topbar";

export default { title: "Chrome / Topbar" };

export const Default = () => (
  <Topbar vm={{ level: 3, nextLevel: 4, xp: { value: 6420, next: 10000 }, pct: 28.4 }} onEdit={() => {}} onLevelUp={() => {}} />
);
