// Pure helpers for the window-header ⋮ controls menu. Kept out of
// osc-sheet.js so the math/lookup logic is unit-testable.

/**
 * Left offset that right-aligns the controls menu to its toggle button:
 * the menu's right edge sits on the toggle's right edge, clamped on-screen.
 */
export function alignedMenuLeft(toggleRight: number, menuWidth: number): number {
  return Math.max(0, toggleRight - menuWidth);
}

export interface SheetClassEntry {
  id?: string;
  cls?: { prototype?: Record<string, unknown> };
}

/**
 * Pick the registered OSE v1 actor-sheet class that carries the Tweaks
 * handler (`_onConfigureActor`). Prefers ose-scoped registrations; matching
 * on the method (not the class name) survives upstream renames.
 */
export function findTweaksSheetEntry<T extends SheetClassEntry>(
  entries: T[],
): T | undefined {
  const withHandler = entries.filter(
    (e) => typeof e.cls?.prototype?._onConfigureActor === "function",
  );
  return withHandler.find((e) => e.id?.startsWith("ose.")) ?? withHandler[0];
}
