import { useOscSheetContext } from "@app/context";
import { Modal, IconButton, InlineButton, Table, Th, Td, Tr } from "@ui";
import {
  createEffect,
  deleteEffect,
  editEffect,
  selectEffectGroups,
  toggleEffect,
  type EffectRow,
} from "./effects";

const localize = (key: string) => game.i18n.localize(key);

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
  const groups = selectEffectGroups(actor);
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
      <div className="u-stack u-gap-4">
        {groups.map((group) => (
          <Table key={group.key} aria-label={localize(group.label)}>
            <thead>
              <Tr>
                <Th>{localize(group.label)}</Th>
                <Th>{localize("OSE.effects.Source")}</Th>
                <Th>{localize("OSE.effects.Duration")}</Th>
                <Th />
              </Tr>
            </thead>
            <tbody>
              {group.effects.length === 0 ? (
                <Tr>
                  <Td colSpan={4} className="dim">
                    {localize("OSE.effects.None")}
                  </Td>
                </Tr>
              ) : (
                group.effects.map((effect) => (
                  <Tr
                    key={effect.uuid + effect.name}
                    className={effect.disabled ? "tw:opacity-60" : undefined}
                  >
                    <Td>
                      <span className="u-row">
                        <img
                          src={effect.img}
                          alt=""
                          className="tw:size-6 tw:flex-none u-r-sm"
                        />
                        <InlineButton
                          variant="link"
                          onClick={() => editEffect(effect.uuid)}
                        >
                          {effect.name}
                        </InlineButton>
                      </span>
                    </Td>
                    <Td>{effect.source ?? localize("OSE.effects.Actor")}</Td>
                    <Td>{effect.duration}</Td>
                    <Td className="tw:text-right">
                      <EffectControls effect={effect} />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        ))}
      </div>
    </Modal>
  );
}
