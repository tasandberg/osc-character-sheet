import { useEffect, useMemo, useState } from "react";
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
  onChange: (draft: PortraitDraft) => void;
};

export function PortraitPicker({ draft, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const staged = livePortrait(draft);
  const preview = usePreview(staged?.portrait);
  return (
    <>
      <button
        type="button"
        className="ed-portrait u-flex-none"
        aria-label="Choose portrait and token"
        onClick={() => setOpen(true)}
      >
        {preview ? (
          <img src={preview} alt="" />
        ) : (
          <span className="ed-portrait-ph">portrait</span>
        )}
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
