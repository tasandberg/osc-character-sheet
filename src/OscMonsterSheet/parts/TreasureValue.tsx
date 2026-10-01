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
        className="u-text-dim"
        title={onClear ? "Drop a roll table on the sheet" : undefined}
      >
        {EMPTY_VALUE}
      </span>
    );
  }
  const label =
    treasureLabel(treasure.label ?? resolvedName(treasure.uuid)) || "Table";
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
      <i className="fa-solid fa-scroll" aria-hidden="true" />
      <span className="osc-monster-link-text">{label}</span>
    </button>
  );
}
