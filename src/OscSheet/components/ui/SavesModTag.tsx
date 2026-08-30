import type { AbilityVM } from "@src/OscSheet/domain/vm-types";
import { Tag } from "./Tag";

export default function SavesModTag({
  wisdomAbility,
}: {
  wisdomAbility?: AbilityVM;
}) {
  if (!wisdomAbility || wisdomAbility.mod === 0) return;

  return (
    <Tag
      intent="teal"
      tooltip={`Wisdom ${wisdomAbility.value}`}
      className="tw:mb-4 tw:grow-0"
    >
      <span className="u-foundry-xs-display-none u-foundry-md-display-block">
        {wisdomAbility.modLabel} vs Magic
      </span>
      <span className="u-foundry-md-display-none">
        {wisdomAbility.modLabel}
      </span>
    </Tag>
  );
}
