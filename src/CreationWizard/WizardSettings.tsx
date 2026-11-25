import { Modal } from "@ui";
import {
  VellumCheckbox,
  VellumField,
  VellumSegmented,
} from "@features/settings/controls";
import { setSetting, useOscSettings } from "@src/OscSheet/settings";
import type { RaceMode } from "./race/raceDraft";
import { RollMethodsSettings } from "./scores/RollMethods";

const RACE_MODES: { value: RaceMode; label: string }[] = [
  { value: "separate", label: "Separate race and class" },
  { value: "asClass", label: "Race as class" },
];

export function WizardSettings({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useOscSettings();
  if (!open) return null;

  return (
    <Modal
      open={open}
      title={<span className="vm-heading">Wizard settings</span>}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="vm-btn vm-btn-secondary"
          onClick={onClose}
        >
          Close
        </button>
      }
      className="modal-inset osc-settings-modal osc-wizard-settings-modal"
    >
      <div className="osc-wizard-settings-columns">
        <RollMethodsSettings />
        <div className="u-stack u-gap-6">
          <VellumField label="Hit points">
            <VellumCheckbox
              label="Maximum hit points at 1st level"
              checked={settings.maxHitPointsAtFirstLevel}
              onChange={(checked) =>
                setSetting("maxHitPointsAtFirstLevel", checked)
              }
            />
          </VellumField>
          <VellumField
            label="Race and class"
            helper="Only matters when the world has race items."
          >
            <VellumSegmented
              label="Race and class"
              options={RACE_MODES}
              value={settings.raceMode}
              onChange={(next) => setSetting("raceMode", next)}
            />
          </VellumField>
        </div>
      </div>
    </Modal>
  );
}
