/** World setting: inverts ctrl/meta-click so the dialog is skipped by default. */
function invertedCtrlBehavior(): boolean {
  try {
    const settings = game.settings as { get(ns: string, key: string): unknown };
    return !!settings.get(game.system.id, "invertedCtrlBehavior");
  } catch {
    return false;
  }
}

/** OSE parity: ctrl/meta-click skips the roll dialog, inverted by the world setting. */
export function skipRollDialog(event?: { ctrlKey: boolean; metaKey: boolean }): boolean {
  const held = !!event && (event.ctrlKey || event.metaKey);
  return invertedCtrlBehavior() ? !held : held;
}
