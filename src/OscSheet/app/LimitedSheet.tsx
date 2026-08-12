import { Frame, LimitedHeader } from "@layout";
import { useOscSheetContext } from "@app/context";
import { selectIdentity } from "@domain/identity";
import EditableContent from "@features/notes/EditableContent";

export default function LimitedSheet() {
  const { actor } = useOscSheetContext();

  return (
    <Frame header={<LimitedHeader identity={selectIdentity(actor)} />}>
      <EditableContent
        title="Biography"
        name="system.details.biography"
        value={actor.system.details.biography}
      />
    </Frame>
  );
}
