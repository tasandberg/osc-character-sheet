import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { IconButton } from "@ui/IconButton";
import { InlineButton } from "@ui/InlineButton";
import { Modal } from "@ui/Modal";
import { NumberInput } from "@ui/NumberInput";
import { slotMaxPath } from "@features/spells/spells";

type Props = {
  level: number;
  /** The level's effective maximum — the stored override, else the class default. */
  max: number;
  /** Rulebook maximum; null when no class entry matches this character's class+level. */
  defaultMax: number | null;
};

/**
 * Pencil in the level head → a dialog that sets this level's slot maximum.
 * The class tables can't describe custom classes or house rules, so the stored
 * value always wins; "Set to default" puts the rulebook number back, and the
 * whole default row is dropped when there is no matching class+level entry.
 * Renders nothing on a read-only sheet.
 */
export function SlotMaxDialog({ level, max, defaultMax }: Props) {
  const { canEdit, updateActor } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(max);
  if (!canEdit) return null;

  const label = `Edit Level ${level} slots`;
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
        className="osc-slotedit"
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
        <label className="tw:flex tw:items-center tw:gap-3">
          <NumberInput
            className="input mono osc-slotmax tw:w-[6ch]"
            value={draft}
            min={0}
            onCommit={setDraft}
          />
          <span className="tw:font-sans tw:text-[length:var(--fs-sm)] tw:text-text-dim">
            slots memorisable at level {level}
          </span>
        </label>

        <p className="tw:mt-4 tw:flex tw:flex-wrap tw:items-baseline tw:gap-2 tw:font-sans tw:text-[length:var(--fs-sm)] tw:text-text-mute">
          {defaultMax == null ? (
            <span className="tw:italic">
              No rulebook default for this class and level — this level holds whatever you set here.
            </span>
          ) : (
            <>
              <span>
                Default Level {level} slots for your class and level: {defaultMax}
              </span>
              <InlineButton onClick={() => setDraft(defaultMax)}>Set to default</InlineButton>
            </>
          )}
        </p>
      </Modal>
    </>
  );
}
