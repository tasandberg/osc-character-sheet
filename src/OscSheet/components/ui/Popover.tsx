import { useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Placement } from "@floating-ui/dom";
import { cx } from "./cx";
import { RuleFrame } from "./RuleFrame";
import { useFixedAnchor, type Anchor } from "./useFixedAnchor";

type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  anchor: Anchor;
  placement?: Placement;
  gap?: number;
  onClose: () => void;
  label: string;
  inset?: string;
  children: ReactNode;
};

export function Popover({
  anchor,
  placement = "bottom-start",
  gap = 6,
  onClose,
  label,
  inset,
  className,
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useFixedAnchor(ref, anchor, { placement, gap, onDismiss: onClose });
  return (
    <RuleFrame
      ref={ref}
      role="dialog"
      aria-label={label}
      inset={inset}
      className={cx("popover u-bg u-paper", className)}
      {...rest}
    >
      {children}
    </RuleFrame>
  );
}
