import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { IconButton } from "@ui/IconButton";
import { Field } from "@ui/Field";
import { OverrideValue } from "@ui/OverrideValue";
import { HoverPop } from "@ui/HoverPop";
import { Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { normalizeClassName } from "@domain/classRules";
import { slotMaxPath } from "@features/spells/spells";

type Props = {
  level: number;
  max: number;
  defaultMax: number | null;
};

export function SlotMaxDialog({ level, max, defaultMax }: Props) {
  const { actor, canEdit, updateActor } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(max);
  if (!canEdit) return null;

  const label = `Edit Level ${level} slots`;
  const { class: rawClass, level: charLevel } = actor.system.details;
  const cls = normalizeClassName(rawClass) ?? rawClass;
  const tip =
    `Level ${charLevel} ${cls} — ${defaultMax} Level ${level} spell ` +
    `${defaultMax === 1 ? "slot" : "slots"} by default.`;
  const overridden = draft !== defaultMax;
  const close = () => setOpen(false);
  const save = () => {
    void updateActor({ [slotMaxPath(level)]: draft });
    close();
  };

  return (
    <>
      <IconButton
        variant="accent"
        size="sm"
        data-testid="slot-edit"
        title={label}
        aria-label={label}
        onClick={() => {
          setDraft(max);
          setOpen(true);
        }}
      >
        <i className="fa-solid fa-pen" aria-hidden="true" />
      </IconButton>

      <Modal
        open={open}
        title={`Level ${level} spell slots`}
        onClose={close}
        className="modal-inset osc-slot-modal"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        <Field
          label={`Level ${level} spell slots:`}
          hint={
            defaultMax == null ? undefined : (
              <span
                data-testid="slot-defaults"
                className="tw:inline-flex tw:items-center tw:gap-1"
              >
                <OverrideValue
                  overridden={overridden}
                  className="osc-slotdefault tw:self-center"
                  defaultText={`default ${defaultMax}`}
                  onResetRequest={() => setDraft(defaultMax)}
                />
                <IconButton size="sm" data-testid="slot-info" aria-label={tip}>
                  <i className="fa-solid fa-circle-info" aria-hidden="true" />
                  <HoverPop
                    align="center"
                    data-testid="slot-tip"
                    className="tw:max-w-[220px] tw:font-sans tw:text-(length:--fs-xs) tw:leading-snug tw:text-text-dim"
                  >
                    {tip}
                  </HoverPop>
                </IconButton>
              </span>
            )
          }
        >
          <NumberInput
            className="input mono tw:w-[8ch]"
            data-testid="slot-max"
            value={draft}
            min={0}
            onCommit={setDraft}
          />
        </Field>
      </Modal>
    </>
  );
}
