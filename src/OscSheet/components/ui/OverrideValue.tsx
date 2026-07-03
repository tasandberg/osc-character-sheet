import { cx } from "./cx";
import type { ReactNode } from "react";

/** @category Controls — the "rule default" affordance. Prints the default in
 *  mono; when overridden it becomes a teal dotted reset link. The caller wires
 *  onResetRequest to a ConfirmDialog (no native confirm). */
export function OverrideValue({
  overridden,
  defaultText,
  onResetRequest,
  align = "left",
  className,
}: {
  overridden: boolean;
  defaultText: ReactNode;
  onResetRequest: () => void;
  align?: "left" | "center";
  className?: string;
}) {
  if (!overridden) {
    return <span className={cx("hint", align === "center" && "ed-meta-center", className)}>{defaultText}</span>;
  }
  return (
    <button
      type="button"
      className={cx("ed-resetlink", align === "center" && "ed-meta-center", className)}
      title="Reset to rule default"
      onClick={onResetRequest}
    >
      {defaultText}
    </button>
  );
}
