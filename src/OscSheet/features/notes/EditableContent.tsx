import { useEffect, useState } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { ProseMirrorEditor } from "@ui/ProseMirrorEditor";
import { RichText } from "@ui/RichText";

export default function EditableContent({
  title,
  name,
  value,
}: {
  title: string;
  name: string;
  value: string;
}) {
  const { actor, updateActor, canEdit } = useOscSheetContext();
  const [enriched, setEnriched] = useState<string>("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let live = true;
    // Foundry's rich-text renderer — resolves @UUID journal/actor links,
    // inline rolls, and embeds. We render its output directly in view mode.
    foundry.applications.ux.TextEditor.enrichHTML(value, {
      secrets: true,
      documents: true,
      links: true,
      rolls: true,
      embeds: true,
      relativeTo: actor,
    }).then((html) => {
      if (live) setEnriched(html);
    });
    return () => {
      live = false;
    };
  }, [value, actor]);

  return (
    <section className="osc-section" data-testid="editable-section">
      <SectionTitle>{title}</SectionTitle>
      {editing ? (
        // Edit on demand: an always-on ProseMirror that fills the same space.
        // Its Save persists and returns to the static view (no separate cancel).
        <ProseMirrorEditor
          name={name}
          value={value}
          enriched={enriched}
          toggled={false}
          documentUUID={actor.uuid}
          onSave={(next) => {
            void updateActor({ [name]: next });
            setEditing(false);
          }}
        />
      ) : (
        // Static view card; max-w = a reading measure, not the full tab width.
        <div className="tw:max-w-[640px] tw:border tw:border-border-soft tw:bg-bg-2 tw:px-3 tw:py-2">
          {canEdit && (
            <div className="tw:flex tw:justify-end">
              <IconButton
                variant="accent"
                title={`Edit ${title}`}
                aria-label={`Edit ${title}`}
                onClick={() => setEditing(true)}
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
              </IconButton>
            </div>
          )}
          {enriched.trim() ? (
            <RichText html={enriched} />
          ) : (
            <p className="tw:m-0 tw:text-(length:--fs-xs) tw:text-text-dim">
              No {title.toLowerCase()} yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
