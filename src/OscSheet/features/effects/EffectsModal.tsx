import { useOscSheetContext } from "@app/context";
import {
  Modal,
  IconButton,
  InlineButton,
  Monogram,
  ColumnHeaderRow,
} from "@ui";
import {
  createEffect,
  deleteEffect,
  editEffect,
  selectEffectGroups,
  toggleEffect,
  type EffectRow,
} from "./effects";

const localize = (key: string) => game.i18n.localize(key);

const EFFECTS_GRID = "tw:grid tw:grid-cols-[minmax(0,1fr)_repeat(3,auto)]";
const SUBGRID = "tw:col-span-full tw:grid tw:grid-cols-subgrid";
const EFFECT_ROW = `${SUBGRID} tw:items-center u-py-2 tw:not-first:border-t tw:border-t-border-soft`;
const CELL = "tw:pl-3 u-fs-sm u-text-dim u-nowrap";
const EFFECT_ICON =
  "tw:grid tw:size-8 tw:flex-none tw:place-items-center tw:bg-ink tw:font-semibold tw:text-(length:--fs-md) tw:text-stamp-text";
const EFFECT_NAME =
  "tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-semibold tw:text-(length:--fs-md) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold";

function EffectControls({ effect }: { effect: EffectRow }) {
  const { actor, canEdit } = useOscSheetContext();
  if (effect.fixed)
    return (
      <span
        className="u-inline-flex u-text-dim"
        role="img"
        aria-label={localize("OSE.effects.Fixed")}
        title={localize("OSE.effects.Fixed")}
      >
        <i className="fas fa-lock" aria-hidden="true" />
      </span>
    );
  if (!canEdit) return null;
  const toggleLabel = localize(
    effect.disabled ? "OSE.effects.Enable" : "OSE.effects.Disable",
  );
  return (
    <span className="u-inline-flex u-items-center u-gap-1">
      <IconButton
        size="sm"
        variant="accent"
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={() => void toggleEffect(effect.uuid)}
      >
        <i
          className={`fas ${effect.disabled ? "fa-toggle-off" : "fa-toggle-on"}`}
          aria-hidden="true"
        />
      </IconButton>
      <IconButton
        size="sm"
        variant="accent"
        aria-label={localize("OSE.effects.Edit")}
        title={localize("OSE.effects.Edit")}
        onClick={() => editEffect(effect.uuid)}
      >
        <i className="fas fa-edit" aria-hidden="true" />
      </IconButton>
      {effect.source ? (
        <IconButton
          size="sm"
          disabled
          aria-label={localize("OSE.effects.FromItem")}
          title={localize("OSE.effects.FromItem")}
        >
          <i className="fas fa-trash" aria-hidden="true" />
        </IconButton>
      ) : (
        <IconButton
          size="sm"
          variant="danger"
          aria-label={localize("OSE.Delete")}
          title={localize("OSE.Delete")}
          onClick={() => void deleteEffect(actor, effect.uuid)}
        >
          <i className="fas fa-trash" aria-hidden="true" />
        </IconButton>
      )}
    </span>
  );
}

export function EffectsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { actor, canEdit } = useOscSheetContext();
  if (!open) return null;
  const groups = selectEffectGroups(actor).filter(
    (group) => group.key === "passive" || group.effects.length > 0,
  );
  return (
    <Modal
      open
      title={localize("OSE.category.effects")}
      onClose={onClose}
      className="modal-inset"
      footer={
        canEdit ? (
          <InlineButton
            variant="link"
            size="sm"
            onClick={() => void createEffect(actor)}
          >
            <i className="fas fa-plus" aria-hidden="true" />{" "}
            {localize("OSE.effects.Create")}
          </InlineButton>
        ) : undefined
      }
    >
      <div className={EFFECTS_GRID}>
        {groups.map((group) => (
          <section
            key={group.key}
            aria-label={localize(group.label)}
            className={`${SUBGRID} tw:not-first:mt-(--spacer-3)`}
          >
            <ColumnHeaderRow
              title={localize(group.label)}
              columns={[
                localize("OSE.effects.Source"),
                localize("OSE.effects.Duration"),
              ]}
            />
            <ul className={`${SUBGRID} tw:m-0 tw:list-none tw:p-0`}>
              {group.effects.length === 0 ? (
                <li className="tw:col-span-full u-py-2 u-fs-sm u-text-dim">
                  {localize("OSE.effects.None")}
                </li>
              ) : (
                group.effects.map((effect) => (
                  <li
                    key={effect.uuid + effect.name}
                    className={`${EFFECT_ROW} ${effect.disabled ? "tw:opacity-60" : ""}`}
                  >
                    <span className="u-row u-gap-3 tw:min-w-0">
                      <Monogram
                        img={effect.img}
                        monogram={(
                          effect.name.trim().charAt(0) || "?"
                        ).toUpperCase()}
                        className={EFFECT_ICON}
                        imgClassName="tw:object-cover"
                      />
                      <button
                        type="button"
                        className={EFFECT_NAME}
                        onClick={() => editEffect(effect.uuid)}
                      >
                        {effect.name}
                      </button>
                    </span>
                    <span className={CELL}>
                      {effect.source ?? localize("OSE.effects.Actor")}
                    </span>
                    <span className={CELL}>{effect.duration}</span>
                    <span className="tw:justify-self-end tw:pl-3">
                      <EffectControls effect={effect} />
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
