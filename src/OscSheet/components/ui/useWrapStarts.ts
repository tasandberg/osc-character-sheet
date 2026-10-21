import { useLayoutEffect, type RefObject } from "react";

export function useWrapStarts(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mark = () => {
      let prev: HTMLElement | undefined;
      for (const child of Array.from(el.children) as HTMLElement[]) {
        const wraps =
          !!prev && child.offsetTop >= prev.offsetTop + prev.offsetHeight - 1;
        child.toggleAttribute("data-wrap-start", wraps);
        prev = child;
      }
    };
    mark();
    const observer = new ResizeObserver(mark);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}
