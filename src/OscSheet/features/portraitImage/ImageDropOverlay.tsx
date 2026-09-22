import { ImageDropZone } from "./ImageDropZone";
import type { ImageDrop } from "./parseImageDrop";
import type { PortraitImageTarget } from "./portraitImageState";
import type { PortraitDropZone } from "./usePortraitDrop";

const TARGETS: readonly PortraitImageTarget[] = ["portrait", "token", "both"];

type Props = {
  readonly zone: PortraitDropZone;
  readonly onImage: (image: ImageDrop, target: PortraitImageTarget) => void;
};

export function ImageDropOverlay({ zone, onImage }: Props) {
  if (zone.status === "idle") return null;
  return (
    <div
      className="osc-image-drop-overlay u-p-2"
      data-testid="image-drop-overlay"
      data-drop={zone.status}
    >
      {zone.status === "blocked" ? (
        <div className="osc-image-drop-face is-blocked u-flex u-items-center u-justify-center u-p-4">
          <p
            role="status"
            className="osc-image-drop-message u-m-0 u-px-4 u-py-3 u-r-md u-bg-surface-2 u-border u-fs-md u-text"
          >
            {zone.message}
          </p>
        </div>
      ) : (
        <div className="osc-image-drop-zones u-grid u-gap-2">
          {TARGETS.map((target) => (
            <ImageDropZone
              key={target}
              zone={zone}
              target={target}
              onImage={onImage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
