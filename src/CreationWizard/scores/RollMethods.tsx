import { useState } from "react";
import { IconButton, Tabs } from "@ui";
import { VellumCheckbox } from "@features/settings/controls";
import { setSetting, useOscSettings } from "@src/OscSheet/settings";
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

export function RollMethodsSettings() {
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

  const resetForm = () => {
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
    resetForm();
  };

  return (
    <div className="u-stack u-gap-4">
      <Tabs
        variant="folder"
        className="osc-wizard-settings-tabs"
        tabs={[
          { id: "methods", label: "Roll methods" },
          { id: "custom", label: "Custom" },
        ]}
        active={adding ? "custom" : "methods"}
        onSelect={(id) => setAdding(id === "custom")}
      />
      {adding ? (
        <div className="vm-field">
          <div className="vm-field-helper">
            Add a custom roll method for ability scores. Use a Foundry roll
            formula, such as 4d6dl or 2d6+6.
          </div>
          <div className="u-row u-gap-2">
            <input
              className="vm-input u-flex-1 tw:h-8 tw:px-2 tw:text-(length:--fs-sm)"
              aria-label="Roll method label"
              placeholder="Label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
            <input
              className="vm-input u-flex-1 tw:h-8 tw:px-2 tw:text-(length:--fs-sm)"
              aria-label="Roll formula"
              placeholder="Formula"
              value={formula}
              onChange={(event) => setFormula(event.target.value)}
            />
            <button
              type="button"
              className="vm-btn vm-btn-secondary vm-btn-sm u-flex-none"
              onClick={() => void add()}
            >
              Add
            </button>
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
        </div>
      ) : (
        <div className="vm-field">
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
        </div>
      )}
    </div>
  );
}
