import { Modal, Field, Segmented, Toggle, Button } from "@ui";
import { setSetting, useOscSettings } from "@src/OscSheet/settings";
import { type Theme } from "@src/OscSheet/theme";
import {
  FONT_SCALES,
  FONT_SCALE_FACTOR,
  type FontScale,
} from "@src/OscSheet/fontScale";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
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

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, fontScale, showSpellImages } = useOscSettings();
  if (!open) return null;
  const footer = <Button variant="primary" onClick={onClose}>Close</Button>;
  return (
    <Modal open={open} title="Preferences" onClose={onClose} footer={footer} className="modal-inset osc-settings-modal">
      <div className="u-stack u-gap-5">
        <Field label="Theme" hint="Applies to your sheets only.">
          <div role="group" aria-label="Theme">
            <Segmented
              options={THEME_OPTIONS}
              value={theme}
              onValueChange={(next) => setSetting("theme", next)}
            />
          </div>
        </Field>
        <Field label="Font size">
          <div role="group" aria-label="Font size">
            <Segmented
              options={FONT_SCALE_OPTIONS}
              value={fontScale}
              onValueChange={(next) => setSetting("fontScale", next)}
            />
          </div>
        </Field>
        <Field label="Spell images">
          <Toggle
            checked={showSpellImages}
            onChange={(e) => setSetting("showSpellImages", e.target.checked)}
          >
            Show each spell's item image
          </Toggle>
        </Field>
      </div>
    </Modal>
  );
}
