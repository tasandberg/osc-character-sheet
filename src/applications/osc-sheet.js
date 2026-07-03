import OscSheetApp from "@src/OscSheet";
import { resolveTheme, applyTheme } from "@src/OscSheet/theme";
import {
  alignedMenuLeft,
  findTweaksSheetEntry,
} from "@src/applications/header-controls";

import { ReactActorSheetV2 } from "foundry-vtt-react";

class OscSheet extends ReactActorSheetV2 {
  reactApp = OscSheetApp;
  static DEFAULT_OPTIONS = {
    window: {
      title: "OSC Character Sheet",
      minimizable: true,
      resizable: true,
      controls: [
        {
          // OSE's Tweaks — same icon/i18n/gating as the v1 sheet's button.
          action: "configureTweaks",
          icon: "fas fa-code",
          label: "OSE.dialog.tweaks",
          ownership: "OWNER",
          visible: function () {
            return this.isEditable && !!OscSheet.#tweaksSheetEntry(this.document);
          },
        },
      ],
    },
    tag: "div",
    classes: ["osc-sheet"],
    position: {
      width: 625,
      height: 750,
    },
    actions: {
      editImage: OscSheet.#onEditImage,
      configureTweaks: OscSheet.#onConfigureTweaks,
    },
  };

  static registerSettings() {
    game.settings.register("osc-character-sheet", "theme", {
      name: "Sheet theme",
      hint: "Color theme for the OSC Character Sheet.",
      scope: "client",
      config: true,
      type: String,
      choices: { dark: "Dark", cream: "Cream" },
      default: "dark",
      onChange: () => {
        for (const app of foundry.applications.instances.values()) {
          if (app instanceof OscSheet) app.render();
        }
      },
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const theme = resolveTheme(game.settings.get("osc-character-sheet", "theme"));
    applyTheme(this.element, theme);
    // Accent by kind: retainers/hirelings (system.retainer.enabled) go teal;
    // everyone else keeps the brass --gold. See styles.scss [data-kind].
    this.element.dataset.kind = this.document?.system?.retainer?.enabled
      ? "hireling"
      : "pc";
    this.#injectCharacterBuilder();
  }

  // OSR Character Builder normally decorates the OSE sheet via the v1
  // `renderActorSheet` hook — which ApplicationV2 sheets never fire. We can't
  // re-emit that hook globally: other v1-hook modules (osr-item-shop, …) also
  // listen and throw on our ApplicationV2/synthetic args. Instead we replicate
  // just OSRCB's portrait icon and drive its own public API (`window.OSRCB.util`)
  // on click. Gated on the module being active and its own new-character
  // condition (`scores.str.value === 0`). No-ops cleanly otherwise.
  #injectCharacterBuilder() {
    if (!game.modules.get("osr-character-builder")?.active) return;
    requestAnimationFrame(() => {
      const root = this.element;
      if (!root?.isConnected) return;
      const wrap = root.querySelector(".osc-portrait-wrap");
      if (!wrap) return;
      // Re-rendered each pass; drop any prior icon so it can't stack.
      wrap.querySelector(":scope > .modifiers-btn")?.remove();
      const actor = this.document;
      if (actor?.system?.scores?.str?.value !== 0) return;

      const mount = document.createElement("div");
      mount.className = "modifiers-btn";
      const btn = document.createElement("a");
      btn.className = "osr-icon osr-choose-class";
      btn.title = "Character Builder";
      btn.innerHTML = `<i class="fas fa-user-shield"></i>`;
      btn.addEventListener("click", () => {
        const OSRCB = globalThis.OSRCB;
        if (!OSRCB?.util?.renderCharacterBuilder) return;
        const dataObj = OSRCB.util.mergeClassOptions();
        OSRCB.util.renderCharacterBuilder(actor, dataObj);
      });
      mount.appendChild(btn);
      wrap.appendChild(mount);
    });
  }

  // v14 only (v13's in-frame dropdown never calls this): runs when OUR ⋮ menu
  // opens, so we can nudge core's popover leftward without touching other apps.
  *_headerControlContextEntries() {
    yield* super._headerControlContextEntries();
    this.#alignControlsMenu();
  }

  // Core positions after onOpen → poll a few frames; only `left` is ours.
  #alignControlsMenu(frames = 10) {
    const toggle = this.element?.querySelector(
      '.header-control[data-action="toggleControls"]'
    );
    if (!toggle) return;
    const attempt = (remaining) => {
      if (ui.context?.target !== toggle) return; // not our menu anymore
      const menu = ui.context.element;
      if (!menu?.isConnected || !menu.style.left) {
        if (remaining > 0)
          requestAnimationFrame(() => attempt(remaining - 1));
        return;
      }
      const left = alignedMenuLeft(
        toggle.getBoundingClientRect().right,
        menu.getBoundingClientRect().width
      );
      menu.style.left = `${left}px`;
    };
    requestAnimationFrame(() => attempt(frames));
  }

  static #tweaksSheetEntry(actor) {
    return findTweaksSheetEntry(
      Object.values(CONFIG.Actor?.sheetClasses?.[actor?.type] ?? {})
    );
  }

  // OSE exposes no Tweaks API: run the v1 sheet's own handler on a headless
  // instance (upstream-safe; position seeds the dialog over our window).
  static #onConfigureTweaks() {
    const entry = OscSheet.#tweaksSheetEntry(this.document);
    try {
      const { top, left, width } = this.position;
      const sheet = new entry.cls(this.document, { top, left, width });
      sheet._onConfigureActor(new Event("click"));
    } catch (err) {
      ui.notifications?.warn("Couldn't open the OSE Tweaks dialog.");
      console.error("osc-character-sheet | Tweaks invocation failed", err);
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // You can add additional context data here if needed
    context.rootId = this.rootId;
    context.initialProps = {
      actor: context.document,
      source: context.source,
      contextConnector: this.contextConnector,
    };
    return context;
  }

  static async #onEditImage(e, target) {
    if (target.nodeName !== "IMG") {
      throw new Error(
        "The editImage action is available only for IMG elements."
      );
    }
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document._source, attr);
    const defaultArtwork =
      this.document.constructor.getDefaultArtwork?.(this.document._source) ??
      {};
    const defaultImage = foundry.utils.getProperty(defaultArtwork, attr);
    const fp = new foundry.applications.apps.FilePicker.implementation({
      current,
      type: "image",
      redirectToRoot: defaultImage ? [defaultImage] : [],
      callback: (path) => {
        console.log("Selected image path:", attr, path);
        this.document.update({ [attr]: path });
      },
      position: {
        top: this.position.top + 40,
        left: this.position.left + 10,
      },
    });
    await fp.browse();
  }
}

// Pin the class name: Foundry registers sheets by it (`ose.OscSheet`), so
// minification mangling it would break registration and pinned sheetClass flags.
Object.defineProperty(OscSheet, "name", { value: "OscSheet" });

export default OscSheet;
