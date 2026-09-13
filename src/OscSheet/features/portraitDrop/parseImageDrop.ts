export type ImageDrop =
  | { readonly kind: "file"; readonly file: File }
  | { readonly kind: "path"; readonly src: string };

export type ParsedImageDrop =
  ImageDrop | { readonly kind: "rejected"; readonly reason: string } | null;

export type DragKind = "file" | "path";

export type ImageTransfer = {
  readonly files: ArrayLike<File>;
  readonly types: readonly string[];
  getData(type: string): string;
};

const IMAGE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
]);

export function imageExtension(src: string): string | null {
  const path = src.split(/[?#]/, 1)[0] ?? "";
  const dot = path.lastIndexOf(".");
  if (dot <= 0 || dot < path.lastIndexOf("/")) return null;
  const ext = path.slice(dot + 1).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) ? ext : null;
}

export function isImagePath(src: string): boolean {
  return imageExtension(src) !== null;
}

function tileTextureSrc(text: string): string | null {
  if (!text.startsWith("{")) return null;
  try {
    const data = JSON.parse(text) as { texture?: { src?: unknown } };
    const src = data?.texture?.src;
    return typeof src === "string" ? src : null;
  } catch {
    return null;
  }
}

export function imagePathFromPayload(
  payload: string | null | undefined,
): string | null {
  const text = payload?.trim();
  if (!text) return null;
  const src = tileTextureSrc(text) ?? (text.startsWith("{") ? null : text);
  return src && isImagePath(src) ? src : null;
}

export function dragKind(
  types: readonly string[],
  cachedPayload: string | null,
  uploadReady: boolean,
): DragKind | null {
  const hasPath =
    types.includes("text/uri-list") ||
    (types.includes("text/plain") &&
      imagePathFromPayload(cachedPayload) !== null);
  if (types.includes("Files") && (uploadReady || !hasPath)) return "file";
  return hasPath ? "path" : null;
}

export type ParseImageDropOptions = {
  readonly preferFile: boolean;
  readonly origin?: string;
  readonly routePrefix?: string;
};

function firstUri(uriList: string): string | null {
  const line = uriList
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#"));
  return line ?? null;
}

function parseUrl(src: string): URL | null {
  try {
    return new URL(src);
  } catch {
    return null;
  }
}

function relativeToOrigin(
  src: string,
  origin: string | undefined,
  routePrefix: string | undefined,
): string {
  const url = origin ? parseUrl(src) : null;
  if (!url || url.origin !== origin) return src;
  const path = url.pathname.replace(/^\/+/, "");
  const prefix = routePrefix?.replace(/^\/+|\/+$/g, "");
  if (!prefix) return path;
  return path.startsWith(`${prefix}/`) ? path.slice(prefix.length + 1) : src;
}

function fileDrop(file: File): ParsedImageDrop {
  const isImage = file.type
    ? file.type.startsWith("image/")
    : isImagePath(file.name);
  return isImage
    ? { kind: "file", file }
    : { kind: "rejected", reason: `${file.name} is not an image` };
}

export function parseImageDrop(
  { preferFile, origin, routePrefix }: ParseImageDropOptions,
  transfer: ImageTransfer,
): ParsedImageDrop {
  const file = transfer.files[0];
  const uri = firstUri(transfer.getData("text/uri-list"));
  const textSrc = uri
    ? null
    : imagePathFromPayload(transfer.getData("text/plain"));
  if (file && (preferFile || (!uri && !textSrc))) return fileDrop(file);
  if (uri)
    return isImagePath(uri)
      ? { kind: "path", src: relativeToOrigin(uri, origin, routePrefix) }
      : { kind: "rejected", reason: "That link is not an image" };
  return textSrc
    ? { kind: "path", src: relativeToOrigin(textSrc, origin, routePrefix) }
    : null;
}
