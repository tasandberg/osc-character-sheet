import { useEffect, useState, type RefObject } from "react";

export function useScrollsFurther(
  ref: RefObject<HTMLElement | null>,
  contentKey: unknown,
) {
  const [scrollsFurther, setScrollsFurther] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let reachedBottom = false;
    const further = () => el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    const update = () => setScrollsFurther(!reachedBottom && further());
    const onScroll = () => {
      if (!further()) reachedBottom = true;
      update();
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(update);
    observer?.observe(el);
    for (const child of el.children) observer?.observe(child);
    const mutations =
      typeof MutationObserver === "undefined"
        ? undefined
        : new MutationObserver(update);
    mutations?.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [ref, contentKey]);
  return scrollsFurther;
}
