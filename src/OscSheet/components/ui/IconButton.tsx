import { cx } from "./cx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Hover/intent treatment. Default = neutral (faint → text-dim). */
  variant?: "danger" | "accent" | "round";
  /** Compact 18px box for inline carets / × / trash glyphs. */
  size?: "sm";
  /** Toggled/active state (e.g. an edit-mode pen). */
  on?: boolean;
};

/**
 * Icon-only button — a transparent square wrapping a single glyph (FontAwesome
 * `<i>` or a character). The canonical replacement for the hand-rolled
 * `.ft-chev` / `.ft-del` / `.osc-feat-add` / `.osc-lang-go` / `.sp-trash` one-offs.
 * Styling lives in `.icon-btn` (components.css), which is auto-scoped under
 * `.osc-sheet` so it beats the `.osc-sheet-app button` reset.
 *
 * @category Controls
 */
export function IconButton({ variant, size, on, className, type = "button", ...rest }: Props) {
  return (
    <button type={type} className={cx("icon-btn", variant, size, on && "on", className)} {...rest} />
  );
}
