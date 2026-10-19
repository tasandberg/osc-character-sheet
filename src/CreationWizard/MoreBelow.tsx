import type { RefObject } from "react";
import { useScrollsFurther } from "./useScrollsFurther";

type Props = { scroller: RefObject<HTMLElement | null>; contentKey: unknown };

export function MoreBelow({ scroller, contentKey }: Props) {
  const scrollsFurther = useScrollsFurther(scroller, contentKey);
  if (!scrollsFurther) return null;
  return (
    <div className="osc-creation-more-below">
      <button
        type="button"
        className="vm-btn vm-btn-secondary"
        onClick={() =>
          scroller.current?.scrollBy({
            top: scroller.current.clientHeight * 0.8,
            behavior: "smooth",
          })
        }
      >
        More below
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>
    </div>
  );
}
