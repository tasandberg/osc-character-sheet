import type { OseConfig } from "@ose-foundry-core/types";

declare global {
  interface LenientGlobalVariableTypes {
    game: never;
    canvas: never;
  }

  class Hooks extends foundry.helpers.Hooks {}
  const fromUuid = foundry.utils.fromUuid;
  const fromUuidSync = foundry.utils.fromUuidSync;

  interface CONFIG {
    OSE: OseConfig;
  }
}
