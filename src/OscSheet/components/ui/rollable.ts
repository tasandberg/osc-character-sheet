import type { KeyboardEvent } from "react";

/** Props that turn any element into a keyboard-accessible click target.
 *  Returns nothing when there's no handler (read-only, e.g. Storybook stories). */
export function rollable(onActivate?: () => void) {
  if (!onActivate) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
