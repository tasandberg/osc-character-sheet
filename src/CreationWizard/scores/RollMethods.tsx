import { useState } from "react";
import { createPortal } from "react-dom";
import { IconButton, Modal } from "@ui";
import { VellumCheckbox, VellumField } from "@features/settings/controls";
import { setSetting, useOscSettings } from "@src/OscSheet/settings";
import { isGM } from "../support";
import { scoreFormulaError } from "./scoreFormula";
import {
  ARRANGE,
  IN_ORDER,
  rollMethods,
  scoreChoiceLabel,
  type RollMethod,
} from "./scoresDraft";

const BUILT_IN_SETTINGS = {
  [IN_ORDER.id]: "allowScoresInOrder",
  [ARRANGE.id]: "allowScoresArrange",
} as Record<string, "allowScoresInOrder" | "allowScoresArrange" | undefined>;

function RollMethods({ onClose }: { onClose: () => void }) {
  const settings = useOscSettings();
  const custom = settings.customScoreMethods;
  const methods = rollMethods(
    {
      inOrder: settings.allowScoresInOrder,
      arrange: settings.allowScoresArrange,
    },
    custom,
  );
  const saveCustom = (next: RollMethod[]) =>
    setSetting("customScoreMethods", next);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [formula, setFormula] = useState("");
  const [arrange, setArrange] = useState(false);
  const [error, setError] = useState<string>();
  const [needsOne, setNeedsOne] = useState(false);
  const offered =
    methods.filter((method) => method.enabled).length +
    (settings.allowScoresManual ? 1 : 0);
  const change = (withdraws: boolean, apply: () => void) => {
    const blocked = withdraws && offered === 1;
    setNeedsOne(blocked);
    if (!blocked) apply();
  };

  const closeForm = () => {
    setAdding(false);
    setLabel("");
    setFormula("");
    setArrange(false);
    setError(undefined);
  };

  const add = async () => {
    const problem = label.trim()
      ? await scoreFormulaError(formula.trim())
      : "Give the roll method a label";
    setError(problem);
    if (problem) return;
    saveCustom([
      ...custom,
      {
        id: foundry.utils.randomID(),
        label: label.trim(),
        formula: formula.trim(),
        arrange,
        enabled: true,
      },
    ]);
    closeForm();
  };

  return (
    <Modal
      open
      title={<span className="vm-heading">Roll methods</span>}
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
      className="modal-inset osc-settings-modal"
    >
      <div className="u-stack u-gap-6">
        <VellumField label="Roll methods offered">
          {methods.map((method) => {
            const setting = BUILT_IN_SETTINGS[method.id];
            return (
              <div key={method.id} className="u-row u-justify-between">
                <VellumCheckbox
                  label={
                    setting
                      ? method.label
                      : `${method.label} · ${method.formula}${method.arrange ? " · arrange" : ""}`
                  }
                  checked={method.enabled}
                  onChange={(enabled) =>
                    change(!enabled, () =>
                      setting
                        ? setSetting(setting, enabled)
                        : saveCustom(
                            custom.map((other) =>
                              other.id === method.id
                                ? { ...other, enabled }
                                : other,
                            ),
                          ),
                    )
                  }
                />
                {!setting && (
                  <IconButton
                    variant="danger"
                    size="sm"
                    aria-label={`Remove ${method.label}`}
                    onClick={() =>
                      change(method.enabled, () =>
                        saveCustom(
                          custom.filter((other) => other.id !== method.id),
                        ),
                      )
                    }
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            );
          })}
          <VellumCheckbox
            label={scoreChoiceLabel("manual")}
            checked={settings.allowScoresManual}
            onChange={(checked) =>
              change(!checked, () => setSetting("allowScoresManual", checked))
            }
          />
          {needsOne && (
            <p role="alert" className="vm-field-error">
              At least one roll method is required
            </p>
          )}
        </VellumField>
        {adding ? (
          <VellumField label="Add a roll method">
            <div className="vm-field-helper">
              A Foundry formula for one score, such as 4d6dl or 2d6+6.
            </div>
            <div className="u-row u-gap-2">
              <input
                className="vm-input u-flex-1"
                aria-label="Roll method label"
                placeholder="Label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <input
                className="vm-input u-flex-1"
                aria-label="Roll formula"
                placeholder="Formula"
                value={formula}
                onChange={(event) => setFormula(event.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="vm-field-error">
                {error}
              </p>
            )}
            <VellumCheckbox
              label="Players arrange the totals"
              checked={arrange}
              onChange={setArrange}
            />
            <div className="u-row u-gap-3 u-justify-end">
              <button
                type="button"
                className="vm-btn vm-btn-link vm-btn-link-muted"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="vm-btn vm-btn-secondary vm-btn-sm"
                onClick={() => void add()}
              >
                Add
              </button>
            </div>
          </VellumField>
        ) : (
          <div className="u-row">
            <button
              type="button"
              className="vm-btn vm-btn-secondary vm-btn-sm"
              onClick={() => setAdding(true)}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Add a roll method
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function RollMethodsButton({
  onOpen,
}: {
  onOpen: (host: Element | null) => void;
}) {
  if (!isGM()) return null;
  return (
    <IconButton
      aria-label="Roll methods"
      title="Roll methods"
      onClick={(event) => onOpen(event.currentTarget.closest(".osc-sheet-app"))}
    >
      <i className="fa-solid fa-gear u-fs-md" aria-hidden="true" />
    </IconButton>
  );
}

export function RollMethodsModal({
  host,
  onClose,
}: {
  host: Element | null;
  onClose: () => void;
}) {
  return host && createPortal(<RollMethods onClose={onClose} />, host);
}
