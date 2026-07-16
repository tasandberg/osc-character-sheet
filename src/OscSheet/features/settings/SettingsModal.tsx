import { Modal, Field, Segmented, Button } from "@ui";
import { getThemeSetting, setTheme, type Theme } from "@src/OscSheet/theme";
import {
  getFontScaleSetting,
  setFontScale,
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

// Values read straight from the client settings each render; the setters flip
// the setting, whose onChange re-renders the whole sheet (theme.ts / fontScale.ts).
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const footer = <Button variant="primary" onClick={onClose}>Close</Button>;
  return (
    <Modal open={open} title="Preferences" onClose={onClose} footer={footer} className="osc-settings-modal">
      <div className="u-stack u-gap-5">
        <Field label="Theme" hint="Applies to your sheets only.">
          <div role="group" aria-label="Theme">
            <Segmented options={THEME_OPTIONS} value={getThemeSetting()} onValueChange={setTheme} />
          </div>
        </Field>
        <Field label="Font size">
          <div role="group" aria-label="Font size">
            <Segmented
              options={FONT_SCALE_OPTIONS}
              value={getFontScaleSetting()}
              onValueChange={setFontScale}
            />
          </div>
        </Field>
      </div>
    </Modal>
  );
}
