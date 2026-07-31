import { useEffect, useState } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { ProseMirrorEditor } from "@ui/ProseMirrorEditor";
import { RichText } from "@ui/RichText";
import { getThemeSetting } from "@src/OscSheet/theme";

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

  // Foundry's content-links/editor resolve colours from its OWN theme scope
  // (`.themed.theme-{light,dark}`), independent of our sheet theme — so a cream
  // sheet would otherwise get dark-on-dark links. Mirror our theme onto the
  // container so they match.
  const fdTheme = getThemeSetting() === "cream" ? "theme-light" : "theme-dark";

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
    <section className="osc-section osc-notes-sec">
      <SectionTitle>{title}</SectionTitle>
      {editing ? (
        // Edit on demand: an always-on ProseMirror that fills the same space.
        // Its Save persists and returns to the static view (no separate cancel).
        <div className={`themed ${fdTheme}`}>
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
        </div>
      ) : (
        // Static view card; max-w = a reading measure, not the full tab width.
        <div className="osc-rich-text tw:relative tw:max-w-[640px] tw:rounded-md tw:border tw:border-border-soft tw:bg-bg-2 tw:px-3 tw:py-2">
          {canEdit && (
            // Pinned top-right. `tw:absolute` outranks the `all: unset` reset
            // (@layer base) — without it the pencil drops into normal flow.
            <IconButton
              variant="accent"
              className="osc-rich-text-edit tw:absolute tw:top-2 tw:right-2 tw:z-[2]"
              title={`Edit ${title}`}
              aria-label={`Edit ${title}`}
              onClick={() => setEditing(true)}
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
            </IconButton>
          )}
          {enriched.trim() ? (
            <RichText html={enriched} />
          ) : (
            <p className="osc-rich-text-empty tw:m-0 tw:italic tw:text-text-faint">
              No {title.toLowerCase()} yet.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
