import { Tag } from "./Tag";

export default { title: "Display / Tag" };

// TODO(P1, report §2.6/§3): icon + tooltip and removable-chip (onRemove/×)
// variants need new Tag props — not added in this stories-only wave. Once Tag
// gains `icon`/`tooltip`/`onRemove`, add story states here (unifies the app's
// .fvtt-tag icon+tooltip and the LanguagesSection removable chip).

export const Intents = () => (
  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
    <Tag>Neutral</Tag>
    <Tag intent="teal">Teal</Tag>
    <Tag intent="crimson">Crimson</Tag>
    <Tag intent="forest">Forest</Tag>
    <Tag intent="mustard">Mustard</Tag>
    <Tag intent="solid">Solid</Tag>
  </div>
);
