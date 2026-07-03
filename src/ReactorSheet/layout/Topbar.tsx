import { useState, useRef, useEffect } from "react";
import type { TopbarVM } from "@domain/vm-types";
import { toggleTheme } from "@src/ReactorSheet/theme";
import { FEATURES } from "@app/features";

type Props = { vm: TopbarVM; onEdit: () => void; onLevelUp: () => void };

/** Persistent topbar: level, XP, and chrome actions. The bar stays dark in both
 *  themes (--ink). Rest and Level Up are gated behind FEATURES until implemented;
 *  Edit opens the Edit Character modal; the theme toggle is live. At XS the
 *  action buttons collapse into a ⋮ overflow menu. */
export function Topbar({ vm, onEdit, onLevelUp }: Props) {
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

  const actionButtons = (
    <>
      {FEATURES.rest && (
        <button type="button" className="rs-tb-btn" disabled>
          <span className="i" aria-hidden="true">☾</span>
          <span className="lbl">Rest</span>
        </button>
      )}
      {FEATURES.levelUp && (
        <button type="button" className="rs-tb-btn up" onClick={() => { setMenuOpen(false); onLevelUp(); }}>
          <span className="i" aria-hidden="true">▲</span>
          <span className="lbl">Level Up</span>
        </button>
      )}
      <button type="button" className="rs-tb-btn" onClick={() => { setMenuOpen(false); onEdit(); }}>
        <span className="i" aria-hidden="true">✎</span>
        <span className="lbl">Edit</span>
      </button>
    </>
  );

  return (
    <div className="rs-topbar-inner">
      <div className="rs-tb-lv">
        <b>Lv {vm.level}</b>
        <span className="cur">{vm.xp.value.toLocaleString()}</span>
      </div>
      <div className="rs-tb-xp" title={`${vm.xp.value.toLocaleString()} XP`}>
        <div className="rs-tb-bar">
          <i style={{ width: `${pct}%` }} />
          <span className="v">{vm.xp.value.toLocaleString()} XP</span>
        </div>
      </div>
      <div className="rs-tb-lv next">
        <b>Lv {vm.nextLevel}</b>
        <span className="cur">{vm.xp.next.toLocaleString()}</span>
      </div>
      {/* Inline actions (hidden at XS via .rs-tb-actions display:none) */}
      <div className="rs-tb-actions">{actionButtons}</div>
      {/* XS overflow ⋮ (hidden above XS via .rs-tb-overflow display:none) */}
      <div className="rs-tb-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className="rs-tb-btn rs-tb-overflow"
          aria-label="More actions"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="i" aria-hidden="true">⋮</span>
        </button>
        {menuOpen && <div className="rs-tb-menu">{actionButtons}</div>}
      </div>
      <button
        type="button"
        className="rs-tb-btn icon"
        onClick={toggleTheme}
        title="Toggle colour scheme"
        aria-label="Toggle colour scheme"
      >
        <span className="i" aria-hidden="true">◐</span>
      </button>
    </div>
  );
}
