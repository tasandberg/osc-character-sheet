// Pure, unit-testable helpers for the window-header ⋮ controls menu.

/** Right-align the menu to its toggle, clamped on-screen. */
export function alignedMenuLeft(toggleRight: number, menuWidth: number): number {
  return Math.max(0, toggleRight - menuWidth);
}

export interface SheetClassEntry {
  id?: string;
  cls?: { prototype?: Record<string, unknown> };
}

/** Registered OSE sheet carrying `_onConfigureActor` (method match survives upstream renames). */
export function findTweaksSheetEntry<T extends SheetClassEntry>(
  entries: T[],
): T | undefined {
  const withHandler = entries.filter(
    (e) => typeof e.cls?.prototype?._onConfigureActor === "function",
  );
  return withHandler.find((e) => e.id?.startsWith("ose.")) ?? withHandler[0];
}
