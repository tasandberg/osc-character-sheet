import type { MouseEventHandler } from "react";
import type { IdentityVM } from "@domain/vm-types";

type Props = {
  identity: IdentityVM;
  onClick?: MouseEventHandler<HTMLImageElement>;
  onContextMenu?: MouseEventHandler<HTMLImageElement>;
  canEdit?: boolean;
};

export function Portrait({ identity, onClick, onContextMenu, canEdit }: Props) {
  return (
    <div className="osc-portrait-wrap profile tw:relative tw:aspect-square tw:w-(--osc-portrait-size) tw:@max-md/app:h-[calc(var(--spacer-12)*1.5)] tw:@max-md/app:w-[calc(var(--spacer-12)*1.5)] tw:@max-md/app:self-center tw:@twopane/sheet:h-[120px] tw:@twopane/sheet:w-[120px] tw:@twopane/sheet:self-center">
      <img
        className={
          "osc-portrait profile-img tw:absolute tw:inset-0 tw:h-full tw:w-full" +
          " tw:bg-bg-2 tw:object-contain" +
          (canEdit ? " tw:cursor-pointer tw:hover:outline tw:hover:outline-gold" : "")
        }
        src={identity.img || undefined}
        alt={identity.name}
        data-edit="img"
        title={identity.name}
        onClick={onClick}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
