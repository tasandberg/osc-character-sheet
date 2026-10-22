import { useState } from "react";
import { Modal } from "@ui/Modal";
import { Monogram } from "@ui/Monogram";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";
import type { AttackTargetVM } from "@features/actions/attackTargets";

type Props = {
  targets: AttackTargetVM[];
  onCancel: () => void;
  onConfirm: (target: AttackTargetVM | null) => void;
};

export function TargetDialog({ targets, onCancel, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = targets.find((t) => t.id === selectedId) ?? null;

  const footer = (
    <>
      <Button variant="link" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => onConfirm(selected)}>
        {selected ? `Attack ${selected.name}` : "Roll without target"}
      </Button>
    </>
  );

  return (
    <Modal
      open
      title={
        <>
          <i className="fa-solid fa-crosshairs" aria-hidden="true" />
          Choose a target
        </>
      }
      onClose={onCancel}
      footer={footer}
      className="modal-inset osc-target-modal"
    >
      {targets.length === 0 ? (
        <p className="u-fs-xs u-text-dim">No visible tokens in this scene.</p>
      ) : (
        <ul className="osc-attack-targets u-stack u-gap-0">
          {targets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={cx(
                  "osc-attack-target u-row u-gap-3 u-px-2 u-py-1 u-fs-md u-text",
                  selectedId === t.id && "is-selected",
                )}
                aria-pressed={selectedId === t.id}
                onClick={() => setSelectedId(t.id)}
              >
                <Monogram
                  img={t.img}
                  monogram={(t.name.trim().charAt(0) || "?").toUpperCase()}
                  className="osc-attack-target-ic u-r-sm u-bg-2"
                />
                <span className="u-flex-1">{t.name}</span>
                <span className="u-fs-xs u-text-dim">{t.disposition}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
