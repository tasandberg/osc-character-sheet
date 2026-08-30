import { useState, useRef, useEffect } from "react";
import type { TopbarVM } from "@domain/vm-types";
import { SettingsModal } from "@features/settings/SettingsModal";
import { FEATURES } from "@app/features";
import {
  TB_BTN,
  TB_BTN_GLYPH,
  TB_BTN_ICON,
  TB_BTN_LEVEL_UP,
  TB_BTN_OVERFLOW,
} from "@layout/classes";

// Level chip: the level in display type over its XP total in mono. `shrink-0` +
// `nowrap` keep it intact while the XP bar between the two chips absorbs the
// slack instead.
const LV = "tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:leading-[1.05] tw:whitespace-nowrap";
const LV_N = "tw:font-display tw:text-[length:var(--fs-sm)] tw:tracking-[0.05em]";
const LV_XP = "cur tw:mt-[1px] tw:font-mono tw:text-[length:var(--fs-3xs)] tw:text-stamp-text-faint";

type Props = {
  vm: TopbarVM;
  onEdit: () => void;
  onLevelUp: () => void;
  /** When false (read-only sheet) the character-editing actions are omitted. */
  canEdit?: boolean;
};

/** Persistent topbar: level, XP, and sheet controls. The bar stays dark in both
 *  themes (--ink). Rest and Level Up are gated behind FEATURES until implemented;
 *  Edit opens the Edit Character modal; the cog opens per-user sheet settings
 *  (theme + font size). At XS the action buttons collapse into a ⋮ overflow menu. */
export function Topbar({ vm, onEdit, onLevelUp, canEdit = true }: Props) {
  const pct = vm.pct;
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        <button type="button" className={TB_BTN} disabled>
          <span className={TB_BTN_GLYPH} aria-hidden="true">
            ☾
          </span>
          <span className="lbl">Rest</span>
        </button>
      )}
      {FEATURES.levelUp && (
        <button
          type="button"
          className={TB_BTN_LEVEL_UP}
          onClick={() => {
            setMenuOpen(false);
            onLevelUp();
          }}
        >
          <span className={TB_BTN_GLYPH} aria-hidden="true">
            ▲
          </span>
          <span className="lbl">Level Up</span>
        </button>
      )}
      <button
        type="button"
        className={TB_BTN}
        onClick={() => {
          setMenuOpen(false);
          onEdit();
        }}
      >
        <span className={TB_BTN_GLYPH} aria-hidden="true">
          ✎
        </span>
        <span className="lbl">Edit</span>
      </button>
    </>
  ) : null;

  return (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
      <div className={LV}>
        <b className={`${LV_N} tw:text-gold`}>Lv {vm.level}</b>
        <span className={LV_XP}>{vm.xp.value.toLocaleString()}</span>
      </div>
      <div
        className="tw:max-w-[50%] tw:min-w-[44px] tw:flex-1"
        title={`${vm.xp.value.toLocaleString()} XP`}
      >
        <div className="tw:relative tw:flex tw:h-[16px] tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-[999px] tw:border tw:border-[rgba(229,222,200,0.22)] tw:bg-[rgba(0,0,0,0.35)]">
          <i
            className="tw:absolute tw:top-0 tw:bottom-0 tw:left-0 tw:rounded-[999px] tw:bg-[linear-gradient(90deg,var(--gold-dim),var(--gold))]"
            style={{ width: `${pct}%` }}
          />
          <span className="v tw:relative tw:z-[1] tw:font-mono tw:text-[length:var(--fs-3xs)] tw:text-stamp-text tw:[text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {vm.xp.value.toLocaleString()} XP
          </span>
        </div>
      </div>
      {/* The next-level chip differs from the current one only in the chip
          colour, written as its own string: a shared base plus a `.next`
          override would be two class-level utilities, and Tailwind — not the
          order they are written — decides which wins. */}
      <div className={`${LV} next`}>
        <b className={`${LV_N} tw:text-stamp-text-dim`}>Lv {vm.nextLevel}</b>
        <span className={LV_XP}>{vm.xp.next.toLocaleString()}</span>
      </div>
      {/* Right cluster floats to the edge as a group, leaving the level chips +
          XP bar on the left. `ml-auto` lives here rather than on the actions so
          the cog stays pinned on a read-only sheet, where no actions render. */}
      <div className="tw:ml-auto tw:flex tw:items-center tw:gap-1">
        {/* `contents` so the action buttons flatten into the cluster's flex row
            and share its gap; at XS they collapse into the ⋮ menu instead. */}
        <div data-testid="topbar-actions" className="tw:contents tw:@max-md/app:hidden">{actionButtons}</div>
        {/* XS overflow ⋮. Only shown when there are owner actions to collapse. */}
        {actionButtons && (
          <div className="osc-tb-menu-wrap tw:relative" ref={menuRef}>
            <button
              type="button"
              className={TB_BTN_OVERFLOW}
              aria-label="More actions"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={TB_BTN_GLYPH} aria-hidden="true">
                ⋮
              </span>
            </button>
            {menuOpen && <div className="osc-tb-menu">{actionButtons}</div>}
          </div>
        )}
        <button
          type="button"
          className={TB_BTN_ICON}
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          aria-label="Settings"
        >
          <i className={`${TB_BTN_GLYPH} fa-solid fa-gear`} aria-hidden="true" />
        </button>
      </div>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
