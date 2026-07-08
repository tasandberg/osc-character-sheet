import { useState, useRef, useEffect } from "react";
import type { TopbarVM } from "@domain/vm-types";
import { toggleTheme } from "@src/OscSheet/theme";
import { FEATURES } from "@app/features";

type Props = {
  vm: TopbarVM;
  onEdit: () => void;
  onLevelUp: () => void;
  /** When false (read-only sheet) the character-editing actions are omitted. */
  canEdit?: boolean;
};

/** Persistent topbar: level, XP, and sheet controls. The bar stays dark in both
 *  themes (--ink). Rest and Level Up are gated behind FEATURES until implemented;
 *  Edit opens the Edit Character modal; the theme toggle is live. At XS the
 *  action buttons collapse into a ⋮ overflow menu. */
export function Topbar({ vm, onEdit, onLevelUp, canEdit = true }: Props) {
  const pct = vm.pct;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  // Character-editing actions (Rest/Level Up/Edit) are owner-only; the theme
  // toggle below stays available to everyone (client-side setting).
  const actionButtons = canEdit ? (
    <>
      {FEATURES.rest && (
        <button
          type="button"
          className="osc-tb-btn u-inline-flex u-items-center u-gap-2"
          disabled
        >
          <span className="i u-fs-xs" aria-hidden="true">
            ☾
          </span>
          <span className="lbl">Rest</span>
        </button>
      )}
      {FEATURES.levelUp && (
        <button
          type="button"
          className="osc-tb-btn up u-inline-flex u-items-center u-gap-2"
          onClick={() => {
            setMenuOpen(false);
            onLevelUp();
          }}
        >
          <span className="i u-fs-xs" aria-hidden="true">
            ▲
          </span>
          <span className="lbl">Level Up</span>
        </button>
      )}
      <button
        type="button"
        className="osc-tb-btn u-inline-flex u-items-center u-gap-2"
        onClick={() => {
          setMenuOpen(false);
          onEdit();
        }}
      >
        <span className="i u-fs-xs" aria-hidden="true">
          ✎
        </span>
        <span className="lbl">Edit</span>
      </button>
    </>
  ) : null;

  return (
    <div className="osc-topbar-inner u-row u-wrap">
      <div className="osc-tb-lv">
        <b>Lv {vm.level}</b>
        <span className="cur">{vm.xp.value.toLocaleString()}</span>
      </div>
      <div className="osc-tb-xp" title={`${vm.xp.value.toLocaleString()} XP`}>
        <div className="osc-tb-bar">
          <i style={{ width: `${pct}%` }} />
          <span className="v">{vm.xp.value.toLocaleString()} XP</span>
        </div>
      </div>
      <div className="osc-tb-lv next">
        <b>Lv {vm.nextLevel}</b>
        <span className="cur">{vm.xp.next.toLocaleString()}</span>
      </div>
      {/* Right cluster floats to the edge as a group (u-ml-auto). u-gap-2 spaces
          the buttons — .osc-tb-actions is display:contents, so its buttons flatten
          into this row and share the same gap. */}
      <div className="u-row u-gap-1 u-ml-auto">
        {/* Inline actions (hidden at XS via .osc-tb-actions display:none) */}
        <div className="osc-tb-actions">{actionButtons}</div>
        {/* XS overflow ⋮ (hidden above XS via .osc-tb-overflow display:none). Only
            shown when there are owner actions to collapse into it. */}
        {actionButtons && (
          <div className="osc-tb-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="osc-tb-btn osc-tb-overflow u-inline-flex u-items-center u-gap-2"
              aria-label="More actions"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="i u-fs-xs" aria-hidden="true">
                ⋮
              </span>
            </button>
            {menuOpen && <div className="osc-tb-menu">{actionButtons}</div>}
          </div>
        )}
        <button
          type="button"
          className="osc-tb-btn icon u-inline-flex u-items-center u-gap-2"
          onClick={toggleTheme}
          title="Toggle colour scheme"
          aria-label="Toggle colour scheme"
        >
          <span className="i u-fs-xs" aria-hidden="true">
            ◐
          </span>
        </button>
      </div>
    </div>
  );
}
