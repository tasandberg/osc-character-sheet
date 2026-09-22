type S3Endpoint = {
  readonly protocol: string;
  readonly host: string;
};

type FilePickerContext = {
  isFolderPicker?: boolean;
  selected?: string;
};

type FilePickerInstance = {
  readonly activeSource: string;
  readonly source: {
    readonly bucket?: string | null;
    readonly target: string;
  };
  _prepareContext(options: unknown): Promise<FilePickerContext>;
};

type FilePickerClass = new (...args: never[]) => FilePickerInstance;

type FoundryGlobals = {
  CONFIG: { ux: { FilePicker: FilePickerClass } };
  game?: { data?: { files?: { s3?: { endpoint?: S3Endpoint } } } };
};

const globals = () => globalThis as unknown as FoundryGlobals;

export function s3FolderUrl(
  endpoint: S3Endpoint | null | undefined,
  bucket: string | null | undefined,
  key: string,
): string | null {
  if (!endpoint || !bucket) return null;
  const path = key.split("/").filter(Boolean).join("/");
  return `${endpoint.protocol}//${bucket}.${endpoint.host}/${path}`;
}

export function installS3FolderPicker(): void {
  const { CONFIG } = globals();
  const Base = CONFIG.ux.FilePicker;
  CONFIG.ux.FilePicker = class extends Base {
    async _prepareContext(options: unknown): Promise<FilePickerContext> {
      const context = await super._prepareContext(options);
      if (context.isFolderPicker && this.activeSource === "s3") {
        const url = s3FolderUrl(
          globals().game?.data?.files?.s3?.endpoint,
          this.source.bucket,
          this.source.target,
        );
        if (url) context.selected = url;
      }
      return context;
    }
  };
}
