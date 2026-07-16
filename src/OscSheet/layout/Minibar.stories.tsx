import { useEffect, useRef } from "react";
import { Minibar } from "@layout/Minibar";
import type { IdentityVM, VitalsVM } from "@domain/vm-types";

export default { title: "Shell / Minibar" };

const identity: IdentityVM = {
  name: "Eldra Vey", img: "", classLabel: "Magic-User", level: 3,
  alignment: "Neutral", title: "Conjurer",
};
const vitals: VitalsVM = {
  hp: { value: 20, max: 24 },
  ac: { value: 12, ascending: true },
  initMod: 1, hd: "3d4", move: 120, moveBands: { encounter: 40, explore: 120, travel: 24 },
};

// The minibar only reveals when `.is-collapsed`; force it on for the story so it's
// visible without a scroller. (In the app, Minibar.tsx toggles it on scroll.)
function forceCollapsed(host: HTMLElement | null) {
  host?.querySelector(".osc-minibar")?.classList.add("is-collapsed");
}

export const Owner = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => forceCollapsed(ref.current), []);
  return (
    <div ref={ref}>
      <Minibar identity={identity} vitals={vitals} onSetHp={() => {}} />
    </div>
  );
};

export const Readonly = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    forceCollapsed(ref.current);
    const app = ref.current?.closest<HTMLElement>(".osc-sheet-app");
    app?.classList.add("is-readonly");
    return () => app?.classList.remove("is-readonly");
  }, []);
  // No onSetHp → static value, no steppers (matches a non-owner sheet).
  return (
    <div ref={ref}>
      <Minibar identity={identity} vitals={vitals} />
    </div>
  );
};
