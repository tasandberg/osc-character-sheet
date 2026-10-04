import type { ReactNode } from "react";
import { Modal } from "@ui";
import { setSetting, SETTINGS, useOscSettings } from "@src/OscSheet/settings";
import { type ThemeSetting } from "@src/OscSheet/theme";
import {
  FONT_SCALES,
  FONT_SCALE_FACTOR,
  type FontScale,
} from "@src/OscSheet/fontScale";
import {
  SAME_AS_CHARACTER_SHEET,
  type SheetKind,
} from "@src/OscSheet/appearance";
import { VellumCheckbox, VellumField, VellumSegmented } from "./controls";

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "cream", label: "Light" },
];

const FONT_SCALE_LABELS: Record<FontScale, string> = {
  compact: "Compact",
  medium: "Medium",
  large: "Large",
};

// Each option's label renders at its own scale factor (em) — a live preview of
// what the setting does.
const FONT_SCALE_OPTIONS = FONT_SCALES.map((value) => ({
  value,
  label: (
    <span style={{ fontSize: `${FONT_SCALE_FACTOR[value]}em` }}>
      {FONT_SCALE_LABELS[value]}
    </span>
  ),
}));

function InheritableSegmented<T extends string>({
  label,
  options,
  value,
  inherited,
  onChange,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T | typeof SAME_AS_CHARACTER_SHEET;
  inherited: T;
  onChange: (next: T | typeof SAME_AS_CHARACTER_SHEET) => void;
}) {
  const inheriting = value === SAME_AS_CHARACTER_SHEET;
  return (
    <>
      <VellumCheckbox
        label="Same as character sheet"
        checked={inheriting}
        onChange={(checked) =>
          onChange(checked ? SAME_AS_CHARACTER_SHEET : inherited)
        }
      />
      <VellumSegmented
        label={label}
        options={options}
        value={inheriting ? inherited : value}
        onChange={onChange}
        disabled={inheriting}
      />
    </>
  );
}

function CharacterPreferences() {
  const { theme, fontScale, showSpellImages } = useOscSettings();
  return (
    <>
      <VellumField label="Theme" helper="Applies to your sheets only.">
        <VellumSegmented
          label="Theme"
          options={THEME_OPTIONS}
          value={theme}
          onChange={(next) => setSetting("theme", next)}
        />
      </VellumField>
      <VellumField label="Font size">
        <VellumSegmented
          label="Font size"
          options={FONT_SCALE_OPTIONS}
          value={fontScale}
          onChange={(next) => setSetting("fontScale", next)}
        />
      </VellumField>
      <VellumField label="Spell images">
        <VellumCheckbox
          label={SETTINGS.showSpellImages.hint}
          checked={showSpellImages}
          onChange={(checked) => setSetting("showSpellImages", checked)}
        />
      </VellumField>
    </>
  );
}

function MonsterPreferences() {
  const { theme, fontScale, monsterTheme, monsterFontScale } = useOscSettings();
  return (
    <>
      <VellumField label="Theme" helper="Applies to your monster sheets only.">
        <InheritableSegmented
          label="Theme"
          options={THEME_OPTIONS}
          value={monsterTheme}
          inherited={theme}
          onChange={(next) => setSetting("monsterTheme", next)}
        />
      </VellumField>
      <VellumField label="Font size">
        <InheritableSegmented
          label="Font size"
          options={FONT_SCALE_OPTIONS}
          value={monsterFontScale}
          inherited={fontScale}
          onChange={(next) => setSetting("monsterFontScale", next)}
        />
      </VellumField>
    </>
  );
}

export function SettingsModal({
  open,
  onClose,
  sheet = "character",
}: {
  open: boolean;
  onClose: () => void;
  sheet?: SheetKind;
}) {
  if (!open) return null;
  const footer = (
    <button type="button" className="vm-btn vm-btn-primary" onClick={onClose}>
      Close
    </button>
  );
  return (
    <Modal
      open={open}
      title={<span className="vm-heading">Preferences</span>}
      onClose={onClose}
      footer={footer}
      className="modal-inset osc-settings-modal"
    >
      <div className="u-stack u-gap-6">
        {sheet === "monster" ? (
          <MonsterPreferences />
        ) : (
          <CharacterPreferences />
        )}
      </div>
    </Modal>
  );
}
