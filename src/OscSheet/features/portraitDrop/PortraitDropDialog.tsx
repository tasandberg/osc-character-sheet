import { useEffect, useState } from "react";
import { Button } from "@ui/Button";
import { Field } from "@ui/Field";
import { Modal } from "@ui/Modal";
import { Segmented } from "@ui/Segmented";
import {
  PortraitUploadReportedError,
  type ApplyTarget,
  type PortraitDropChoice,
  type TokenScope,
} from "./applyPortraitDrop";
import type { ImageDrop } from "./parseImageDrop";

const TARGET_OPTIONS: { value: ApplyTarget; label: string }[] = [
  { value: "portrait", label: "Set portrait" },
  { value: "token", label: "Set token" },
  { value: "both", label: "Set both" },
];

const TOKEN_OPTIONS: { value: TokenScope; label: string }[] = [
  { value: "prototype", label: "Prototype only" },
  { value: "all", label: "Prototype + linked tokens" },
];

type Notifications = {
  ui?: { notifications?: { error(message: string): void } };
};

function usePreviewSrc(drop: ImageDrop): string | undefined {
  const file = drop.kind === "file" ? drop.file : null;
  const [objectUrl, setObjectUrl] = useState<string>();
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return drop.kind === "path" ? drop.src : objectUrl;
}

type Props = {
  drop: ImageDrop;
  onClose: () => void;
  onConfirm: (choice: PortraitDropChoice) => Promise<void>;
};

export function PortraitDropDialog({ drop, onClose, onConfirm }: Props) {
  const [target, setTarget] = useState<ApplyTarget>("both");
  const [tokens, setTokens] = useState<TokenScope>("prototype");
  const [busy, setBusy] = useState(false);
  const previewSrc = usePreviewSrc(drop);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm({ target, tokens });
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

  const footer = (
    <>
      <Button variant="ghost" onClick={close} disabled={busy}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => void confirm()} disabled={busy}>
        Confirm
      </Button>
    </>
  );

  return (
    <Modal
      open
      title={
        <>
          <i className="fa-solid fa-image" aria-hidden="true" />
          Portrait image
        </>
      }
      onClose={close}
      footer={footer}
      className="modal-inset"
    >
      <div className="u-row u-wrap u-items-start u-gap-5">
        <img
          className="osc-portrait-drop-preview u-r-md u-border u-bg-2"
          src={previewSrc}
          alt="Dropped image"
        />
        <div className="osc-portrait-drop-options u-stack u-gap-4">
          <Field label="Apply to">
            <div role="group" aria-label="Apply to">
              <Segmented<ApplyTarget>
                className="u-wrap"
                options={TARGET_OPTIONS}
                value={target}
                onValueChange={setTarget}
              />
            </div>
          </Field>
          <Field
            label="Tokens"
            hint="Unlinked tokens already on scenes keep their image."
          >
            <div role="group" aria-label="Tokens">
              <Segmented<TokenScope>
                className="u-wrap"
                options={TOKEN_OPTIONS}
                value={tokens}
                onValueChange={setTokens}
                disabled={target === "portrait"}
              />
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
