import { hasClassItems } from "./class/classItems";

const MIN_OSE_VERSION = "3.2.0";

type Globals = {
  game?: { system?: { version?: string } };
  foundry?: { utils?: { isNewerVersion(v1: string, v0: string): boolean } };
};

export function creationWizardSupported(): boolean {
  const { game, foundry } = globalThis as Globals;
  const version = game?.system?.version;
  const isNewerVersion = foundry?.utils?.isNewerVersion;
  return (
    typeof version === "string" &&
    !!isNewerVersion &&
    !isNewerVersion(MIN_OSE_VERSION, version)
  );
}

export function creationWizardAvailable(): boolean {
  return creationWizardSupported() && hasClassItems();
}
