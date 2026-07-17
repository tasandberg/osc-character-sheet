import { Tag } from "@ui/Tag";

/** The brass "L{n}" spell-level badge (IM Fell), shared by the Actions-tab spell rows. */
export function SpellLevelBadge({ level }: { level: number }) {
  return (
    <Tag intent="brass" className="sp-lvl">
      L{level}
    </Tag>
  );
}
