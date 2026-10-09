import { ICON_CREDITS } from "@old-school-chronicle/vellum/icons";
import { MODULE_ID } from "@src/OscSheet/domain/flags";

class OscAbout extends foundry.applications.api.DialogV2 {
  static DEFAULT_OPTIONS = {
    id: "osc-about",
    window: {
      title: "About OSC Character Sheet",
      icon: "fa-solid fa-circle-info",
    },
    position: { width: 420 },
    content: `<p>${ICON_CREDITS}</p>`,
    buttons: [{ action: "close", label: "Close", default: true }],
  };

  static register() {
    game.settings.registerMenu(MODULE_ID, "about", {
      name: "About",
      label: "Credits",
      hint: "Licences and credits for artwork used by the sheet.",
      icon: "fa-solid fa-circle-info",
      type: OscAbout,
      restricted: false,
    });
  }
}

export default OscAbout;
