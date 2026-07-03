import { StatPlaque } from "./StatPlaque";

export default { title: "Display / StatPlaque" };

// Ability plaques (variant="ability"): stamp label · big value · mod caption.
// `onActivate` makes the cell a keyboard-accessible roll target (hover/focus ring).
export const AbilityPlaques = () => (
  <div className="u-grid u-grid-3">
    <StatPlaque variant="ability" stampKey="STR" value={13} caption="+1" />
    <StatPlaque variant="ability" stampKey="DEX" value={9} caption="0" onActivate={() => {}} title="Roll Dexterity check" />
    <StatPlaque variant="ability" stampKey="CON" value={16} caption="+2" onActivate={() => {}} title="Roll Constitution check" />
  </div>
);

// Saves grid (variant="save"): single-letter ink stamp · target · label caption.
export const SavesGrid = () => (
  <div className="u-grid u-grid-3">
    <StatPlaque variant="save" stampKey="D" value={12} caption="Death" onActivate={() => {}} title="Roll Death save (≥ 12)" />
    <StatPlaque variant="save" stampKey="W" value={13} caption="Wands" onActivate={() => {}} title="Roll Wands save (≥ 13)" />
    <StatPlaque variant="save" stampKey="P" value={14} caption="Paralysis" onActivate={() => {}} title="Roll Paralysis save (≥ 14)" />
  </div>
);
