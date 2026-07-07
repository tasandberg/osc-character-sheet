import { useEffect, useState } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { ProseMirrorEditor } from "@ui/ProseMirrorEditor";
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
  const [editing, setEditingState] = useState(false);
  // Read-only sheets never enter edit mode.
  const setEditing = (v: boolean) => setEditingState(v && canEdit);

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
        <div className={`osc-rt themed ${fdTheme}`}>
          {canEdit && (
            <IconButton
              variant="accent"
              className="osc-rt-edit"
              title={`Edit ${title}`}
              aria-label={`Edit ${title}`}
              onClick={() => setEditing(true)}
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
            </IconButton>
          )}
          {enriched.trim() ? (
            <div className="osc-rt-body" dangerouslySetInnerHTML={{ __html: enriched }} />
          ) : (
            <p className="osc-rt-empty">No {title.toLowerCase()} yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
