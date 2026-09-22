export type ImageSlot =
  | { readonly kind: "path"; readonly src: string }
  | { readonly kind: "file"; readonly file: File };

export type ActorImages = {
  readonly portrait: string;
  readonly token: string;
};

export type PortraitImageSlotKey = "portrait" | "token";

export type PortraitImageTarget = PortraitImageSlotKey | "both";

export type PortraitImageDrop = {
  readonly image: ImageSlot;
  readonly target: PortraitImageTarget;
};

export type PortraitImageState = {
  readonly portrait: ImageSlot;
  readonly token: ImageSlot;
  readonly linked: boolean;
  readonly updatePlaced: boolean;
};

export type PortraitImageDirty = {
  readonly portrait: boolean;
  readonly token: boolean;
};

export function initialPortraitImageState(
  current: ActorImages,
  drop?: PortraitImageDrop | null,
): PortraitImageState {
  const state: PortraitImageState = {
    portrait: { kind: "path", src: current.portrait },
    token: { kind: "path", src: current.token },
    linked: current.portrait === current.token,
    updatePlaced: false,
  };
  if (!drop) return state;
  return stagePortraitImage({ ...state, linked: false }, drop);
}

export function linkPortraitImage(
  state: PortraitImageState,
  linked: boolean,
): PortraitImageState {
  if (!linked) return { ...state, linked };
  return { ...state, linked, token: state.portrait };
}

export function setPortraitImageSlot(
  state: PortraitImageState,
  key: PortraitImageSlotKey,
  slot: ImageSlot,
): PortraitImageState {
  if (state.linked) return { ...state, portrait: slot, token: slot };
  return { ...state, [key]: slot };
}

export function stagePortraitImage(
  state: PortraitImageState,
  { image, target }: PortraitImageDrop,
): PortraitImageState {
  if (target === "both")
    return { ...state, linked: true, portrait: image, token: image };
  return setPortraitImageSlot(state, target, image);
}

const isDirty = (slot: ImageSlot, src: string): boolean =>
  slot.kind === "file" || slot.src !== src;

export function dirtyPortraitImageKeys(
  state: PortraitImageState,
  current: ActorImages,
): PortraitImageDirty {
  return {
    portrait: isDirty(state.portrait, current.portrait),
    token: isDirty(state.token, current.token),
  };
}
