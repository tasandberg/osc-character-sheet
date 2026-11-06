import type { SheetClassEntry } from "./header-controls";

const GRANTING_TYPES = new Set(["class", "race"]);

interface DropActor {
  type?: string;
  items: { get(id: string): unknown };
}

interface DropItem {
  type?: string;
  id?: string | null;
}

export type DropHandler = (event: DragEvent, item: unknown) => unknown;

/** A new OSE 3.2+ class or race dropped on a character. */
export function isGrantingDrop(actor: DropActor, item: DropItem): boolean {
  if (actor.type !== "character" || !GRANTING_TYPES.has(item.type ?? "")) return false;
  return !(item.id && actor.items.get(item.id));
}

/** The system character sheet's `_onDropItem`, which runs OSE's addClass/setRace flow. */
export function findSystemDropHandler(
  entries: SheetClassEntry[],
  systemId: string,
): DropHandler | undefined {
  const entry = entries.find(
    (e) =>
      e.id?.startsWith(`${systemId}.`) &&
      typeof e.cls?.prototype?._onDropItem === "function",
  );
  return entry?.cls?.prototype?._onDropItem as DropHandler | undefined;
}
