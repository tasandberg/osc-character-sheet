import { cx } from "./cx";
import { rollable, type ActivateEvent } from "./rollable";
import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  intent?: "teal" | "crimson" | "forest" | "mustard" | "brass" | "solid" | "count";
  /** `chip` = the square, dark, icon-first weapon-tag box (default = pill). */
  variant?: "chip";
  /** `xs` = tighter, lower-profile pill (default = standard). */
  size?: "xs";
  /** FontAwesome glyph class (e.g. "fa-sword") rendered before the label. */
  icon?: string;
  /** Hover popover content (reuses the shared `.tag-pop` treatment). */
  tooltip?: ReactNode;
  /** When set, renders a trailing removable × button. */
  onRemove?: () => void;
  /** aria-label / title for the × button (e.g. `Remove Elvish`). */
  removeLabel?: string;
  onRoll?: (event: ActivateEvent) => void;
};

/** @category Display */
export function Tag({
  intent,
  variant,
  size,
  icon,
  tooltip,
  onRemove,
  removeLabel,
  onRoll,
  className,
  children,
  ...rest
}: Props) {
  return (
    <span
      className={cx(
        "tag",
        variant,
        intent,
        size,
        onRoll && "is-rollable",
        className,
      )}
      {...rollable(onRoll)}
      {...rest}
    >
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
