import type { ReactNode } from "react";
import { HoverPop, type HoverPopAlign } from "./HoverPop";
import { cx } from "./cx";

export const TIP_TEXT =
  "tw:font-sans tw:font-normal tw:text-left tw:whitespace-normal tw:normal-case tw:tracking-normal u-fs-xs u-text-dim";

export function HoverTip({
  align = "center",
  className,
  children,
}: {
  align?: HoverPopAlign;
  className?: string;
  children: ReactNode;
}) {
  return (
    <HoverPop
      align={align}
      className={cx(TIP_TEXT, "tw:max-w-[18rem] u-px-2 u-py-1 u-r-sm", className)}
    >
      {children}
    </HoverPop>
  );
}
