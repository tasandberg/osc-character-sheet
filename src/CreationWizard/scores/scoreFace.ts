import { cx } from "@ui/cx";

export const formatModifier = (mod: number) =>
  mod < 0 ? `−${Math.abs(mod)}` : `+${mod}`;

export function scoreFaceClass(...modifiers: (string | false | undefined)[]) {
  return cx("vm-score-face vm-score-face-sunk", ...modifiers);
}
