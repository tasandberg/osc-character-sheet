import ReactorSheet from "@src/applications/reactor-sheet";
import { installAdvancedClasses } from "@src/util/adaptAdvancedClasses";
import { onRenderChatMessage } from "@domain/chat/applyDamage";
import logger from "@src/util/logger";

export function initialize() {
  foundry.helpers.Hooks.once("init", () => {
    logger("Initializing module");
    ReactorSheet.registerSettings();
  });

  // Wire the GM apply-damage button on our Vellum damage cards. v13/v14 hook —
  // passes a native HTMLElement (not jQuery), matching the OSE system.
  foundry.helpers.Hooks.on(
    "renderChatMessageHTML",
    (message: ChatMessage, html: HTMLElement) => onRenderChatMessage(message, html),
  );

  foundry.helpers.Hooks.once("ready", async () => {
    logger("Initializing React application");
    installAdvancedClasses();
    foundry.documents.collections.Actors.registerSheet(
      game.system?.id,
      ReactorSheet,
      {
        types: ["character", "npc"],
        makeDefault: true,
        label: "Old-School Chronicle Character Sheet",
      },
    );
  });
}

initialize();
