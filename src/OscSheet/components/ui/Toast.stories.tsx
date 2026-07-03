import { Toast } from "./Toast";

export default { title: "Overlays / Toast" };

export const Intents = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <Toast intent="success" title="Save passed" message="Your saving throw succeeded." />
    <Toast intent="danger" title="Save failed" message="You take full damage." />
    <Toast intent="warning" title="Low on HP" message="Consider resting." />
    <Toast title="Notice" message="Something happened." />
  </div>
);
