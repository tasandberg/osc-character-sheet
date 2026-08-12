import { useLayoutEffect, useRef } from "react";
import type { IdentityVM } from "@domain/vm-types";

/** Shrink a single-line element's font to fit its box (down to `min`x) instead of
 *  truncating. Sets `--fit-scale`; CSS multiplies the base font-size by it. */
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

/** Name over the class · level · title · alignment line.
 *
 *  `overflow-hidden` so a long name ellipsizes instead of pushing HP/AC
 *  off-screen. In the rail the column fills its track (don't size to content) so
 *  useFitText has a real width to shrink the name against. */
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
      {/* The name's font-size is the one thing left in actions.scss — see the
          note there on why three tiers across two containers can't be
          utilities. */}
      {/* Padding cancelled by an equal negative margin: layout is unchanged, but
          the overflow clip box grows by 0.14em on every side, so the display
          face's left-overhanging J and its descender survive `leading-[0.95]`. */}
      <div
        className="osc-name tw:overflow-hidden tw:p-[0.14em] tw:-m-[0.14em] tw:font-display tw:leading-[0.95] tw:tracking-[0.01em] tw:whitespace-nowrap tw:text-text tw:@max-md/app:text-ellipsis tw:@twopane/sheet:self-stretch tw:@twopane/sheet:text-center"
        ref={nameRef}
      >
        {identity.name}
      </div>
      {showClassLine && (
        <div className="osc-class tw:font-display tw:text-[length:var(--fs-md)] tw:text-gold tw:@twopane/sheet:text-center">
          {identity.classLabel} {identity.level}
          {identity.title ? ` · ${identity.title}` : ""} · {identity.alignment}
        </div>
      )}
    </div>
  );
}
