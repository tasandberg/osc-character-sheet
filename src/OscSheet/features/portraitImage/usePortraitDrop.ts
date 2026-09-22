import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type DragEventHandler,
} from "react";
import { useSetting } from "@src/OscSheet/settings";
import { resolvePortraitDropState, type PortraitDropState } from "./dropState";
import { cachedDragPayload, retainDragPayloadCache } from "./dragPayloadCache";
import {
  NON_IMAGE_FILE_MESSAGE,
  dragKind,
  hasNonImageFile,
  parseImageDrop,
  type ImageDrop,
} from "./parseImageDrop";

export type PortraitDropStatus = "idle" | "ready" | "blocked";

export type ImageDropHandlers = {
  readonly onDragEnter: DragEventHandler<HTMLElement>;
  readonly onDragOver: DragEventHandler<HTMLElement>;
  readonly onDragLeave: DragEventHandler<HTMLElement>;
  readonly onDrop: DragEventHandler<HTMLElement>;
};

export type PortraitDropZone = ImageDropHandlers & {
  readonly status: PortraitDropStatus;
  readonly message: string | null;
  readonly target: (onImage: (image: ImageDrop) => void) => ImageDropHandlers;
};

type FoundryGlobals = {
  game?: { user?: { isGM?: boolean; can?(permission: string): boolean } };
  ui?: { notifications?: { warn(message: string): void } };
  location?: { origin?: string };
  ROUTE_PREFIX?: string;
};

const globals = () => globalThis as unknown as FoundryGlobals;

type DragState = {
  readonly status: PortraitDropStatus;
  readonly message: string | null;
};

const IDLE: DragState = { status: "idle", message: null };

type Options = {
  readonly enabled: boolean;
};

export function usePortraitUploadGate(): PortraitDropState {
  const uploadsEnabled = useSetting("portraitUploads");
  const uploadPath = useSetting("portraitUploadPath");
  const user = globals().game?.user;
  return resolvePortraitDropState({
    isGM: !!user?.isGM,
    canUpload: !!user?.can?.("FILES_UPLOAD"),
    uploadsEnabled,
    uploadPath,
  });
}

export function usePortraitDrop({
  enabled,
}: Options): PortraitDropZone | undefined {
  const gate = usePortraitUploadGate();
  const [drag, setDrag] = useState<DragState>(IDLE);
  const depth = useRef(0);

  useEffect(() => (enabled ? retainDragPayloadCache() : undefined), [enabled]);

  if (!enabled) return undefined;

  const gateMessage = "message" in gate ? gate.message : null;

  const classify = (event: DragEvent<HTMLElement>): DragState => {
    const kind = dragKind(
      Array.from(event.dataTransfer.types),
      cachedDragPayload(),
      gate.ready,
    );
    if (!kind) return IDLE;
    if (kind === "path") return { status: "ready", message: null };
    if (!gate.ready) return { status: "blocked", message: null };
    return hasNonImageFile(Array.from(event.dataTransfer.items))
      ? { status: "blocked", message: NON_IMAGE_FILE_MESSAGE }
      : { status: "ready", message: null };
  };

  const show = (next: DragState) => {
    if (next.status !== drag.status || next.message !== drag.message)
      setDrag(next);
  };

  const onDragEnter: DragEventHandler<HTMLElement> = (event) => {
    const next = classify(event);
    if (next.status === "idle") return;
    event.preventDefault();
    depth.current += 1;
    setDrag(next);
  };

  const onDragOver: DragEventHandler<HTMLElement> = (event) => {
    const next = classify(event);
    if (next.status === "idle") return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = next.status === "ready" ? "copy" : "none";
    show(next);
  };

  const onDragLeave: DragEventHandler<HTMLElement> = () => {
    if (depth.current === 0) return;
    depth.current -= 1;
    if (depth.current === 0) setDrag(IDLE);
  };

  const dropTo =
    (onImage?: (image: ImageDrop) => void): DragEventHandler<HTMLElement> =>
    (event) => {
      const next = classify(event);
      depth.current = 0;
      setDrag(IDLE);
      if (next.status === "idle") return;
      event.preventDefault();
      event.stopPropagation();
      if (next.status === "blocked" || !onImage) return;
      const parsed = parseImageDrop(
        {
          preferFile: gate.ready,
          origin: globals().location?.origin,
          routePrefix: globals().ROUTE_PREFIX,
        },
        event.dataTransfer,
      );
      if (!parsed) return;
      if (parsed.kind === "rejected")
        globals().ui?.notifications?.warn(parsed.reason);
      else onImage(parsed);
    };

  return {
    status: drag.status,
    message: drag.message ?? gateMessage,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop: dropTo(),
    target: (onImage) => ({
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop: dropTo(onImage),
    }),
  };
}
