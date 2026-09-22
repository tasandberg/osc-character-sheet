import { getSetting } from "@src/OscSheet/settings";
import { imageExtension } from "./parseImageDrop";
import {
  dirtyPortraitImageKeys,
  type ActorImages,
  type ImageSlot,
  type PortraitImageDirty,
  type PortraitImageState,
} from "./portraitImageState";
import {
  ensureUploadFolder,
  filePicker,
  uploadTarget,
  type UploadResponse,
} from "./uploadFolder";

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

export type PortraitImageActor = {
  readonly name: string;
  readonly img: string | null;
  readonly prototypeToken: {
    readonly texture: { readonly src: string | null };
  };
  update(data: Record<string, unknown>): Promise<unknown>;
  getDependentTokens(options: {
    linked: boolean;
    concreteOnly: boolean;
  }): Iterable<DependentToken>;
};

export type PortraitImageResult = PortraitImageDirty & {
  readonly placedTokens: number;
};

export class PortraitUploadReportedError extends Error {
  constructor() {
    super("Portrait upload failed");
    this.name = "PortraitUploadReportedError";
  }
}

export function actorPortraitImages(actor: PortraitImageActor): ActorImages {
  return {
    portrait: actor.img ?? "",
    token: actor.prototypeToken.texture.src ?? "",
  };
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

async function uploadStagedFile(
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
  actor: PortraitImageActor,
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

export function portraitImageToast(
  changed: PortraitImageDirty,
  placedTokens: number,
): { title: string; message?: string } | null {
  if (!changed.portrait && !changed.token) return null;
  const title =
    changed.portrait && changed.token
      ? "Portrait and token updated"
      : changed.portrait
        ? "Portrait updated"
        : "Token updated";
  if (placedTokens <= 0) return { title };
  const noun = placedTokens === 1 ? "token" : "tokens";
  return { title, message: `Also updated ${placedTokens} placed ${noun}` };
}

export async function applyPortraitImage(
  actor: PortraitImageActor,
  state: PortraitImageState,
): Promise<PortraitImageResult> {
  const changed = dirtyPortraitImageKeys(state, actorPortraitImages(actor));
  if (!changed.portrait && !changed.token)
    return { ...changed, placedTokens: 0 };

  const sources = new Map<string | File, string>();
  const resolve = async (slot: ImageSlot): Promise<string> => {
    const key = slot.kind === "path" ? `path:${slot.src}` : slot.file;
    const done = sources.get(key);
    if (done !== undefined) return done;
    const src =
      slot.kind === "path"
        ? slot.src
        : await uploadStagedFile(actor.name, slot.file);
    sources.set(key, src);
    return src;
  };

  const update: Record<string, string> = {};
  if (changed.portrait) update.img = await resolve(state.portrait);
  const tokenSrc = changed.token ? await resolve(state.token) : null;
  if (tokenSrc !== null) update["prototypeToken.texture.src"] = tokenSrc;
  await actor.update(update);

  const placedTokens =
    tokenSrc !== null && state.updatePlaced
      ? await updateLinkedTokens(actor, tokenSrc)
      : 0;
  return { ...changed, placedTokens };
}
