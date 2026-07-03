import { Tag } from "./Tag";

export default { title: "Display / Tag" };

// Pill intents (the default variant).
export const Intents = () => (
  <div className="u-row u-gap-3 u-wrap">
    <Tag>Neutral</Tag>
    <Tag intent="teal">Teal</Tag>
    <Tag intent="crimson">Crimson</Tag>
    <Tag intent="forest">Forest</Tag>
    <Tag intent="mustard">Mustard</Tag>
    <Tag intent="solid">Solid</Tag>
  </div>
);

// Removable pill — the × wires `onRemove` (LanguagesSection edit mode).
export const Removable = () => (
  <div className="u-row u-gap-3 u-wrap">
    <Tag onRemove={() => {}} removeLabel="Remove Common">Common</Tag>
    <Tag onRemove={() => {}} removeLabel="Remove Elvish">Elvish</Tag>
  </div>
);

// Chip variant — the square, dark weapon-tag box. Icon-only chips carry a hover
// tooltip; melee = gold accent, missile = teal. Icon-less chips show `.tag-txt`.
export const Chips = () => (
  <div className="u-row u-gap-2 u-wrap">
    <Tag variant="chip" className="melee" icon="fa-sword" tooltip="Melee" title="Melee" />
    <Tag variant="chip" className="missile" icon="fa-bow-arrow" tooltip="Missile" title="Missile" />
    <Tag variant="chip" icon="fa-hand-fist" tooltip="Blunt" title="Blunt" />
    <Tag variant="chip" title="Two-handed">
      <span className="tag-txt">2H</span>
    </Tag>
  </div>
);
