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
// ad-hoc class (rs-abil-k, rs-mb-stamp, vv-l, …) for placement/spacing in their
// own layout without forking the component.
export const ContextClassName = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    <Stamp className="rs-abil-k">STR</Stamp>
    <Stamp className="rs-mb-stamp">HP</Stamp>
    <Stamp className="vv-l">AC</Stamp>
  </div>
);
