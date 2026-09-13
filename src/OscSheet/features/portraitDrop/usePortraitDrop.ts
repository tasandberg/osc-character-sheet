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
import { dragKind, parseImageDrop, type ImageDrop } from "./parseImageDrop";
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
  const [status, setStatus] = useState<PortraitDropStatus>("idle");
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

  const classify = (event: DragEvent<HTMLElement>): PortraitDropStatus => {
    const kind = dragKind(
      Array.from(event.dataTransfer.types),
      cachedDragPayload(),
      gate.ready,
    );
    if (!kind) return "idle";
    return kind === "file" && !gate.ready ? "blocked" : "ready";
  };

  return {
    status,
    message: "message" in gate ? gate.message : null,
    onDragEnter: (event) => {
      const next = classify(event);
      if (next === "idle") return;
      event.preventDefault();
      depth.current += 1;
      setStatus(next);
    },
    onDragOver: (event) => {
      const next = classify(event);
      if (next === "idle") return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = next === "ready" ? "copy" : "none";
      if (next !== status) setStatus(next);
    },
    onDragLeave: () => {
      if (depth.current === 0) return;
      depth.current -= 1;
      if (depth.current === 0) setStatus("idle");
    },
    onDrop: (event) => {
      const next = classify(event);
      depth.current = 0;
      setStatus("idle");
      if (next === "idle") return;
      event.preventDefault();
      event.stopPropagation();
      if (next === "blocked") return;
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
