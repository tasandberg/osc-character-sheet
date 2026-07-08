import { getThemeSetting } from "@src/OscSheet/theme";
import { cx } from "@ui/cx";

// Renders enriched HTML in Foundry's theme scope so content colours resolve against our theme.
export function RichText({ html, className }: { html: string; className?: string }) {
  const fdTheme = getThemeSetting() === "cream" ? "theme-light" : "theme-dark";
  return (
    <div
      className={cx("osc-rich-text-body", "themed", fdTheme, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
