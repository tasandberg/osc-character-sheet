import { openDocument } from "../actions";
import { EMPTY_VALUE, treasureLabel, type DocumentLink } from "../viewModel";

function resolvedName(uuid: string): string {
  try {
    return (fromUuidSync(uuid) as { name?: string } | null)?.name ?? "";
  } catch {
    return "";
  }
}

type Props = { treasure: DocumentLink | null; onClear?: () => void };

export function TreasureValue({ treasure, onClear }: Props) {
  if (!treasure) {
    return (
      <span
        title={
          onClear ? "Drop a RollTable on the sheet to link treasure" : undefined
        }
      >
        {EMPTY_VALUE}
      </span>
    );
  }
  const label =
    treasure.label ?? (treasureLabel(resolvedName(treasure.uuid)) || "Table");
  return (
    <button
      type="button"
      className="osc-monster-link"
      title={
        onClear
          ? "Open treasure table · right-click to unlink"
          : "Open treasure table"
      }
      onClick={() => void openDocument(treasure.uuid)}
      onContextMenu={
        onClear &&
        ((event) => {
          event.preventDefault();
          onClear();
        })
      }
    >
      {label}
    </button>
  );
}
