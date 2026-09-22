import { useEffect, useRef, useState } from "react";
import { Button } from "@ui/Button";
import { Check } from "@ui/Check";
import { cx } from "@ui/cx";
import { Field } from "@ui/Field";
import { InlineButton } from "@ui/InlineButton";
import { openImagePicker } from "@ui/imagePicker";
import { Modal } from "@ui/Modal";
import { PortraitField } from "@ui/PortraitField";
import { PortraitUploadReportedError } from "./applyPortraitImage";
import { ImageDropZone } from "./ImageDropZone";
import type { ImageDrop } from "./parseImageDrop";
import { usePortraitDrop } from "./usePortraitDrop";
import {
  dirtyPortraitImageKeys,
  initialPortraitImageState,
  linkPortraitImage,
  setPortraitImageSlot,
  stagePortraitImage,
  type ActorImages,
  type ImageSlot,
  type PortraitImageDrop,
  type PortraitImageSlotKey,
  type PortraitImageState,
  type PortraitImageTarget,
} from "./portraitImageState";

type Notifications = {
  ui?: { notifications?: { error(message: string): void } };
};

function useStagedPreview(): (slot: ImageSlot) => string | undefined {
  const urls = useRef(new Map<File, string>());
  useEffect(() => {
    const cache = urls.current;
    return () => {
      for (const url of cache.values()) URL.revokeObjectURL(url);
      cache.clear();
    };
  }, []);
  return (slot) => {
    if (slot.kind === "path") return slot.src || undefined;
    const known = urls.current.get(slot.file);
    if (known) return known;
    const url = URL.createObjectURL(slot.file);
    urls.current.set(slot.file, url);
    return url;
  };
}

type Props = {
  current: ActorImages;
  drop?: PortraitImageDrop | null;
  canDropImages?: boolean;
  onClose: () => void;
  onSave: (state: PortraitImageState) => Promise<void>;
};

export function PortraitImageDialog({
  current,
  drop,
  canDropImages,
  onClose,
  onSave,
}: Props) {
  const [state, setState] = useState<PortraitImageState>(() =>
    initialPortraitImageState(current, drop),
  );
  const [busy, setBusy] = useState(false);
  const previewOf = useStagedPreview();
  const dirty = dirtyPortraitImageKeys(state, current);
  const dropZone = usePortraitDrop({ enabled: !busy });
  const zones = dropZone?.status === "ready" ? dropZone : null;
  const blocked = dropZone?.status === "blocked" ? dropZone.message : null;

  const stage = (image: ImageDrop, target: PortraitImageTarget) =>
    setState((prev) => stagePortraitImage(prev, { image, target }));

  const save = async () => {
    setBusy(true);
    try {
      await onSave(state);
      onClose();
    } catch (error) {
      if (!(error instanceof PortraitUploadReportedError))
        (globalThis as Notifications).ui?.notifications?.error(
          error instanceof Error ? error.message : String(error),
        );
      setBusy(false);
    }
  };

  const close = () => {
    if (!busy) onClose();
  };

  const slot = (
    key: PortraitImageSlotKey,
    target: PortraitImageTarget,
    label: string,
    noun: string,
  ) => {
    const preview = previewOf(state[key]);
    const onPick = (src: string) =>
      setState((prev) =>
        setPortraitImageSlot(prev, key, { kind: "path", src }),
      );
    return (
      <Field label={label}>
        <div className="osc-portrait-image-slot u-flex u-justify-center">
          <PortraitField
            label={`Change ${noun}`}
            src={preview}
            onPick={onPick}
          />
          {zones && (
            <ImageDropZone zone={zones} target={target} onImage={stage} />
          )}
        </div>
        <InlineButton
          className="osc-portrait-image-browse u-mx-auto u-fs-xs"
          aria-label={`Browse for a ${noun}`}
          onClick={() => openImagePicker({ current: preview, onPick })}
        >
          Browse
        </InlineButton>
      </Field>
    );
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={close} disabled={busy}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => void save()} disabled={busy}>
        Save
      </Button>
    </>
  );

  return (
    <Modal
      open
      title={
        <>
          <i className="fa-solid fa-image" aria-hidden="true" />
          Portrait &amp; token image
        </>
      }
      onClose={close}
      footer={footer}
      className="modal-inset"
    >
      <div
        className="u-stack u-gap-4"
        onDragEnter={dropZone?.onDragEnter}
        onDragOver={dropZone?.onDragOver}
        onDragLeave={dropZone?.onDragLeave}
        onDrop={dropZone?.onDrop}
      >
        <Check
          checked={state.linked}
          disabled={busy}
          onChange={(event) =>
            setState((prev) => linkPortraitImage(prev, event.target.checked))
          }
        >
          Use same image for portrait and token
        </Check>
        <Field
          className="osc-portrait-image-group"
          hint={
            canDropImages
              ? "Browse, drag from the file browser, or drop a file here."
              : "Browse, or drag from the file browser."
          }
        >
          <div
            className={cx(
              "osc-portrait-image-slots u-row u-wrap u-gap-4 u-items-start",
              !state.linked && "is-split",
            )}
          >
            {state.linked ? (
              slot(
                "portrait",
                "both",
                "Portrait & token",
                "portrait and token image",
              )
            ) : (
              <>
                {slot("portrait", "portrait", "Portrait", "portrait image")}
                {slot("token", "token", "Token", "token image")}
              </>
            )}
            {zones && !state.linked && (
              <ImageDropZone
                zone={zones}
                target="both"
                onImage={stage}
                className="osc-image-drop-bar"
              />
            )}
            {blocked && (
              <p
                role="status"
                className="osc-image-drop-message osc-image-drop-alert u-m-0 u-px-3 u-py-2 u-r-md u-bg-surface-2 u-border u-fs-xs u-text-dim"
              >
                {blocked}
              </p>
            )}
          </div>
        </Field>
        <Field hint="Unlinked tokens already on scenes keep their image.">
          <Check
            checked={state.updatePlaced}
            disabled={busy || !dirty.token}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                updatePlaced: event.target.checked,
              }))
            }
          >
            Update tokens already on scenes
          </Check>
        </Field>
      </div>
    </Modal>
  );
}
