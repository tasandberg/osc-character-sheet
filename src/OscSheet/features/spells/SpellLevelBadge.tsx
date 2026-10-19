import { Tag } from "@ui/Tag";

/** The brass "L{n}" spell-level badge, shared by the Actions-tab spell rows. */
export function SpellLevelBadge({ level }: { level: number }) {
  return (
    <Tag
      intent="brass"
      className="sp-lvl vm-key tw:px-2 tw:pt-[2px] tw:pb-[1px]"
    >
      L{level}
    </Tag>
  );
}
