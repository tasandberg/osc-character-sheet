import type { ImageDrop } from "@features/portraitImage/parseImageDrop";
import type { PortraitImageState } from "@features/portraitImage/portraitImageState";

export type PortraitDraft = PortraitImageState;

const live = (slot: ImageDrop): ImageDrop =>
  slot.kind === "file" && !(slot.file instanceof File)
    ? { kind: "path", src: "" }
    : slot;

export const livePortrait = (
  draft?: PortraitDraft,
): PortraitDraft | undefined =>
  draft && {
    ...draft,
    portrait: live(draft.portrait),
    token: live(draft.token),
  };

export const isChosen = (slot: ImageDrop) =>
  slot.kind === "file" || slot.src !== "";
