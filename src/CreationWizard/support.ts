const MIN_OSE_VERSION = [2, 2, 2];

export function supportsCreationWizard(
  systemVersion: string | undefined,
  hasClasses: boolean,
): boolean {
  const parts = (systemVersion ?? "").split(".").map((p) => parseInt(p, 10));
  if (!hasClasses || parts.some(Number.isNaN)) return false;
  for (let i = 0; i < MIN_OSE_VERSION.length; i++) {
    const part = parts[i] ?? 0;
    if (part !== MIN_OSE_VERSION[i]) return part > MIN_OSE_VERSION[i];
  }
  return true;
}

export function creationWizardSupported(): boolean {
  const classes = (
    CONFIG.OSE as { classes?: { classic?: unknown } } | undefined
  )?.classes;
  return supportsCreationWizard(game.system?.version, !!classes?.classic);
}

export const UNSUPPORTED_NOTICE =
  "The OSC character creation wizard needs the OSE system 2.2.2 or later. Update the system to use it.";
