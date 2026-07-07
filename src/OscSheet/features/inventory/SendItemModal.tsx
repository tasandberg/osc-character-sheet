// "Send Item" dialog: pick a target actor, optionally split a stack, and send.
// Composed from DS primitives (Modal / Monogram / Tag / Stepper / Button). Targets
// I own send directly; cross-owner targets relay through a GM and are disabled
// when no GM is online.
import { useEffect, useState } from "react";
import { Modal } from "@ui/Modal";
import { Monogram } from "@ui/Monogram";
import { Stepper } from "@ui/Stepper";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";
import type { InventoryItemVM } from "@domain/vm-types";
import type { SendTargetVM } from "@features/inventory/sendTargets";

type Props = {
  open: boolean;
  item: InventoryItemVM;
  /** Descendant count when `item` is a container (0 otherwise). */
  contentCount: number;
  targets: SendTargetVM[];
  gmOnline: boolean;
  onClose: () => void;
  /** Fire the transfer: chosen target + quantity to send. */
  onSend: (target: SendTargetVM, qty: number) => void;
};

/** 2-letter initials for the target's monogram fallback. */
function initials(name: string): string {
  const words = name.match(/[A-Za-z]+/g) ?? [];
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function SendItemModal({
  open,
  item,
  contentCount,
  targets,
  gmOnline,
  onClose,
  onSend,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  // Reset selection/qty whenever a new item opens the dialog.
  useEffect(() => {
    setSelectedId(null);
    setQty(1);
  }, [item.id]);

  const max = item.quantity?.value ?? 1;
  const stacked = !item.isContainer && max > 1;
  const selected = targets.find((t) => t.id === selectedId) ?? null;
  const relayBlocked = (t: SendTargetVM) => t.crossOwner && !gmOnline;
  const valid = selected != null && !relayBlocked(selected);

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        disabled={!valid || targets.length === 0}
        onClick={() => selected && onSend(selected, stacked ? qty : max)}
      >
        Send
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      title={`Send ${item.name}`}
      onClose={onClose}
      footer={footer}
    >
      {/* The item being sent: art, name, and (for stacks) a quantity stepper. */}
      <div className="u-row u-gap-3">
        <Monogram
          img={item.img}
          monogram={initials(item.name)}
          className="osc-send-target-ic"
        />
        <span className="u-flex-1">{item.name}</span>
        {stacked && (
          <div className="u-row u-gap-2">
            <Stepper value={qty} onValueChange={setQty} min={1} max={max} />
            <span className="u-fs-sm u-text-muted">of {max}</span>
          </div>
        )}
      </div>

      {item.isContainer && contentCount > 0 && (
        <p className="u-mt-2 u-fs-sm u-text-muted">
          Includes {contentCount} {contentCount === 1 ? "item" : "items"}{" "}
          inside.
        </p>
      )}

      {/* Target characters: visible, non-hostile scene tokens. */}
      {targets.length === 0 ? (
        <p className="u-pt-3 u-fs-lg u-text-muted">
          No visible characters in this scene to send to.
        </p>
      ) : (
        <div className="u-mt-4 u-stack u-gap-2">
          <label className="field-label">Send item(s) to:</label>
          <ul className="osc-send-targets u-stack u-gap-1">
            {targets.map((t) => {
              const blocked = relayBlocked(t);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={cx(
                      "osc-send-target",
                      selectedId === t.id && "is-selected",
                    )}
                    disabled={blocked}
                    aria-pressed={selectedId === t.id}
                    title={
                      blocked
                        ? "A GM must be online to send to this character"
                        : undefined
                    }
                    onClick={() => setSelectedId(t.id)}
                  >
                    <Monogram
                      img={t.img}
                      monogram={initials(t.name)}
                      className="osc-send-target-ic"
                    />
                    <span className="u-flex-1">{t.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
}
