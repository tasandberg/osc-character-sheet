import { getSetting } from "@src/OscSheet/settings";
import { imageExtension, type ImageDrop } from "./parseImageDrop";
import {
  ensureUploadFolder,
  filePicker,
  uploadTarget,
  type UploadResponse,
} from "./uploadFolder";

export type ApplyTarget = "portrait" | "token" | "both";
export type TokenScope = "prototype" | "all";
export type PortraitDropChoice = {
  readonly target: ApplyTarget;
  readonly tokens: TokenScope;
};

type SceneLike = {
  readonly name: string;
  updateEmbeddedDocuments(
    type: "Token",
    updates: Record<string, unknown>[],
  ): Promise<unknown>;
};

type DependentToken = {
  readonly id: string | null;
  readonly parent: SceneLike | null;
};

export type PortraitDropActor = {
  readonly name: string;
  update(data: Record<string, unknown>): Promise<unknown>;
  getDependentTokens(options: {
    linked: boolean;
    concreteOnly: boolean;
  }): Iterable<DependentToken>;
};

export class PortraitUploadReportedError extends Error {
  constructor() {
    super("Portrait upload failed");
    this.name = "PortraitUploadReportedError";
  }
}

export function uploadedPath(
  response: UploadResponse,
  fileName: string,
  folder: string,
): string {
  if (response === false) throw new PortraitUploadReportedError();
  const path = response ? response.path : undefined;
  if (!path) throw new Error(`Couldn't upload ${fileName} to ${folder}`);
  return path;
}

const randomID = () =>
  (
    globalThis as unknown as { foundry: { utils: { randomID(): string } } }
  ).foundry.utils.randomID();

export function portraitUploadFilename(
  actorName: string,
  fileName: string,
  id: string,
): string {
  const slug =
    actorName
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "portrait";
  return `${slug}-${id}.${imageExtension(fileName) ?? "png"}`;
}

export function actorImageUpdate(
  src: string,
  target: ApplyTarget,
): Record<string, string> {
  return {
    ...(target !== "token" ? { img: src } : {}),
    ...(target !== "portrait" ? { "prototypeToken.texture.src": src } : {}),
  };
}

export function tokenUpdatesByScene<S>(
  tokens: Iterable<{ readonly id: string | null; readonly parent: S | null }>,
  src: string,
): Map<S, Record<string, unknown>[]> {
  const grouped = new Map<S, Record<string, unknown>[]>();
  for (const token of tokens) {
    if (!token.parent) continue;
    const updates = grouped.get(token.parent) ?? [];
    updates.push({ _id: token.id, "texture.src": src });
    grouped.set(token.parent, updates);
  }
  return grouped;
}

async function uploadDroppedFile(
  actorName: string,
  file: File,
): Promise<string> {
  const folder = getSetting("portraitUploadPath").trim();
  if (!folder) throw new Error("No portrait upload folder is configured");
  const picker = filePicker();
  const target = uploadTarget(folder, picker.matchS3URL(folder));
  await ensureUploadFolder(target, (source, dir, options) =>
    picker.createDirectory(source, dir, options),
  ).catch(() => undefined);
  const named = new File(
    [file],
    portraitUploadFilename(actorName, file.name, randomID()),
    { type: file.type },
  );
  const response = await picker.upload(
    target.source,
    target.path,
    named,
    target.options,
    { notify: false },
  );
  return uploadedPath(response, file.name, folder);
}

async function updateLinkedTokens(
  actor: PortraitDropActor,
  src: string,
): Promise<number> {
  const tokens = actor.getDependentTokens({ linked: true, concreteOnly: true });
  let updated = 0;
  for (const [scene, updates] of tokenUpdatesByScene(tokens, src)) {
    try {
      await scene.updateEmbeddedDocuments("Token", updates);
      updated += updates.length;
    } catch (error) {
      console.error(`Couldn't update tokens in scene ${scene.name}`, error);
    }
  }
  return updated;
}

const TOAST_TITLES: Record<ApplyTarget, string> = {
  portrait: "Portrait updated",
  token: "Token updated",
  both: "Portrait and token updated",
};

export function portraitDropToast(
  target: ApplyTarget,
  placedTokens: number,
): { title: string; message?: string } {
  const title = TOAST_TITLES[target];
  if (placedTokens <= 0) return { title };
  const noun = placedTokens === 1 ? "token" : "tokens";
  return { title, message: `Also updated ${placedTokens} placed ${noun}` };
}

export async function applyPortraitDrop(
  actor: PortraitDropActor,
  drop: ImageDrop,
  choice: PortraitDropChoice,
): Promise<number> {
  const src =
    drop.kind === "path"
      ? drop.src
      : await uploadDroppedFile(actor.name, drop.file);
  await actor.update(actorImageUpdate(src, choice.target));
  if (choice.target === "portrait" || choice.tokens !== "all") return 0;
  return updateLinkedTokens(actor, src);
}
