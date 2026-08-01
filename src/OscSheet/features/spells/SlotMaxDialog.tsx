import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";
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
  /** The level's effective maximum — the stored override, else the class default. */
  max: number;
  /** Rulebook maximum; null when no class entry matches this character's class+level. */
  defaultMax: number | null;
};

/**
 * Pencil in the level head → a dialog that sets this level's slot maximum.
 * The class tables can't describe custom classes or house rules, so the stored
 * value always wins; the default line doubles as the button that puts the
 * rulebook number back, and drops out entirely when no class+level entry
 * resolves. Renders nothing on a read-only sheet.
 */
export function SlotMaxDialog({ level, max, defaultMax }: Props) {
  const { actor, canEdit, updateActor } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(max);
  // A CSS animation plays whenever its class is present, mount included — so the
  // class is set by the change itself, never derived from the current value. Open
  // at the default and no animation class exists to play.
  const [anim, setAnim] = useState<"in" | "out" | null>(null);
  if (!canEdit) return null;

  const label = `Edit Level ${level} slots`;
  // Canonical class name — the same spelling the header shows. Only ever read
  // when a default resolved, so the class is one the tables matched.
  const { class: rawClass, level: charLevel } = actor.system.details;
  const cls = normalizeClassName(rawClass) ?? rawClass;
  // No article and no pluralised class name: OseClass carries neither a plural
  // nor an article, and both would mangle names like Elf, Assassin or a custom class.
  const tip =
    `Level ${charLevel} ${cls} — ${defaultMax} Level ${level} spell ` +
    `${defaultMax === 1 ? "slot" : "slots"} by default.`;
  // Nothing to reset to while the field already holds the default.
  const hidden = draft === defaultMax;
  // The only two ways the value moves while the dialog is open.
  const commit = (n: number) => {
    if (hidden !== (n === defaultMax)) setAnim(n === defaultMax ? "out" : "in");
    setDraft(n);
  };
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
          setAnim(null); // reopening is a fresh resting state, not a change
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
          // The sub-input line rides in Field's own hint slot, so all three pieces
          // stack on the ONE gap the primitive owns — no margin of ours to reconcile.
          hint={
            defaultMax == null ? (
              <span className="tw:italic">
                No rulebook default for this class and level — this level holds whatever you set
                here.
              </span>
            ) : (
              // Mounted and laid out whether or not it shows, so it can animate BOTH
              // ways and the dialog never resizes around it. `.is-out` is the resting
              // hidden state; the fade classes (styles.scss) are added only by an
              // actual change, so opening the dialog animates nothing. At the default
              // there is nothing to reset to, so the link and its tooltip go together —
              // keyed to the live field, not the stored value.
              <span
                className={cx(
                  "osc-slotdefaults tw:inline-flex tw:items-center tw:gap-1",
                  hidden && "is-out",
                  anim === "in" && "fade-in",
                  anim === "out" && "fade-out",
                )}
                // Belt and braces with `visibility: hidden`: no tab stop and no
                // hoverable tooltip even if the stylesheet never loads.
                inert={hidden}
              >
                {/* The edit modal's reset link, reused whole: same teal dotted
                    treatment, same condition (value differs from its default).
                    `.ed-resetlink` is auto-scoped to `.osc-sheet`, not to the edit
                    modal's fields, so it styles correctly here. Only the wording is
                    ours — the component takes the label as content. */}
                <OverrideValue
                  overridden
                  className="osc-slotdefault tw:self-center"
                  defaultText={`Default ${defaultMax}`}
                  onResetRequest={() => commit(defaultMax)}
                />
                {/* Hover AND focus reveal the same sentence (HoverPop listens to both);
                    the aria-label carries it for anyone who sees neither. */}
                <IconButton size="sm" className="osc-slotinfo" aria-label={tip}>
                  <i className="fa-solid fa-circle-info" aria-hidden="true" />
                  <HoverPop
                    align="center"
                    className="osc-slot-tip tw:max-w-[220px] tw:font-sans tw:text-[length:var(--fs-xs)] tw:leading-snug tw:text-text-dim"
                  >
                    {tip}
                  </HoverPop>
                </IconButton>
              </span>
            )
          }
        >
          <NumberInput
            className="input mono osc-slotmax tw:w-[8ch]"
            value={draft}
            min={0}
            onCommit={commit}
          />
        </Field>
      </Modal>
    </>
  );
}
