// The one hover-popover shell: shown while its TRIGGER (this element's parent) is
// hovered/focused, pinned with `position: fixed` in JS off the trigger's rect.
//
// Fixed is load-bearing, not a style choice: an ancestor with `overflow-y: auto`
// computes `overflow-x` as a clip box too, and a normally-positioned absolute child
// can never escape it — that clipped the equipped-item card at the sheet body's left
// edge. Fixed (no transformed ancestor — verified for the sheet shell; `container-type`
// on the sheet body does NOT capture fixed descendants) renders in full instead.
//
// Closed = `visibility: hidden`, not `display: none`, so the card is measurable before
// it is shown — that measurement is what lets `align="center"` and the viewport clamp
// place it in one pass.
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cx } from "./cx";

// trigger bottom → card top. 11 not 6: the arrow reaches ~7px above the card, so this
// leaves ~4px of air under the trigger.
const GAP = 11;
const EDGE = 8; // smallest gap the card keeps from the sheet's (or viewport's) edge

const HIDDEN: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  visibility: "hidden",
};

export type HoverPopAlign = "start" | "center";

export function HoverPop({
  className,
  align = "start",
  role = "tooltip",
  children,
}: {
  className?: string;
  /** `start` = card's left edge on the trigger's; `center` = centred under it. */
  align?: HoverPopAlign;
  role?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState<CSSProperties>(HIDDEN);

  useEffect(() => {
    const pop = ref.current;
    const trigger = pop?.parentElement;
    if (!pop || !trigger) return;
    let open = false;
    const place = () => {
      const r = trigger.getBoundingClientRect();
      const w = pop.offsetWidth;
      const wanted = align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
      // stay inside the sheet window (fixed can leave it — it just isn't clipped)
      const host = trigger.closest(".osc-sheet-app")?.getBoundingClientRect();
      const min = (host?.width ? host.left : 0) + EDGE;
      const right = host?.width ? host.right : window.innerWidth;
      const left = Math.min(Math.max(wanted, min), Math.max(min, right - w - EDGE));
      setStyle({
        position: "fixed",
        top: r.bottom + GAP,
        left,
        // keeps an arrow under the trigger's centre even when the card is clamped
        "--anchor-x": `${r.left + r.width / 2 - left}px`,
      } as CSSProperties);
    };
    const show = () => {
      open = true;
      place();
    };
    const hide = () => {
      open = false;
      setStyle(HIDDEN);
    };
    const reposition = () => {
      if (open) place();
    };
    trigger.addEventListener("pointerenter", show);
    trigger.addEventListener("pointerleave", hide);
    trigger.addEventListener("focusin", show);
    trigger.addEventListener("focusout", hide);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      trigger.removeEventListener("pointerenter", show);
      trigger.removeEventListener("pointerleave", hide);
      trigger.removeEventListener("focusin", show);
      trigger.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [align]);

  return (
    <span
      className={cx("osc-hoverpop", className)}
      role={role}
      ref={ref}
      style={style}
      data-open={style.visibility === "hidden" ? undefined : ""}
    >
      {children}
    </span>
  );
}
