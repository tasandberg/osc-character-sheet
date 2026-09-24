import { it, expect, vi, afterEach } from "vitest";
import { installS3FolderPicker } from "@features/portraitImage/s3FolderPicker";

afterEach(() => vi.unstubAllGlobals());

const selectedFolder = async (activeSource: string, target: string) => {
  class Base {
    activeSource = activeSource;
    source = { bucket: "art", target };
    async _prepareContext() {
      return { isFolderPicker: true, selected: "untouched" };
    }
  }
  const CONFIG = { ux: { FilePicker: Base } };
  vi.stubGlobal("CONFIG", CONFIG);
  vi.stubGlobal("game", {
    data: {
      files: { s3: { endpoint: { protocol: "https:", host: "s3.aws.com" } } },
    },
  });
  installS3FolderPicker();
  return (await new CONFIG.ux.FilePicker()._prepareContext()).selected;
};

it.each([
  ["s3", "/worlds//w/osc/", "https://art.s3.aws.com/worlds/w/osc"],
  ["s3", "", "https://art.s3.aws.com/"],
  ["data", "worlds/w", "untouched"],
])("selects a %s folder %j as %s", async (source, target, selected) => {
  expect(await selectedFolder(source, target)).toBe(selected);
});
