import type { ReactNode } from "react";
import { ImageDropOverlay } from "./ImageDropOverlay";
import type { ImageDrop } from "./parseImageDrop";
import type { PortraitImageTarget } from "./portraitImageState";
import type { PortraitDropZone } from "./usePortraitDrop";

type Props = {
  zone: PortraitDropZone | undefined;
  onImage: (image: ImageDrop, target: PortraitImageTarget) => void;
  children: ReactNode;
};

export function SheetImageDrop({ zone, onImage, children }: Props) {
  const status = zone?.status ?? "idle";
  return (
    <div
      className="osc-sheet-image-drop tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:flex-col"
      data-testid="sheet-image-drop"
      data-drop={status === "idle" ? undefined : status}
      onDragEnter={zone?.onDragEnter}
      onDragOver={zone?.onDragOver}
      onDragLeave={zone?.onDragLeave}
      onDrop={zone?.onDrop}
    >
      {children}
      {zone && <ImageDropOverlay zone={zone} onImage={onImage} />}
    </div>
  );
}
