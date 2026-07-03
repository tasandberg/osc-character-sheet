import { StatPlaque } from "./StatPlaque";

export default { title: "Display / StatPlaque" };

// Ability plaques (.rs-abil): stamp label · big value · mod caption. `onActivate`
// makes the cell a keyboard-accessible roll target (hover/focus gold ring).
export const AbilityPlaques = () => (
  <div className="u-grid u-grid-3">
    <StatPlaque className="rs-abil" stampClassName="rs-abil-k" stampKey="STR" value={13} caption="+1" valueClassName="av" captionClassName="am" />
    <StatPlaque className="rs-abil" stampClassName="rs-abil-k" stampKey="DEX" value={9} caption="0" valueClassName="av" captionClassName="am" onActivate={() => {}} title="Roll Dexterity check" />
    <StatPlaque className="rs-abil" stampClassName="rs-abil-k" stampKey="CON" value={16} caption="+2" valueClassName="av" captionClassName="am" onActivate={() => {}} title="Roll Constitution check" />
  </div>
);

// Saves grid (.fvtt-save): single-letter ink stamp · target · label caption.
export const SavesGrid = () => (
  <div className="u-grid u-grid-3">
    <StatPlaque className="fvtt-save" stampClassName="sk" stampKey="D" value={12} caption="Death" valueClassName="sv" captionClassName="sn" onActivate={() => {}} title="Roll Death save (≥ 12)" />
    <StatPlaque className="fvtt-save" stampClassName="sk" stampKey="W" value={13} caption="Wands" valueClassName="sv" captionClassName="sn" onActivate={() => {}} title="Roll Wands save (≥ 13)" />
    <StatPlaque className="fvtt-save" stampClassName="sk" stampKey="P" value={14} caption="Paralysis" valueClassName="sv" captionClassName="sn" onActivate={() => {}} title="Roll Paralysis save (≥ 14)" />
  </div>
);
