import type { Locator, Page } from "@playwright/test";
import { test as fighterTest, expect } from "../fixtures";
import { openCharacterSheet } from "../helpers";

declare const game: any;

const MODULE_ID = "osc-character-sheet";
const PATH_IMAGE = "icons/svg/skull.svg";
const PNG_1X1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

type PortraitSettings = {
  portraitUploads?: boolean;
  portraitUploadPath?: string;
};

type DragSource = { kind: "file" } | { kind: "tile"; src: string };

const test = fighterTest.extend<{
  portraitSettings: (values: PortraitSettings) => Promise<void>;
}>({
  portraitSettings: async ({ gamePage }, use) => {
    const originals = new Map<string, unknown>();
    await use(async (values) => {
      await gamePage
        .evaluate(
          async ({ mod, entries, known }) => {
            const saved: Record<string, unknown> = {};
            for (const [key, value] of entries) {
              if (!known.includes(key))
                saved[key] = game.settings.get(mod, key);
              await game.settings.set(mod, key, value);
            }
            return saved;
          },
          {
            mod: MODULE_ID,
            entries: Object.entries(values),
            known: [...originals.keys()],
          },
        )
        .then((saved) => {
          for (const [key, value] of Object.entries(saved))
            originals.set(key, value);
        });
    });
    await gamePage
      .evaluate(
        async ({ mod, entries }) => {
          for (const [key, value] of entries)
            await game.settings.set(mod, key, value);
        },
        { mod: MODULE_ID, entries: [...originals.entries()] },
      )
      .catch(() => {});
  },
});

test.describe.configure({ mode: "default" });

async function dragOverSheet(
  over: Locator,
  source: DragSource,
  png = PNG_1X1,
): Promise<void> {
  await over.evaluate(
    (el, { source, png }) => {
      const dt = new DataTransfer();
      if (source.kind === "file") {
        const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
        dt.items.add(new File([bytes], "hero.png", { type: "image/png" }));
      } else {
        dt.setData(
          "text/plain",
          JSON.stringify({
            type: "Tile",
            texture: { src: source.src },
            fromFilePicker: true,
          }),
        );
      }
      (globalThis as any).__e2ePortraitDrag = dt;
      const fire = (target: Element, type: string) =>
        target.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer: dt,
          }),
        );
      fire(document.body, "dragstart");
      fire(el, "dragenter");
      fire(el, "dragover");
    },
    { source, png },
  );
}

async function dropOnSheet(over: Locator): Promise<void> {
  await over.evaluate((el) => {
    const g = globalThis as any;
    const dt = g.__e2ePortraitDrag as DataTransfer;
    delete g.__e2ePortraitDrag;
    el.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }),
    );
    document.body.dispatchEvent(
      new DragEvent("dragend", {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
      }),
    );
  });
}

type ActorImages = { img: string; token: string };

function actorImages(page: Page, id: string): Promise<ActorImages> {
  return page.evaluate((actorId) => {
    const actor = game.actors.get(actorId);
    return {
      img: actor.img as string,
      token: actor.prototypeToken.texture.src as string,
    };
  }, id);
}

function sheetDropTarget(sheet: Locator): Locator {
  return sheet.locator('[data-testid="sheet-image-drop"]');
}

function dropIndicators(sheet: Locator): Locator {
  return sheet.locator('[data-testid="portrait-drop-indicator"]');
}

function portraitDialog(sheet: Locator): Locator {
  return sheet.locator(".modal").filter({ hasText: "Portrait image" });
}

function segment(dialog: Locator, group: string, label: string): Locator {
  return dialog
    .getByRole("group", { name: group })
    .getByRole("button", { name: label, exact: true });
}

test.describe("sheet image drop", () => {
  test("file drop with uploads enabled uploads and sets portrait and prototype token", async ({
    gamePage,
    fighter,
    portraitSettings,
  }) => {
    const currentPath = await gamePage.evaluate(
      (mod) =>
        String(game.settings.get(mod, "portraitUploadPath") ?? "").trim(),
      MODULE_ID,
    );
    const folder =
      currentPath ||
      (await gamePage.evaluate(() => `worlds/${game.world.id}/osc-portraits`));
    await portraitSettings({
      portraitUploads: true,
      portraitUploadPath: folder,
    });
    const before = await actorImages(gamePage, fighter.id);
    const sheet = await openCharacterSheet(gamePage, fighter.name);
    const target = sheetDropTarget(sheet);

    await dragOverSheet(target, { kind: "file" });
    await expect(target).toHaveAttribute("data-drop", "ready");
    await dropOnSheet(target);
    await expect(dropIndicators(sheet)).toHaveCount(0);

    const dialog = portraitDialog(sheet);
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("img", { name: "Dropped image" }),
    ).toHaveAttribute("src", /^blob:/);
    await expect(segment(dialog, "Apply to", "Set both")).toHaveClass(/\bon\b/);
    await expect(segment(dialog, "Tokens", "Prototype only")).toHaveClass(
      /\bon\b/,
    );
    expect(await actorImages(gamePage, fighter.id)).toEqual(before);

    await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
    await expect
      .poll(async () => (await actorImages(gamePage, fighter.id)).img)
      .not.toBe(before.img);

    const after = await actorImages(gamePage, fighter.id);
    const prefix = `${folder.replace(/\/+$/, "")}/`;
    expect(
      after.img.startsWith(prefix),
      `${after.img} should be under ${prefix}`,
    ).toBe(true);
    expect(after.img).toMatch(/\.png$/);
    expect(after.token).toBe(after.img);
  });

  test("Prototype + linked tokens also retextures linked placed tokens", async ({
    gamePage,
    fighter,
    portraitSettings,
  }) => {
    await portraitSettings({ portraitUploads: false });
    const sceneName = `E2E Portrait Scene ${fighter.name}`;
    const { sceneId, tokenId } = await gamePage.evaluate(
      async ({ name, actorId }) => {
        const scene = await (globalThis as any).Scene.create({
          name,
          width: 1000,
          height: 1000,
        });
        const draft = await game.actors
          .get(actorId)
          .getTokenDocument(
            { x: 100, y: 100, actorLink: true },
            { parent: scene },
          );
        const [token] = await scene.createEmbeddedDocuments("Token", [
          draft.toObject(),
        ]);
        return { sceneId: scene.id as string, tokenId: token.id as string };
      },
      { name: sceneName, actorId: fighter.id },
    );

    try {
      const placedSrc = () =>
        gamePage.evaluate(
          ({ s, t }) =>
            game.scenes.get(s)?.tokens.get(t)?.texture.src as
              string | undefined,
          { s: sceneId, t: tokenId },
        );
      expect(await placedSrc()).not.toBe(PATH_IMAGE);

      const sheet = await openCharacterSheet(gamePage, fighter.name);
      const target = sheetDropTarget(sheet);
      await dragOverSheet(target, { kind: "tile", src: PATH_IMAGE });
      await dropOnSheet(target);
      await expect(dropIndicators(sheet)).toHaveCount(0);

      const dialog = portraitDialog(sheet);
      await expect(dialog).toBeVisible();
      await segment(dialog, "Tokens", "Prototype + linked tokens").click();
      await expect(
        segment(dialog, "Tokens", "Prototype + linked tokens"),
      ).toHaveClass(/\bon\b/);
      await dialog
        .getByRole("button", { name: "Confirm", exact: true })
        .click();
      await expect(dialog).toHaveCount(0);

      await expect
        .poll(() => actorImages(gamePage, fighter.id))
        .toEqual({ img: PATH_IMAGE, token: PATH_IMAGE });
      await expect.poll(placedSrc).toBe(PATH_IMAGE);
    } finally {
      await gamePage
        .evaluate((id) => game.scenes.get(id)?.delete(), sceneId)
        .catch(() => {});
    }
  });
});
