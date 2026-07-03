import { Textarea } from "./Textarea";

export default { title: "Controls / Textarea" };

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 360 }}>
    <Textarea placeholder="Backstory…" defaultValue="Born under a waning moon…" />
    <Textarea invalid defaultValue="Too short" />
  </div>
);
