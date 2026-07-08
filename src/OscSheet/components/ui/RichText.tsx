import { getThemeSetting } from "@src/OscSheet/theme";
import { cx } from "@ui/cx";

/**
 * Canonical long-form prose renderer for enriched rich-text HTML (Notes,
 * ability descriptions, …). Single source of truth for rendered prose.
 *
 * Wraps content in Foundry's theme scope (`.themed.theme-{light,dark}`) so the
 * enricher's content-link / prose colours resolve against OUR sheet theme —
 * without it, content inherits Foundry's light-theme dark text (black-on-dark).
 * Applies the shared `.osc-rich-text-body` prose style. Pass already-enriched HTML.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  const fdTheme = getThemeSetting() === "cream" ? "theme-light" : "theme-dark";
  return (
    <div
      className={cx("osc-rich-text-body", "themed", fdTheme, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
