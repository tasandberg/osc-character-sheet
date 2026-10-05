import CreationWizardApp from "@src/CreationWizard";
import { applyTheme, watchFoundryColorScheme } from "@src/OscSheet/theme";
import { applyFontScale } from "@src/OscSheet/fontScale";
import { sheetFontScale, sheetTheme } from "@src/OscSheet/appearance";
import {
  getSetting,
  getSettingsSnapshot,
  subscribeToSetting,
  subscribeToSettings,
} from "@src/OscSheet/settings";
import { addNewCharacterButton } from "@src/applications/newCharacterButton";
import { setCreationWizardOpener } from "@src/CreationWizard/opener";

import { ReactApplicationV2 } from "foundry-vtt-react";

class OscCreationWizard extends ReactApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "osc-creation-wizard",
    tag: "div",
    classes: ["osc-sheet", "osc-creation-wizard"],
    window: {
      title: "New Character",
      icon: "fa-solid fa-hat-wizard",
      minimizable: true,
      resizable: true,
    },
    position: {
      width: 960,
      height: 680,
    },
  };

  constructor({ actor, ...options } = {}) {
    super({
      ...options,
      reactApp: CreationWizardApp,
      initialProps: { actor },
    });
  }

  static open(actor) {
    const id = actor
      ? `osc-creation-wizard-${actor.id}`
      : "osc-creation-wizard";
    const app =
      foundry.applications.instances.get(id) ??
      new OscCreationWizard({ id, actor });
    return app.render({ force: true });
  }

  static register() {
    const openWizards = () =>
      [...foundry.applications.instances.values()].filter(
        (app) => app instanceof OscCreationWizard && app.element,
      );
    const refresh = () => {
      for (const app of openWizards()) app.applyAppearance();
    };
    setCreationWizardOpener((actor) => OscCreationWizard.open(actor));
    subscribeToSettings(refresh);
    watchFoundryColorScheme(refresh);
    subscribeToSetting("creationWizard", () => ui.actors?.render());

    foundry.helpers.Hooks.on("renderActorDirectory", (_app, html) => {
      addNewCharacterButton(html, {
        enabled: getSetting("creationWizard") && Actor.canUserCreate(game.user),
        onClick: () => OscCreationWizard.open(),
      });
    });
  }

  applyAppearance() {
    const settings = getSettingsSnapshot();
    applyTheme(this.element, sheetTheme("character", settings));
    applyFontScale(this.element, sheetFontScale("character", settings));
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.applyAppearance();
  }
}

Object.defineProperty(OscCreationWizard, "name", {
  value: "OscCreationWizard",
});

export default OscCreationWizard;
