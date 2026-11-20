import { useState, type RefObject } from "react";
import { cx } from "@ui/cx";
import { useScrollsFurther } from "./useScrollsFurther";

const BOUNCE_SECONDS = 1.6;

type Props = {
  scroller: RefObject<HTMLElement | null>;
  contentKey: unknown;
  docked?: boolean;
};

export function MoreBelow({ scroller, contentKey, docked }: Props) {
  const scrollsFurther = useScrollsFurther(scroller, contentKey);
  const [offset] = useState(() => Math.random() * BOUNCE_SECONDS);
  if (!scrollsFurther) return null;
  return (
    <div
      className={cx(
        "osc-creation-more-below",
        docked && "osc-creation-more-below-docked",
      )}
    >
      <button
        type="button"
        className="osc-creation-more-below-button"
        aria-label="More below"
        onClick={() =>
          scroller.current?.scrollBy({
            top: scroller.current.clientHeight * 0.8,
            behavior: "smooth",
          })
        }
      >
        <i
          className="fa-solid fa-hand-point-down u-fs-lg osc-creation-more-below-hand"
          aria-hidden="true"
          style={{ animationDelay: `${-offset}s` }}
        />
      </button>
    </div>
  );
}
