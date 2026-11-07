import { useState, useRef, useCallback } from "react";
import type { TopbarVM } from "@domain/vm-types";
import { SettingsModal } from "@features/settings/SettingsModal";
import { CampModal } from "@features/camp/CampModal";
import { useDismiss } from "@ui/useDismiss";
import { InlineButton } from "@ui/InlineButton";
import type { OseClassItem } from "@domain/types";
import {
  TB_BTN,
  TB_BTN_GLYPH,
  TB_BTN_ICON,
  TB_BTN_OVERFLOW,
} from "@layout/classes";

// Level chip: the level in display type over its XP total in mono. `shrink-0` +
// `nowrap` keep it intact while the XP bar between the two chips absorbs the
// slack instead.
const LV =
  "tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:leading-[1.05] tw:whitespace-nowrap";
const LV_N = "tw:font-semibold tw:text-(length:--fs-xs)";
const LV_XP = "cur tw:mt-[1px] tw:text-(length:--fs-xs) tw:text-stamp-text-dim";

type Props = {
  vm: TopbarVM;
  onEdit: () => void;
  onLevelUpClass?: (classItem: OseClassItem) => void;
  /** When false (read-only sheet) the character-editing actions are omitted. */
  canEdit?: boolean;
};

/** Persistent topbar: level, XP, and sheet controls. The bar stays dark in both
 *  themes (--ink). Camp opens the Camp modal; Edit opens the Edit Character
 *  modal; the cog opens per-user sheet settings (theme + font size). At XS the action buttons collapse into a ⋮ overflow menu. */
function TrackSwitch({
  names,
  index,
  onSelect,
}: {
  names: string[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const next = (index + 1) % names.length;
  return (
    <InlineButton
      size="xs"
      className="tw:inline-grid tw:shrink-0 tw:whitespace-nowrap"
      aria-label={`XP for ${names[index]}. Show ${names[next]}`}
      title={`Show ${names[next]} XP`}
      onClick={() => onSelect(next)}
    >
      {names.map((name, i) => (
        <span
          key={name}
          aria-hidden={i !== index}
          className={`tw:col-start-1 tw:row-start-1 u-inline-flex u-items-center u-gap-1 ${i === index ? "" : "tw:invisible"}`}
        >
          {name}
          <i className="fas fa-right-left" aria-hidden="true" />
        </span>
      ))}
    </InlineButton>
  );
}

export function Topbar({ vm, onEdit, onLevelUpClass, canEdit = true }: Props) {
  const [trackIndex, setTrackIndex] = useState(0);
  const tracks = vm.classTracks;
  const shownIndex = tracks[trackIndex] ? trackIndex : 0;
  const track = tracks[shownIndex] ?? vm;
  const pct = track.pct;
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [campOpen, setCampOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismiss(menuRef, closeMenu, { active: menuOpen });

  // Character-editing actions (Camp/Edit) are owner-only; the theme
  // toggle below stays available to everyone (client-side setting).
  const actionButtons = canEdit ? (
    <>
      <button
        type="button"
        className={TB_BTN}
        onClick={() => {
          setMenuOpen(false);
          setCampOpen(true);
        }}
      >
        <i className="fa fa-campground" />
        <span className="lbl">Rest</span>
      </button>
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
      <div className="tw:flex tw:max-w-[20rem] tw:flex-1 tw:flex-wrap tw:items-center tw:gap-2">
        {tracks.length > 1 && (
          <TrackSwitch
            names={tracks.map((t) => t.name)}
            index={shownIndex}
            onSelect={setTrackIndex}
          />
        )}
        <div className={LV}>
          <b className={`${LV_N} tw:text-gold`}>Lv {track.level}</b>
          <span className={LV_XP}>{track.xp.floor.toLocaleString()}</span>
        </div>
        <div
          className="tw:min-w-[44px] tw:flex-1"
          title={`${track.xp.value.toLocaleString()} XP`}
        >
          <span className="v tw:block tw:text-center tw:text-(length:--fs-xs) tw:text-stamp-text">
            {track.xp.value.toLocaleString()} XP
          </span>
          <div className="tw:relative tw:mt-[2px] tw:h-[6px] tw:overflow-hidden tw:border tw:border-(--hair-soft) tw:bg-(--well)">
            <i
              className="tw:absolute tw:top-0 tw:bottom-0 tw:left-0 tw:bg-gold"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {track.xp.next != null && (
          <div className={`${LV} next`}>
            <b className={`${LV_N} tw:text-stamp-text-dim`}>
              Lv {track.nextLevel}
            </b>
            <span className={LV_XP}>{track.xp.next.toLocaleString()}</span>
          </div>
        )}
        {canEdit &&
          onLevelUpClass &&
          vm.levelUps.map(({ label, classItem }) => (
            <InlineButton
              key={label}
              variant="link"
              size="xs"
              className="u-nowrap"
              onClick={() => onLevelUpClass(classItem)}
            >
              <i className="fas fa-circle-up" aria-hidden="true" /> {label}
            </InlineButton>
          ))}
      </div>

      <div className="tw:ml-auto tw:flex tw:items-center tw:gap-1">
        <div
          data-testid="topbar-actions"
          className="tw:contents tw:@max-md/app:hidden"
        >
          {actionButtons}
        </div>

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
          <i
            className={`${TB_BTN_GLYPH} fa-solid fa-gear`}
            aria-hidden="true"
          />
        </button>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      {canEdit && campOpen && (
        <CampModal open onClose={() => setCampOpen(false)} />
      )}
    </div>
  );
}
