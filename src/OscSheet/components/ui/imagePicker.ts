/** Opens Foundry's image FilePicker; the chosen path comes back via onPick. */
export function openImagePicker({
  current,
  onPick,
}: {
  current?: string;
  onPick: (path: string) => void;
}) {
  // foundry.applications.apps.FilePicker.implementation in v13+; fall back to the legacy global.
  const FP =
    (
      foundry as unknown as {
        applications?: {
          apps?: { FilePicker?: { implementation?: unknown } };
        };
      }
    ).applications?.apps?.FilePicker?.implementation ??
    (globalThis as unknown as { FilePicker?: unknown }).FilePicker;
  if (!FP) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (FP as any)({
    type: "image",
    current: current ?? "",
    callback: (path: string) => onPick(path),
  }).render(true);
}
