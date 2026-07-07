// "Send Item" dialog: pick a target actor, optionally split a stack, and send.
// Composed from DS primitives (Modal / Monogram / Tag / Stepper / Button). Targets
// I own send directly; cross-owner targets relay through a GM and are disabled
// when no GM is online.
import { useEffect, useState } from "react";
import { Modal } from "@ui/Modal";
import { Monogram } from "@ui/Monogram";
import { Tag } from "@ui/Tag";
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
        disabled={!valid}
        onClick={() => selected && onSend(selected, stacked ? qty : max)}
      >
        Send
      </Button>
    </>
  );

  return (
    <Modal open={open} title={`Send ${item.name}`} onClose={onClose} footer={footer}>
      {targets.length === 0 ? (
        <p className="osc-send-empty">No other party members to send to.</p>
      ) : (
        <ul className="osc-send-targets">
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
                  title={blocked ? "No GM online to relay this transfer" : undefined}
                  onClick={() => setSelectedId(t.id)}
                >
                  <Monogram
                    img={t.img}
                    monogram={initials(t.name)}
                    className="osc-send-target-ic"
                  />
                  <span className="osc-send-target-nm">{t.name}</span>
                  {t.crossOwner && <Tag intent="mustard">via GM</Tag>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {stacked && (
        <div className="osc-send-qty">
          <span className="osc-send-qty-label">Quantity</span>
          <Stepper value={qty} onValueChange={setQty} min={1} max={max} />
          <span className="osc-send-qty-of">of {max}</span>
        </div>
      )}

      {item.isContainer && contentCount > 0 && (
        <p className="osc-send-note">
          Includes {contentCount} {contentCount === 1 ? "item" : "items"} inside.
        </p>
      )}
    </Modal>
  );
}
