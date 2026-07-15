import { useLayoutEffect, useRef } from "react";
import type { EncumbranceVM, IdentityVM, VitalsVM } from "@domain/vm-types";
import { formatMod } from "@domain/format";
import { Stamp } from "@ui/Stamp";
import { MoveTooltip } from "@ui/MovePop";
import { useHpInput } from "@ui/useHpInput";

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

type Props = {
  identity: IdentityVM;
  vitals: VitalsVM;
  /** Drives the encumbrance line in the MOVE hover — why the rates are what they are. */
  encumbrance?: EncumbranceVM;
  /** Commit a new current-HP value; when provided, HP renders an editable input. */
  onSetHp?: (value: number) => void;
  /** Right-click on the portrait (e.g. Token Variant Art's picker). */
  onPortraitContextMenu?: React.MouseEventHandler<HTMLImageElement>;
  /** When true, left-click opens the image FilePicker (core `editImage` action). */
  canEditPortrait?: boolean;
};

/** Header band. Grid areas (see actions.scss) place: portrait · name+Init/HD/Move
 *  · HP/AC in medium, and stack them in the rail. */
export function HeaderBand({ identity, vitals, encumbrance, onSetHp, onPortraitContextMenu, canEditPortrait }: Props) {
  const m = vitals.moveBands;
  const nameRef = useFitText(identity.name);
  const hp = useHpInput({ value: vitals.hp.value, max: vitals.hp.max, onSet: onSetHp ?? (() => {}) });
  return (
    <div className="osc-head">
      {/* `.profile` / `.profile-img` mirror the OSE sheet so modules keyed on
          those selectors match. The `.modifiers-btn` overlay that portrait-
          decorating modules (e.g. OSR Character Builder) inject into is created
          imperatively in osc-sheet.js — outside React's tree — so React
          never clobbers an injected child. */}
      <div className="osc-portrait-wrap profile">
        {/* `data-action="editImage"` (core AppV2 vocabulary) rides the frame's
            delegated click listener — no React onClick needed — and doubles as
            a compat surface for modules keyed on the core attribute. Rendered
            only when editable so non-owners get no action and no affordance. */}
        <img
          className="osc-portrait profile-img"
          src={identity.img || undefined}
          alt={identity.name}
          data-action={canEditPortrait ? "editImage" : undefined}
          data-edit="img"
          title={identity.name}
          onContextMenu={onPortraitContextMenu}
        />
      </div>
      <div className="osc-ident">
        <div className="osc-name" ref={nameRef}>{identity.name}</div>
        <div className="osc-class">
          {identity.classLabel} {identity.level}
          {identity.title ? ` · ${identity.title}` : ""} · {identity.alignment}
        </div>
      </div>
      <div className="osc-substats">
        <div className="osc-tile">
          <Stamp>INIT</Stamp>
          <div className="osc-tile-v">{formatMod(vitals.initMod)}</div>
        </div>
        <div className="osc-tile">
          <Stamp>HD</Stamp>
          <div className="osc-tile-v">{vitals.hd}</div>
        </div>
        <div className="osc-tile osc-tile-move">
          <Stamp>MOVE</Stamp>
          <div className="osc-tile-v">{vitals.move}ft</div>
          <MoveTooltip
            bands={m}
            tier={encumbrance?.enabled ? encumbrance.tier : undefined}
            status={encumbrance?.enabled ? encumbrance.status : undefined}
          />
        </div>
      </div>
      <div className="osc-vitals">
        <div className="osc-vital hp">
          <Stamp className="vv-l">HP</Stamp>
          <div className="vv-row">
            {/* medium+: − / + steppers around the value; XS: an editable input (toggled in CSS) */}
            {onSetHp && (
              <button type="button" className="vv-step" aria-label="Lose 1 HP" onClick={hp.dec}>−</button>
            )}
            <div className="vv-big vv-value">{vitals.hp.value}</div>
            {onSetHp && (
              <input
                className="vv-big vv-input"
                aria-label="Current HP"
                key={hp.key}
                {...hp.inputProps}
              />
            )}
            {onSetHp && (
              <button type="button" className="vv-step" aria-label="Heal 1 HP" onClick={hp.inc}>+</button>
            )}
          </div>
          <div className="vv-sub">
            <span className="full">Max {vitals.hp.max}</span>
            <span className="short">/{vitals.hp.max}</span>
          </div>
        </div>
        <div className="osc-vital ac">
          <Stamp className="vv-l">AC</Stamp>
          <div className="vv-row">
            <div className="vv-big" data-testid="ac-value">{vitals.ac.value}</div>
          </div>
          <div className="vv-sub">
            <span className="full">{vitals.ac.ascending ? "Ascending" : "Descending"}</span>
            <span className="short">{vitals.ac.ascending ? "asc" : "desc"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
