import { getSetting, subscribeToSetting } from "@src/OscSheet/settings";

type UploadOptions = { readonly bucket?: string };

type UploadTarget = {
  readonly source: string;
  readonly path: string;
  readonly options: UploadOptions;
};

type S3Match = {
  readonly groups?: { readonly bucket?: string; readonly key?: string };
} | null;

type CreateDirectory = (
  source: string,
  target: string,
  options: UploadOptions,
) => Promise<unknown>;

export type UploadResponse =
  { status?: string; message?: string; path?: string } | false | void;

type FilePickerApi = {
  createDirectory: CreateDirectory;
  matchS3URL(url: string): S3Match;
  upload(
    source: string,
    path: string,
    file: File,
    body: UploadOptions,
    options: { notify: boolean },
  ): Promise<UploadResponse>;
};

type FoundryGlobals = {
  foundry: {
    applications: { apps: { FilePicker: { implementation: FilePickerApi } } };
  };
  game?: { user?: { isGM?: boolean } };
  ui?: { notifications?: { error(message: string): void } };
};

const globals = () => globalThis as unknown as FoundryGlobals;

export const filePicker = (): FilePickerApi =>
  globals().foundry.applications.apps.FilePicker.implementation;

const ALREADY_EXISTS = /EEXIST|already exists/;

function directoryChain(path: string): string[] {
  const parts = path.split("/").filter(Boolean);
  return parts.map((_, i) => parts.slice(0, i + 1).join("/"));
}

export function uploadTarget(path: string, s3: S3Match): UploadTarget {
  const bucket = s3?.groups?.bucket;
  return bucket
    ? { source: "s3", path: s3.groups.key ?? "", options: { bucket } }
    : { source: "data", path, options: {} };
}

export async function ensureUploadFolder(
  target: UploadTarget,
  createDirectory: CreateDirectory,
): Promise<void> {
  for (const dir of directoryChain(target.path)) {
    try {
      await createDirectory(target.source, dir, target.options);
    } catch (error) {
      if (error instanceof Error && ALREADY_EXISTS.test(error.message))
        continue;
      throw error;
    }
  }
}

export async function syncPortraitUploadFolder(): Promise<void> {
  const { game, ui } = globals();
  const folder = getSetting("portraitUploadPath").trim();
  if (!game?.user?.isGM || !getSetting("portraitUploads") || !folder) return;
  const picker = filePicker();
  try {
    await ensureUploadFolder(
      uploadTarget(folder, picker.matchS3URL(folder)),
      (source, dir, options) => picker.createDirectory(source, dir, options),
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    ui?.notifications?.error(
      `Couldn't create the portrait upload folder ${folder}: ${reason}`,
    );
  }
}

export function watchPortraitUploadFolder(): () => void {
  const sync = () => void syncPortraitUploadFolder();
  const stops = [
    subscribeToSetting("portraitUploads", sync),
    subscribeToSetting("portraitUploadPath", sync),
  ];
  return () => stops.forEach((stop) => stop());
}
