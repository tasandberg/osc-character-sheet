import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type DragEventHandler,
} from "react";
import { useSetting } from "@src/OscSheet/settings";
import { resolvePortraitDropState } from "./dropState";
import { cachedDragPayload, retainDragPayloadCache } from "./dragPayloadCache";
import {
  NON_IMAGE_FILE_MESSAGE,
  dragKind,
  hasNonImageFile,
  parseImageDrop,
  type ImageDrop,
} from "./parseImageDrop";
import type { PortraitDropIndicatorState } from "./PortraitDropIndicator";

export type PortraitDropStatus = "idle" | "ready" | "blocked";

export type PortraitDropZone = {
  readonly status: PortraitDropStatus;
  readonly message: string | null;
  readonly onDragEnter: DragEventHandler<HTMLElement>;
  readonly onDragOver: DragEventHandler<HTMLElement>;
  readonly onDragLeave: DragEventHandler<HTMLElement>;
  readonly onDrop: DragEventHandler<HTMLElement>;
};

export function portraitDropIndicator(
  zone: PortraitDropZone | undefined,
): PortraitDropIndicatorState | undefined {
  if (!zone || zone.status === "idle") return undefined;
  return { status: zone.status, message: zone.message };
}

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
  readonly onImage: (drop: ImageDrop) => void;
};

export function usePortraitDrop({
  enabled,
  onImage,
}: Options): PortraitDropZone | undefined {
  const uploadsEnabled = useSetting("portraitUploads");
  const uploadPath = useSetting("portraitUploadPath");
  const [drag, setDrag] = useState<DragState>(IDLE);
  const depth = useRef(0);

  useEffect(() => (enabled ? retainDragPayloadCache() : undefined), [enabled]);

  if (!enabled) return undefined;

  const user = globals().game?.user;
  const gate = resolvePortraitDropState({
    isGM: !!user?.isGM,
    canUpload: !!user?.can?.("FILES_UPLOAD"),
    uploadsEnabled,
    uploadPath,
  });

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

  return {
    status: drag.status,
    message: drag.message ?? gateMessage,
    onDragEnter: (event) => {
      const next = classify(event);
      if (next.status === "idle") return;
      event.preventDefault();
      depth.current += 1;
      setDrag(next);
    },
    onDragOver: (event) => {
      const next = classify(event);
      if (next.status === "idle") return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = next.status === "ready" ? "copy" : "none";
      show(next);
    },
    onDragLeave: () => {
      if (depth.current === 0) return;
      depth.current -= 1;
      if (depth.current === 0) setDrag(IDLE);
    },
    onDrop: (event) => {
      const next = classify(event);
      depth.current = 0;
      setDrag(IDLE);
      if (next.status === "idle") return;
      event.preventDefault();
      event.stopPropagation();
      if (next.status === "blocked") return;
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
    },
  };
}
