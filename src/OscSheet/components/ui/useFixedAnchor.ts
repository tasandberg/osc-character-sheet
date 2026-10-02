import { useLayoutEffect, type RefObject } from "react";
import {
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
} from "@floating-ui/dom";
import { useDismiss } from "./useDismiss";

export type Anchor = DOMRect | { x: number; y: number };

type Options = {
  placement?: Placement;
  gap?: number;
  onDismiss?: () => void;
  closeOnBlur?: boolean;
};

export function useFixedAnchor(
  ref: RefObject<HTMLElement | null>,
  anchor: Anchor,
  {
    placement = "bottom-start",
    gap = 0,
    onDismiss,
    closeOnBlur = false,
  }: Options = {},
) {
  const { x, y } = anchor;
  const width = "width" in anchor ? anchor.width : 0;
  const height = "height" in anchor ? anchor.height : 0;

  useDismiss(ref, onDismiss ?? (() => {}), {
    active: !!onDismiss,
    closeOnBlur,
  });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reference = {
      getBoundingClientRect: () => new DOMRect(x, y, width, height),
    };
    void computePosition(reference, element, {
      strategy: "fixed",
      placement,
      middleware: [offset(gap), flip(), shift({ padding: 8 })],
    }).then((position) =>
      Object.assign(element.style, {
        left: `${position.x}px`,
        top: `${position.y}px`,
      }),
    );
  }, [ref, x, y, width, height, placement, gap]);
}
