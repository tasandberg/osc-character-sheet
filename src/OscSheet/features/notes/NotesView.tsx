import { useOscSheetContext } from "@app/context";
import EditableContent from "@features/notes/EditableContent";

export default function Notes() {
  const { actor } = useOscSheetContext();

  return (
    <div
      className="tw:flex tw:flex-col tw:gap-5"
      data-testid="notes-tab"
    >
      <EditableContent
        title="Notes"
        name="system.details.notes"
        value={actor.system.details.notes}
      />
      <EditableContent
        title="Biography"
        name="system.details.biography"
        value={actor.system.details.biography}
      />
    </div>
  );
}
