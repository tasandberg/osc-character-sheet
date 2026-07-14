import type { KeyboardEvent, MouseEvent } from "react";

/** Click or keyboard activation of a roll target; carries ctrl/meta for OSE's dialog check. */
export type ActivateEvent = MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>;

/** Props that turn any element into a keyboard-accessible click target.
 *  Returns nothing when there's no handler (read-only, e.g. Storybook stories). */
export function rollable(onActivate?: (event: ActivateEvent) => void) {
  if (!onActivate) return {};
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(e);
      }
    },
  };
}
