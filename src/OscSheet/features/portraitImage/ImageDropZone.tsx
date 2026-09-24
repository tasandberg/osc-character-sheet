import { useState } from "react";
import { cx } from "@ui/cx";
import type { ImageDrop } from "./parseImageDrop";
import type { PortraitImageTarget } from "./portraitImageState";
import type { PortraitDropZone } from "./usePortraitDrop";

const LABELS: Record<PortraitImageTarget, string> = {
  portrait: "Set portrait",
  token: "Set token",
  both: "Set both",
};

type Props = {
  readonly zone: PortraitDropZone;
  readonly target: PortraitImageTarget;
  readonly onImage: (image: ImageDrop, target: PortraitImageTarget) => void;
  readonly className?: string;
};

export function ImageDropZone({ zone, target, onImage, className }: Props) {
  const [over, setOver] = useState(false);
  const handlers = zone.target((image) => onImage(image, target));
  return (
    <div
      data-testid="image-drop-zone"
      data-target={target}
      className={cx(
        "osc-image-drop-face osc-image-drop-zone u-flex u-items-center u-justify-center u-p-2",
        over && "is-over",
        className,
      )}
      onDragEnter={(event) => {
        handlers.onDragEnter(event);
        setOver(true);
      }}
      onDragOver={handlers.onDragOver}
      onDragLeave={(event) => {
        handlers.onDragLeave(event);
        setOver(false);
      }}
      onDrop={(event) => {
        setOver(false);
        handlers.onDrop(event);
      }}
    >
      <span className="osc-image-drop-label u-fs-xl u-px-3 u-py-2 u-r-md">
        {LABELS[target]}
      </span>
    </div>
  );
}
