import OscSheet from "@src/applications/osc-sheet";
import { installAdvancedClasses } from "@src/util/adaptAdvancedClasses";
import { onRenderChatMessage } from "@domain/chat/applyDamage";
import { registerSendItemSocket } from "@features/inventory/sendItemSocket";
import { MODULE_ID } from "@domain/flags";
import {
  migrateLocalStorage,
  registerMigrationSetting,
  runWorldMigration,
} from "@domain/migrations";
import logger from "@src/util/logger";

export function initialize() {
  foundry.helpers.Hooks.once("init", () => {
    logger("Initializing module");
    OscSheet.registerSettings();
    registerMigrationSetting();
  });

  // Wire the GM apply-damage button on our Vellum damage cards. v13/v14 hook —
  // passes a native HTMLElement (not jQuery), matching the OSE system.
  foundry.helpers.Hooks.on(
    "renderChatMessageHTML",
    (message: ChatMessage, html: HTMLElement) =>
      onRenderChatMessage(message, html),
  );

  foundry.helpers.Hooks.once("ready", async () => {
    logger("Initializing React application");
    migrateLocalStorage(); // every user; independent of the GM world pass
    await runWorldMigration();
    installAdvancedClasses();
    registerSendItemSocket(); // GM relay for cross-owner "Send Item" transfers

    // Debug API. `crashTest()` throws a deliberate error inside any open OSC
    // sheet on its next render — exercises the ErrorBoundary fallback (and the
    // opt-in crash reporter). Harmless unless explicitly called.
    const mod = game.modules?.get(MODULE_ID) as unknown as
      { api?: Record<string, unknown> } | undefined;
    if (mod) {
      mod.api = {
        crashTest: () => window.dispatchEvent(new Event("osc-crash-test")),
      };
    }

    foundry.documents.collections.Actors.registerSheet(
      game.system?.id,
      OscSheet,
      {
        types: ["character", "npc"],
        makeDefault: true,
        label: "Enhanced Character Sheet",
      },
    );
  });
}

initialize();
