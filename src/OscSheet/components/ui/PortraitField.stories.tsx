import { PortraitField } from "./PortraitField";

export default { title: "Layout / PortraitField" };

// Clicking opens Foundry's FilePicker in-app; outside Foundry the picker no-ops,
// so these stories just show the filled vs. empty (placeholder) states.
const sample =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='#2b2620'/><circle cx='60' cy='48' r='24' fill='#8a7a52'/><rect x='30' y='78' width='60' height='34' rx='12' fill='#8a7a52'/></svg>`,
  );

export const States = () => (
  <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
    <div style={{ width: 120 }}>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>With portrait</div>
      <PortraitField src={sample} onPick={() => {}} />
    </div>
    <div style={{ width: 120 }}>
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Empty (placeholder)</div>
      <PortraitField onPick={() => {}} />
    </div>
  </div>
);
