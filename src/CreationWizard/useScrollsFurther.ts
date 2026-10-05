import { useEffect, useState, type RefObject } from "react";

export function useScrollsFurther(
  ref: RefObject<HTMLElement | null>,
  contentKey: unknown,
) {
  const [scrollsFurther, setScrollsFurther] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setScrollsFurther(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(el);
    for (const child of el.children) observer?.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [ref, contentKey]);
  return scrollsFurther;
}
