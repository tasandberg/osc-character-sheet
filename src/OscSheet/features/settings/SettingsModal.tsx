import { Modal, Field, Segmented } from "@ui";
import { getThemeSetting, setTheme, type Theme } from "@src/OscSheet/theme";
import {
  getFontScaleSetting,
  setFontScale,
  type FontScale,
} from "@src/OscSheet/fontScale";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "cream", label: "Cream" },
];

const FONT_SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: "md", label: "A" },
  { value: "lg", label: "A+" },
  { value: "xl", label: "A++" },
];

// Values read straight from the client settings each render; the setters flip
// the setting, whose onChange re-renders the whole sheet (theme.ts / fontScale.ts).
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Modal open={open} title="Settings" onClose={onClose} className="osc-settings-modal">
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
