import { useEffect, useMemo, useState } from "react";
import { cx } from "@ui/cx";
import { PortraitImageDialog } from "@features/portraitImage/PortraitImageDialog";
import type { ImageDrop } from "@features/portraitImage/parseImageDrop";
import { livePortrait, type PortraitDraft } from "./portraitDraft";

const NO_IMAGES = { portrait: "", token: "" };

function usePreview(slot?: ImageDrop) {
  const url = useMemo(
    () => (slot?.kind === "file" ? URL.createObjectURL(slot.file) : undefined),
    [slot],
  );
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return slot?.kind === "path" ? slot.src || undefined : url;
}

type Props = {
  draft?: PortraitDraft;
  size?: "sm" | "lg";
  alt?: string;
  onChange?: (draft: PortraitDraft) => void;
};

export function PortraitPicker({ draft, size = "lg", alt, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const staged = livePortrait(draft);
  const preview = usePreview(staged?.portrait);
  const className = cx(
    "ed-portrait u-flex-none",
    size === "sm" ? "osc-creation-portrait-sm" : "osc-creation-portrait-lg",
  );
  const content = preview ? (
    <img src={preview} alt={alt ? `Portrait of ${alt}` : ""} />
  ) : (
    <span className="ed-portrait-ph">portrait</span>
  );
  if (!onChange) return <span className={className}>{content}</span>;
  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="Choose portrait and token"
        onClick={() => setOpen(true)}
      >
        {content}
      </button>
      {open && (
        <PortraitImageDialog
          current={NO_IMAGES}
          staged={staged}
          placedTokens={false}
          onClose={() => setOpen(false)}
          onSave={async (state) => onChange(state)}
        />
      )}
    </>
  );
}
