import { useId } from "react";
import { useOscSheetContext } from "@app/context";
import { ColumnHeaderRow, Modal } from "@ui";
import { Button } from "@ui/Button";
import { Field } from "@ui/Field";
import { NumberInput } from "@ui/NumberInput";
import { effectsLabel } from "@features/effects/effects";
import {
  selectScoreBreakdown,
  type ScoreContribution,
  type ScoreKey,
} from "./scoreBreakdown";

const SCORE_GRID = "tw:grid tw:grid-cols-[minmax(0,1fr)_repeat(2,auto)]";
const SUBGRID = "tw:col-span-full tw:grid tw:grid-cols-subgrid";
const SCORE_ROW = `${SUBGRID} tw:items-baseline u-py-2`;
const ADJUSTMENT_ROW = `${SCORE_ROW} tw:not-first:border-t tw:border-t-border-soft`;
const ROW_LABEL = "tw:col-span-2 u-fs-md tw:font-semibold u-text";
const ROW_VALUE =
  "tw:col-start-3 tw:justify-self-end tw:pl-3 u-fs-md tw:tabular-nums u-text";
const CELL = "tw:pl-3 u-fs-sm u-text-dim u-nowrap";
const SCORE_COLUMNS =
  "tw:grid tw:grid-cols-2 tw:items-start u-gap-6 tw:@max-md/app:grid-cols-1";

const localize = (key: string) => game.i18n.localize(key);

const amountText = (contribution: ScoreContribution) =>
  contribution.type === "add"
    ? contribution.amount
    : game.i18n.format(`OSC.scores.types.${contribution.type}`, {
        value: contribution.amount,
      });

export function ScoreDialog({
  scoreKey,
  onClose,
}: {
  scoreKey: ScoreKey | null;
  onClose: () => void;
}) {
  const { actor, canEdit, updateActor } = useOscSheetContext();
  const baseInputId = useId();
  if (!scoreKey) return null;
  const name = localize(`OSE.scores.${scoreKey}.long`);
  const breakdown = selectScoreBreakdown(actor, scoreKey);
  const baseLabel = localize("OSC.scores.Base");
  return (
    <Modal
      open
      title={name}
      onClose={onClose}
      className="modal-inset"
      footer={
        <Button variant="primary" onClick={onClose}>
          {localize("OSC.scores.Close")}
        </Button>
      }
    >
      <div className={SCORE_COLUMNS}>
        <Field label={baseLabel} htmlFor={baseInputId}>
          <NumberInput
            id={baseInputId}
            className="input mono tw:w-[8ch]"
            value={breakdown.base}
            min={1}
            max={20}
            disabled={!canEdit}
            onCommit={(n) =>
              void updateActor({ [`system.scores.${scoreKey}.value`]: n })
            }
          />
        </Field>
        <div className={SCORE_GRID}>
          <div className={SCORE_ROW}>
            <span className={ROW_LABEL}>{baseLabel}</span>
            <span className={ROW_VALUE}>{breakdown.base}</span>
          </div>
          {breakdown.contributions.length > 0 && (
            <section
              aria-label={localize("OSC.scores.Adjustments")}
              className={`${SUBGRID} tw:mt-(--spacer-3)`}
            >
              <ColumnHeaderRow
                title={localize("OSC.scores.Adjustments")}
                columns={[
                  effectsLabel("OSE.effects.Source"),
                  localize("OSC.scores.Amount"),
                ]}
              />
              <ul className={`${SUBGRID} tw:m-0 tw:list-none tw:p-0`}>
                {breakdown.contributions.map((contribution) => (
                  <li key={contribution.id} className={ADJUSTMENT_ROW}>
                    <span className="tw:min-w-0 tw:truncate u-fs-md u-text">
                      {contribution.name}
                    </span>
                    <span className={CELL}>
                      {contribution.source ?? effectsLabel("OSE.effects.Actor")}
                    </span>
                    <span className="tw:justify-self-end tw:pl-3 u-fs-md u-nowrap tw:tabular-nums u-text">
                      {amountText(contribution)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div
            className={`${SCORE_ROW} tw:mt-(--spacer-3) tw:border-t tw:border-(--hairline)`}
          >
            <span className={ROW_LABEL}>
              {game.i18n.format("OSC.scores.Total", {
                score: localize(`OSE.scores.${scoreKey}.short`),
              })}
            </span>
            <span className={`${ROW_VALUE} tw:font-semibold`}>
              {breakdown.total}
            </span>
          </div>
          <div className={SCORE_ROW}>
            <span className={ROW_LABEL}>{localize("OSE.Modifier")}</span>
            <span className={ROW_VALUE}>{breakdown.mod}</span>
          </div>
          {breakdown.limited && (
            <p className="tw:col-span-full u-m-0 u-pt-2 u-fs-sm u-text-dim">
              {localize("OSC.scores.Limited")}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
