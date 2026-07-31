import { Tag } from "@ui/Tag";

/** The brass "L{n}" spell-level badge (IM Fell), shared by the Actions-tab spell rows. */
export function SpellLevelBadge({ level }: { level: number }) {
  return (
    // IM Fell + tighter box, not the mono `.tag` default.
    <Tag
      intent="brass"
      className="sp-lvl tw:px-2 tw:pt-[2px] tw:pb-[1px] tw:font-display tw:text-[length:var(--fs-2xs)] tw:tracking-[0.02em]"
    >
      L{level}
    </Tag>
  );
}
