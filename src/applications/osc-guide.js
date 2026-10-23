import { ReactApplicationV2 } from "foundry-vtt-react";
import { GuideWindow, GUIDE_NAVIGATE } from "@features/guide/GuideWindow";
import { GUIDE_APP_ID } from "@features/guide/openGuide";
import { applyTheme } from "@src/OscSheet/theme";
import { applyFontScale } from "@src/OscSheet/fontScale";
import { sheetFontScale, sheetTheme } from "@src/OscSheet/appearance";
import { getSettingsSnapshot } from "@src/OscSheet/settings";

class OscGuide extends ReactApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: GUIDE_APP_ID,
    tag: "div",
    classes: ["osc-sheet", "osc-guide-window"],
    window: {
      title: "Character Sheet Guide",
      icon: "fa-solid fa-circle-question",
      resizable: true,
      minimizable: true,
    },
    position: { width: 780, height: 640 },
  };

  static async open(target) {
    const existing = foundry.applications.instances.get(GUIDE_APP_ID);
    if (existing) return existing.reveal(target);
    return new OscGuide(target).render({ force: true });
  }

  constructor(target) {
    super({ reactApp: GuideWindow });
    this.initialProps = {
      initial: target,
      connector: this.contextConnector,
      onClose: () => this.close(),
    };
  }

  async reveal(target) {
    if (this.minimized) await this.maximize();
    this.bringToFront();
    this.contextConnector.dispatchEvent(
      new CustomEvent(GUIDE_NAVIGATE, { detail: target })
    );
  }

  applyAppearance() {
    const settings = getSettingsSnapshot();
    applyTheme(this.element, sheetTheme("character", settings));
    applyFontScale(this.element, sheetFontScale("character", settings));
  }

  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.element.setAttribute("role", "dialog");
    this.element.setAttribute("aria-label", "Character sheet guide");
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.applyAppearance();
  }
}

export default OscGuide;
