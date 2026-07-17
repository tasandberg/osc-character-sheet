import { cx } from "./cx";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  intent?: "teal" | "crimson" | "forest" | "mustard" | "brass" | "solid" | "count";
  /** `chip` = the square, dark, icon-first weapon-tag box (default = pill). */
  variant?: "chip";
  /** FontAwesome glyph class (e.g. "fa-sword") rendered before the label. */
  icon?: string;
  /** Hover popover content (reuses the shared `.tag-pop` treatment). */
  tooltip?: ReactNode;
  /** When set, renders a trailing removable × button. */
  onRemove?: () => void;
  /** aria-label / title for the × button (e.g. `Remove Elvish`). */
  removeLabel?: string;
};

/** @category Display */
export function Tag({
  intent,
  variant,
  icon,
  tooltip,
  onRemove,
  removeLabel,
  className,
  children,
  ...rest
}: Props) {
  return (
    <span className={cx("tag", variant, intent, className)} {...rest}>
      {icon && <i className={cx("fa-solid", icon)} aria-hidden="true" />}
      {children}
      {tooltip != null && (
        <span className="tag-pop" role="tooltip">
          {tooltip}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          className="osc-lang-x"
          title={removeLabel}
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <i className="fas fa-xmark" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
