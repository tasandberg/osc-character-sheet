import type { Locator, Page } from "@playwright/test";
import { test as fighterTest, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

declare const game: any;

const MODULE_ID = "osc-character-sheet";
const SKULL = "icons/svg/skull.svg";
const PNG_1X1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const test = fighterTest.extend<{ uploadFolder: string }>({
  uploadFolder: async ({ gamePage }, use) => {
    const set = (values: Record<string, unknown>) =>
      gamePage.evaluate(
        async ({ mod, values }) => {
          const keys = Object.keys(values);
          const before = Object.fromEntries(
            keys.map((k) => [k, game.settings.get(mod, k)]),
          );
          for (const k of keys) await game.settings.set(mod, k, values[k]);
          return before;
        },
        { mod: MODULE_ID, values },
      );
    const folder = await gamePage.evaluate(
      () => `worlds/${game.world.id}/osc-portraits`,
    );
    const restore = await set({
      portraitUploads: true,
      portraitUploadPath: folder,
    });
    await use(folder);
    await set(restore).catch(() => {});
  },
});

test.describe.configure({ mode: "default" });

async function dropOnZone(sheet: Locator, target: string, tileSrc?: string) {
  await sheet.evaluate(
    async (root, { target, tileSrc, png }) => {
      const dt = new DataTransfer();
      if (tileSrc)
        dt.setData("text/plain", JSON.stringify({ texture: { src: tileSrc } }));
      else
        dt.items.add(
          new File(
            [Uint8Array.from(atob(png), (c) => c.charCodeAt(0))],
            "hero.png",
            { type: "image/png" },
          ),
        );
      const fire = (el: Element, ...types: string[]) =>
        types.forEach((type) =>
          el.dispatchEvent(
            new DragEvent(type, {
              bubbles: true,
              cancelable: true,
              dataTransfer: dt,
            }),
          ),
        );
      fire(document.body, "dragstart");
      fire(
        root.querySelector('[data-testid="sheet-image-drop"]')!,
        "dragenter",
        "dragover",
      );
      const selector = `[data-testid="image-drop-zone"][data-target="${target}"]`;
      for (let i = 0; i < 50 && !root.querySelector(selector); i++)
        await new Promise(requestAnimationFrame);
      fire(root.querySelector(selector)!, "dragenter", "dragover", "drop");
      fire(document.body, "dragend");
    },
    { target, tileSrc, png: PNG_1X1 },
  );
}

const images = (page: Page, actorId: string, sceneId?: string) =>
  page.evaluate(
    ({ actorId, sceneId }) => {
      const actor = game.actors.get(actorId);
      const placed = game.scenes.get(sceneId)?.tokens.contents[0];
      return [actor.img, actor.prototypeToken.texture.src, placed?.texture.src];
    },
    { actorId, sceneId },
  );

const saveDialog = async (sheet: Locator, placed = false) => {
  const dialog = sheet
    .locator(".modal")
    .filter({ hasText: "Portrait & token image" });
  if (placed) await dialog.getByText("Update tokens already on scenes").click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toHaveCount(0, { timeout: 30_000 });
};

test("a file dropped on Set both uploads to the portrait and token", async ({
  gamePage,
  fighter,
  uploadFolder: folder,
}) => {
  const sheet = await openCharacterSheet(gamePage, fighter.name);
  await dropOnZone(sheet, "both");
  await saveDialog(sheet);

  const [img, token] = await images(gamePage, fighter.id);
  expect(img).toMatch(new RegExp(`^${folder}/.+\\.png$`));
  expect(token).toBe(img);
});

test("an image dropped on Set token retextures linked tokens on scenes", async ({
  gamePage,
  fighter,
}) => {
  const sceneId = await gamePage.evaluate(async (actorId) => {
    const scene = await (globalThis as any).Scene.create({
      name: `E2E Portrait ${actorId}`,
    });
    const token = await game.actors
      .get(actorId)
      .getTokenDocument({ actorLink: true }, { parent: scene });
    await scene.createEmbeddedDocuments("Token", [token.toObject()]);
    return scene.id as string;
  }, fighter.id);

  try {
    const [img] = await images(gamePage, fighter.id);
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    await dropOnZone(sheet, "token", SKULL);
    await saveDialog(sheet, true);
    await expect
      .poll(() => images(gamePage, fighter.id, sceneId))
      .toEqual([img, SKULL, SKULL]);
  } finally {
    await gamePage
      .evaluate((id) => game.scenes.get(id)?.delete(), sceneId)
      .catch(() => {});
  }
});
