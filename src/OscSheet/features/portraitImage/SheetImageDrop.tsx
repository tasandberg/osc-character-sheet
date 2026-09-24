import type { ReactNode } from "react";
import { ImageDropZone } from "./ImageDropZone";
import type { ImageDrop } from "./parseImageDrop";
import type { PortraitImageTarget } from "./portraitImageState";
import type { PortraitDropZone } from "./usePortraitDrop";

const TARGETS: readonly PortraitImageTarget[] = ["portrait", "token", "both"];

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
      {zone && status !== "idle" && (
        <div
          className="osc-image-drop-overlay u-p-2"
          data-testid="image-drop-overlay"
          data-drop={status}
        >
          {status === "blocked" ? (
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
      )}
    </div>
  );
}
