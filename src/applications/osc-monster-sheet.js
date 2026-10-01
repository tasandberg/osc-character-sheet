import OscMonsterSheetApp from "@src/OscMonsterSheet";
import OscSheet from "@src/applications/osc-sheet";

class OscMonsterSheet extends OscSheet {
  reactApp = OscMonsterSheetApp;

  static DEFAULT_OPTIONS = {
    window: { title: "OSC Monster Sheet" },
    classes: ["osc-monster-sheet"],
    position: { width: 520, height: 680 },
  };

  async _onDropDocument(event, document) {
    if (document?.documentName !== "RollTable") {
      return super._onDropDocument(event, document);
    }
    if (!this.isEditable) return null;
    const link = document.pack
      ? `@UUID[${document.uuid}]{${document.name}}`
      : `@UUID[${document.uuid}]`;
    await this.actor.update({ "system.details.treasure.table": link });
    return document;
  }
}

Object.defineProperty(OscMonsterSheet, "name", { value: "OscMonsterSheet" });

export default OscMonsterSheet;
