import type { MouseEventHandler } from "react";
import type { IdentityVM } from "@domain/vm-types";

type Props = {
  identity: IdentityVM;
  onContextMenu?: MouseEventHandler<HTMLImageElement>;
  canEdit?: boolean;
};

export function Portrait({ identity, onContextMenu, canEdit }: Props) {
  return (
    <div className="osc-portrait-wrap profile tw:relative tw:aspect-square tw:w-[110px] tw:@max-md/app:h-[54px] tw:@max-md/app:w-[54px] tw:@max-md/app:self-center tw:@twopane/sheet:h-[120px] tw:@twopane/sheet:w-[120px] tw:@twopane/sheet:self-center">
      <img
        className={
          "osc-portrait profile-img tw:absolute tw:inset-0 tw:h-full tw:w-full tw:rounded-md" +
          " tw:border-2 tw:border-border tw:bg-[radial-gradient(circle_at_50%_35%,#2c281f,#15130e)]" +
          " tw:object-cover tw:shadow-[0_1px_4px_rgba(0,0,0,0.4)]" +
          " tw:@max-md/app:border tw:@max-md/app:shadow-none" +
          (canEdit ? " tw:cursor-pointer tw:hover:border-gold" : "")
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
