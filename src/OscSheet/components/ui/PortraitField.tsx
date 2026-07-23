import { cx } from "./cx";

/** @category Layout — framed portrait. Teal corner ticks, square via
 *  aspect-ratio. Click opens Foundry's FilePicker; the chosen path is returned
 *  via onPick (the caller persists it to actor.img). */
export function PortraitField({
  src,
  onPick,
  placeholder = "portrait",
  className,
}: {
  src?: string;
  onPick: (path: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const openPicker = () => {
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
      current: src ?? "",
      callback: (path: string) => onPick(path),
    }).render(true);
  };

  return (
    <button
      type="button"
      className={cx("ed-portrait", className)}
      onClick={openPicker}
      title="Change portrait"
      aria-label="Change portrait"
    >
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span className="ed-portrait-ph">{placeholder}</span>
      )}
    </button>
  );
}
