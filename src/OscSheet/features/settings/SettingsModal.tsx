import type { ReactNode } from "react";
import { Modal, Field, Segmented, Toggle, Button } from "@ui";
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

function SegmentedGroup<T extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onValueChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label}>
      <Segmented
        options={options}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </div>
  );
}

function InheritableGroup<T extends string>({
  label,
  options,
  value,
  inherited,
  onValueChange,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T | typeof SAME_AS_CHARACTER_SHEET;
  inherited: T;
  onValueChange: (next: T | typeof SAME_AS_CHARACTER_SHEET) => void;
}) {
  const inheriting = value === SAME_AS_CHARACTER_SHEET;
  return (
    <div className="u-stack u-gap-3">
      <Toggle
        checked={inheriting}
        onChange={(e) =>
          onValueChange(e.target.checked ? SAME_AS_CHARACTER_SHEET : inherited)
        }
      >
        Same as character sheet
      </Toggle>
      <SegmentedGroup
        label={label}
        options={options}
        value={inheriting ? inherited : value}
        onValueChange={onValueChange}
        disabled={inheriting}
      />
    </div>
  );
}

function CharacterPreferences() {
  const { theme, fontScale, showSpellImages } = useOscSettings();
  return (
    <>
      <Field label="Theme" hint="Applies to your sheets only.">
        <SegmentedGroup
          label="Theme"
          options={THEME_OPTIONS}
          value={theme}
          onValueChange={(next) => setSetting("theme", next)}
        />
      </Field>
      <Field label="Font size">
        <SegmentedGroup
          label="Font size"
          options={FONT_SCALE_OPTIONS}
          value={fontScale}
          onValueChange={(next) => setSetting("fontScale", next)}
        />
      </Field>
      <Field label="Spell images">
        <Toggle
          checked={showSpellImages}
          onChange={(e) => setSetting("showSpellImages", e.target.checked)}
        >
          {SETTINGS.showSpellImages.hint}
        </Toggle>
      </Field>
    </>
  );
}

function MonsterPreferences() {
  const { theme, fontScale, monsterTheme, monsterFontScale } = useOscSettings();
  return (
    <>
      <Field label="Theme" hint="Applies to your monster sheets only.">
        <InheritableGroup
          label="Theme"
          options={THEME_OPTIONS}
          value={monsterTheme}
          inherited={theme}
          onValueChange={(next) => setSetting("monsterTheme", next)}
        />
      </Field>
      <Field label="Font size">
        <InheritableGroup
          label="Font size"
          options={FONT_SCALE_OPTIONS}
          value={monsterFontScale}
          inherited={fontScale}
          onValueChange={(next) => setSetting("monsterFontScale", next)}
        />
      </Field>
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
    <Button variant="primary" onClick={onClose}>
      Close
    </Button>
  );
  return (
    <Modal
      open={open}
      title="Preferences"
      onClose={onClose}
      footer={footer}
      className="modal-inset osc-settings-modal"
    >
      <div className="u-stack u-gap-5">
        {sheet === "monster" ? (
          <MonsterPreferences />
        ) : (
          <CharacterPreferences />
        )}
      </div>
    </Modal>
  );
}
