import { useLayoutEffect, useRef } from "react";
import type { IdentityVM } from "@domain/vm-types";

function useFitText(text: string, min = 0.6) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.setProperty("--fit-scale", "1");
      const avail = el.clientWidth;
      const needed = el.scrollWidth;
      const scale = needed > avail && needed > 0 ? Math.max(min, avail / needed) : 1;
      el.style.setProperty("--fit-scale", String(scale));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, min]);
  return ref;
}

export function Identity({
  identity,
  showClassLine = true,
}: {
  identity: IdentityVM;
  showClassLine?: boolean;
}) {
  const nameRef = useFitText(identity.name);
  return (
    <div className="osc-ident tw:flex tw:min-w-0 tw:flex-col tw:gap-[2px] tw:@max-md/app:overflow-hidden tw:@twopane/sheet:w-full tw:@twopane/sheet:items-center tw:@twopane/sheet:text-center">
      {/* padding + equal negative margin: layout unchanged, clip box grows so the display face's J survives */}
      <div
        className="osc-name tw:overflow-hidden tw:p-[0.14em] tw:-m-[0.14em] tw:font-display tw:leading-[0.95] tw:tracking-[0.01em] tw:whitespace-nowrap tw:text-text tw:@max-md/app:text-ellipsis tw:@twopane/sheet:self-stretch tw:@twopane/sheet:text-center"
        ref={nameRef}
      >
        {identity.name}
      </div>
      {showClassLine && (
        <div className="tw:font-display tw:text-[length:var(--fs-md)] tw:text-gold tw:@twopane/sheet:text-center">
          {identity.classLabel} {identity.level}
          {identity.title ? ` · ${identity.title}` : ""} · {identity.alignment}
        </div>
      )}
    </div>
  );
}
