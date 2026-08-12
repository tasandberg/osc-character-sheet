import type { MouseEventHandler } from "react";
import type { IdentityVM } from "@domain/vm-types";

type Props = {
  identity: IdentityVM;
  /** Right-click on the portrait (e.g. Token Variant Art's picker). */
  onContextMenu?: MouseEventHandler<HTMLImageElement>;
  /** When true, left-click opens the image FilePicker (core `editImage` action). */
  canEdit?: boolean;
};

/** `.profile` / `.profile-img` mirror the OSE sheet so modules keyed on those
 *  selectors match. The `.modifiers-btn` overlay that portrait-decorating modules
 *  (e.g. OSR Character Builder) inject into is created imperatively in
 *  osc-sheet.js — outside React's tree — so React never clobbers an injected
 *  child.
 *
 *  `align-self` spans both header rows in medium (= full header height); the rail
 *  and XS centre it instead. */
export function Portrait({ identity, onContextMenu, canEdit }: Props) {
  return (
    <div className="osc-portrait-wrap profile tw:relative tw:w-[110px] tw:self-stretch tw:@max-md/app:h-[54px] tw:@max-md/app:w-[54px] tw:@max-md/app:self-center tw:@twopane/sheet:h-[120px] tw:@twopane/sheet:w-[120px] tw:@twopane/sheet:self-center">
      {/* `data-action="editImage"` (core AppV2 vocabulary) rides the frame's
          delegated click listener — no React onClick needed — and doubles as
          a compat surface for modules keyed on the core attribute. Rendered
          only when editable so non-owners get no action and no affordance.

          `absolute` so the IMG's intrinsic size can't inflate the row height.
          The hover tint is written for both tiers: container-query utilities
          emit after `hover:` ones, so an unqualified `hover:border-gold` would
          lose to the XS border colour at XS. */}
      <img
        className={
          "osc-portrait profile-img tw:absolute tw:inset-0 tw:h-full tw:w-full tw:rounded-md" +
          " tw:border-2 tw:border-gold-dim tw:bg-[radial-gradient(circle_at_50%_35%,#2c281f,#15130e)]" +
          " tw:object-cover tw:shadow-[0_1px_4px_rgba(0,0,0,0.4)]" +
          " tw:@max-md/app:border tw:@max-md/app:border-border tw:@max-md/app:shadow-none" +
          (canEdit
            ? " tw:cursor-pointer tw:hover:border-gold tw:@max-md/app:hover:border-gold"
            : "")
        }
        src={identity.img || undefined}
        alt={identity.name}
        data-action={canEdit ? "editImage" : undefined}
        data-edit="img"
        title={identity.name}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
