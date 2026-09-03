import { useState } from "react";
import { useOscSheetContext } from "@app/context";
import {
  rationDaysLeft,
  selectRations,
  timeSinceInWords,
  worldTimeNow,
} from "@features/camp/rations";
import { FLAGS, readFlag, setFlag } from "@domain/flags";
import {
  countRestorableSpells,
  restoreAllSpells,
  selectSpellLevels,
} from "@features/spells/spells";
import { consumeToast } from "@features/inventory/consumeToast";
import { ItemImage } from "@features/inventory/ItemImage";
import { monogram } from "@features/inventory/monogram";
import { Button } from "@ui/Button";
import { Empty } from "@ui/Empty";
import { Modal } from "@ui/Modal";
import { SectionTitle } from "@ui/SectionTitle";
import { useToast } from "@ui/toastContext";
import { clsx } from "clsx";

const ACTION_BUTTON = "u-inline-flex u-items-center u-gap-2";

/** Green check standing in for a section's action when there is nothing to do. */
function ReadyStatus({ label }: { label: string }) {
  return (
    <span className="tw:font-sans u-fs-xs u-text-success u-inline-flex u-items-center u-gap-2">
      <i className="fa-solid fa-check" aria-hidden="true" />
      {label}
    </span>
  );
}

type Props = { open: boolean; onClose: () => void };

/** Camp actions, each manual: eat a ration, roll the OSE recovery die (1d3 HP
 *  for a full day's rest), and Study to restore spells. */
export function CampModal({ open, onClose }: Props) {
  const { actor, items, updateActor } = useOscSheetContext();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ateRation, setAteRation] = useState(false);

  const rations = selectRations(items);
  const daysLeft = rationDaysLeft(rations);
  const lastAteAt = readFlag<number>(actor, FLAGS.lastAteAt);
  const now = worldTimeNow();
  const sinceAte =
    lastAteAt !== undefined && now !== undefined && now >= lastAteAt
      ? now - lastAteAt
      : undefined;
  const { value: hp, max: hpMax } = actor.system.hp;
  const spellLevels = selectSpellLevels(actor, undefined, items);
  // OSE fills `spells.slots` with zeroed levels for everyone, so `enabled` alone
  // isn't a caster test — require actual capacity or a known spell.
  const isCaster =
    actor.system.spells.enabled &&
    spellLevels.some((l) => l.slots.max > 0 || l.spellbook.length > 0);
  const spellsToRestore = countRestorableSpells(spellLevels);

  const onEat = (id: string) => {
    const it = rations.find((r) => r._id === id);
    if (!it) return;
    const cur = it.system.quantity?.value ?? 0;
    if (cur <= 0) return;
    const next = cur - 1;
    void (
      actor as unknown as {
        updateEmbeddedDocuments(
          type: string,
          updates: Record<string, unknown>[],
        ): Promise<unknown>;
      }
    ).updateEmbeddedDocuments("Item", [
      { _id: id, "system.quantity.value": next },
    ]);
    const now = worldTimeNow();
    if (now !== undefined) void setFlag(actor, FLAGS.lastAteAt, now);
    setAteRation(true);
    setPickerOpen(false);
    const t = consumeToast(it.name ?? "ration", cur, next);
    if (t)
      toast({
        ...t,
        icon: <i className="fa-solid fa-drumstick-bite" aria-hidden="true" />,
      });
  };

  const onRest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const roll = await new Roll("1d3").evaluate();
      const speaker = ChatMessage.getSpeaker({ actor });
      void roll.toMessage(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { speaker, flavor: "Recovery — a full day's rest (1d3)" } as any,
      );
      const healed = Math.min(hpMax - hp, roll.total ?? 0);
      if (healed > 0) await updateActor({ "system.hp.value": hp + healed });
      toast({
        intent: "success",
        title: `Recovered ${healed} HP`,
        message: `${hp + healed} / ${hpMax}`,
        icon: <i className="fa-solid fa-campfire" aria-hidden="true" />,
      });
    } finally {
      setBusy(false);
    }
  };

  const onStudy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { spellsRestored } = await restoreAllSpells(actor, items);
      toast({
        intent: "success",
        title:
          spellsRestored > 0
            ? `Restored ${spellsRestored} ${spellsRestored === 1 ? "spell" : "spells"}`
            : "Spells already fresh",
        icon: <i className="fa-solid fa-book-open" aria-hidden="true" />,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <>
          Camp <span className="hint">food and rest</span>
        </>
      }
      onClose={onClose}
      className="modal-inset"
    >
      <div className="u-stack u-gap-8">
        <section className="u-stack u-gap-2">
          <div className="u-row u-gap-3">
            <SectionTitle variant="plain" className="u-flex-1">
              Provisions
            </SectionTitle>
            <Button
              disabled={daysLeft === 0}
              className={ACTION_BUTTON}
              onClick={() => setPickerOpen(true)}
            >
              <i
                className={clsx(
                  "fa-solid",
                  ateRation ? "fa-check" : "fa-drumstick-bite",
                )}
                aria-hidden="true"
              />
              Eat Ration
            </Button>
          </div>
          <span className="tw:font-sans u-fs-sm u-text-dim">
            <span className="mono u-fs-xs u-text">{daysLeft}</span>{" "}
            {daysLeft === 1 ? "day" : "days"} of rations left
            {sinceAte !== undefined && (
              <span
                className={sinceAte > 86400 ? "u-text-danger" : "u-text-muted"}
              >
                {" · "}
                {timeSinceInWords(sinceAte)} since last ration
              </span>
            )}
          </span>
        </section>
        <section className="u-stack u-gap-2">
          <div className="u-row u-gap-3">
            <SectionTitle variant="plain" className="u-flex-1">
              Rest
            </SectionTitle>
            {hp >= hpMax ? (
              <ReadyStatus label="Full health" />
            ) : (
              <Button
                disabled={busy}
                className={ACTION_BUTTON}
                onClick={() => void onRest()}
              >
                <i className="fa-solid fa-dice-d6" aria-hidden="true" />
                Roll 1d3
              </Button>
            )}
          </div>
          <span className="tw:font-sans u-fs-sm u-text-dim">
            Recover <span className="mono u-fs-xs u-text">1d3</span> for a full
            day's rest
            <span className="u-text-muted">
              {" · HP "}
              <span className="mono u-fs-xs">
                {hp}/{hpMax}
              </span>
            </span>
          </span>
        </section>
        {isCaster && (
          <section className="u-stack u-gap-2">
            <div className="u-row u-gap-3">
              <SectionTitle variant="plain" className="u-flex-1">
                Study
              </SectionTitle>
              {spellsToRestore === 0 ? (
                <ReadyStatus label="Fully prepared" />
              ) : (
                <Button
                  disabled={busy}
                  className={ACTION_BUTTON}
                  onClick={() => void onStudy()}
                >
                  <i className="fa-solid fa-book-open" aria-hidden="true" />
                  Study
                </Button>
              )}
            </div>
            <span className="tw:font-sans u-fs-sm u-text-dim">
              {spellsToRestore === 0 ? (
                "Re-memorize spells from the book"
              ) : (
                <>
                  Re-memorize{" "}
                  <span className="mono u-fs-xs u-text">{spellsToRestore}</span>{" "}
                  {spellsToRestore === 1 ? "spell" : "spells"}
                </>
              )}
            </span>
          </section>
        )}
      </div>
      <Modal
        open={pickerOpen}
        title="Eat a ration"
        onClose={() => setPickerOpen(false)}
        className="modal-inset"
      >
        {rations.length === 0 ? (
          <Empty title="No rations left" />
        ) : (
          <div className="u-stack u-gap-2">
            {rations.map((it) => (
              <button
                key={it._id}
                type="button"
                className="btn ghost u-row u-gap-3 u-items-center"
                onClick={() => onEat(it._id!)}
              >
                <ItemImage
                  img={it.img ?? ""}
                  monogram={monogram(it.name ?? "")}
                />
                <span className="u-flex-1 tw:text-left tw:normal-case tw:tracking-normal u-fs-sm">
                  {it.name}
                </span>
                <span className="mono u-fs-xs u-text-muted">
                  ×{it.system.quantity?.value ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </Modal>
  );
}
