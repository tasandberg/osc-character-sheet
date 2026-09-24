export type PortraitDropState =
  | { readonly ready: true }
  | { readonly ready: false; readonly message: string };

type PortraitDropGateInputs = {
  readonly isGM: boolean;
  readonly canUpload: boolean;
  readonly uploadsEnabled: boolean;
  readonly uploadPath: string;
};

const NOT_ENABLED = "Portrait uploads not enabled for this world";
const GM_SET_PATH = "Please set an upload target for OSC Sheet portraits";
const ASK_GM = "Ask your GM to set an upload target for OSC Sheet portraits";

export function resolvePortraitDropState({
  isGM,
  canUpload,
  uploadsEnabled,
  uploadPath,
}: PortraitDropGateInputs): PortraitDropState {
  if (!uploadsEnabled) return { ready: false, message: NOT_ENABLED };
  if (!uploadPath.trim())
    return { ready: false, message: isGM ? GM_SET_PATH : ASK_GM };
  if (!canUpload) return { ready: false, message: ASK_GM };
  return { ready: true };
}
