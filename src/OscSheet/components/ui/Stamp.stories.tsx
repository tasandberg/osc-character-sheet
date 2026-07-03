import { Stamp } from "./Stamp";

export default { title: "Display / Stamp" };

export const Sizes = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    <Stamp size="sm">STR</Stamp>
    <Stamp size="md">HP</Stamp>
    <Stamp size="lg">AC</Stamp>
  </div>
);

// "Add context className" pattern: Stamp owns the ink look; callers attach an
// ad-hoc class (osc-abil-k, osc-mb-stamp, vv-l, …) for placement/spacing in their
// own layout without forking the component.
export const ContextClassName = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    <Stamp className="osc-abil-k">STR</Stamp>
    <Stamp className="osc-mb-stamp">HP</Stamp>
    <Stamp className="vv-l">AC</Stamp>
  </div>
);
