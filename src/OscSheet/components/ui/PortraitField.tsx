import { cx } from "./cx";
import { openImagePicker } from "./imagePicker";

/** @category Layout — framed portrait. Teal corner ticks, square via
 *  aspect-ratio. Click opens Foundry's FilePicker; the chosen path is returned
 *  via onPick (the caller persists it to actor.img). */
export function PortraitField({
  src,
  onPick,
  placeholder = "portrait",
  className,
  label = "Change portrait",
}: {
  src?: string;
  onPick: (path: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={cx("ed-portrait", className)}
      onClick={() => openImagePicker({ current: src, onPick })}
      title={label}
      aria-label={label}
    >
      {src ? (
        <img src={src} alt="" />
      ) : (
        <span className="ed-portrait-ph">{placeholder}</span>
      )}
    </button>
  );
}
