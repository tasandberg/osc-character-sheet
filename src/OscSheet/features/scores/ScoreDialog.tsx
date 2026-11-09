import { useId } from "react";
import { useOscSheetContext } from "@app/context";
import { Modal } from "@ui";
import { Button } from "@ui/Button";
import { NumberInput } from "@ui/NumberInput";
import {
  selectScoreBreakdown,
  type ScoreContribution,
  type ScoreKey,
} from "./scoreBreakdown";

const SCORE_GRID = "tw:grid tw:grid-cols-[minmax(0,1fr)_auto]";
const SUBGRID = "tw:col-span-full tw:grid tw:grid-cols-subgrid";
const SCORE_ROW = `${SUBGRID} tw:items-baseline u-py-2`;
const ROW_LABEL = "u-fs-md tw:font-semibold u-text";
const ROW_VALUE =
  "tw:justify-self-end tw:pl-3 u-fs-md u-nowrap tw:tabular-nums u-text";

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
      className="modal-inset osc-score-modal"
      footer={
        <Button variant="primary" onClick={onClose}>
          {localize("OSC.scores.Close")}
        </Button>
      }
    >
      <div className={SCORE_GRID}>
        <div className={`${SCORE_ROW} tw:items-center`}>
          <label htmlFor={baseInputId} className={ROW_LABEL}>
            {baseLabel}
          </label>
          <span className={ROW_VALUE}>
            {canEdit ? (
              <NumberInput
                id={baseInputId}
                className="input mono tw:w-[6ch] tw:text-right"
                value={breakdown.base}
                min={1}
                max={20}
                onCommit={(n) =>
                  void updateActor({
                    [`system.scores.${scoreKey}.value`]: n,
                  })
                }
              />
            ) : (
              breakdown.base
            )}
          </span>
        </div>
        {breakdown.contributions.length > 0 && (
          <ul
            aria-label={localize("OSC.scores.Adjustments")}
            className={`${SUBGRID} tw:m-0 tw:list-none tw:p-0`}
          >
            {breakdown.contributions.map((contribution) => (
              <li key={contribution.id} className={SCORE_ROW}>
                <span className="tw:min-w-0 tw:truncate u-fs-md u-text">
                  {contribution.name}
                </span>
                <span className={ROW_VALUE}>{amountText(contribution)}</span>
              </li>
            ))}
          </ul>
        )}
        <div
          className={`${SCORE_ROW} tw:mt-(--spacer-3) tw:border-t tw:border-(--hairline)`}
        >
          <span className="u-fs-xl tw:font-semibold u-text">
            {game.i18n.format("OSC.scores.Total", {
              score: localize(`OSE.scores.${scoreKey}.short`),
            })}{" "}
            <span className="u-fs-md u-text-dim tw:font-normal">
              {localize("OSE.Modifier")} {breakdown.mod}
            </span>
          </span>
          <span className="tw:justify-self-end tw:pl-3 u-fs-xl tw:font-semibold u-nowrap tw:tabular-nums u-text">
            {breakdown.total}
          </span>
        </div>
        {breakdown.limited && (
          <p className="tw:col-span-full u-m-0 u-pt-2 u-fs-sm u-text-dim">
            {localize("OSC.scores.Limited")}
          </p>
        )}
      </div>
    </Modal>
  );
}
