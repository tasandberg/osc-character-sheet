import { cx } from "@ui/cx";

export function RichText({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={cx("osc-rich-text-body", "tw:select-text", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
