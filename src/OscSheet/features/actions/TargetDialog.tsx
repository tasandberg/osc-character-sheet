import { Modal } from "@ui/Modal";
import { Monogram } from "@ui/Monogram";
import { Button } from "@ui/Button";
import { cx } from "@ui/cx";
import type {
  AttackTargetVM,
  TokenDisposition,
} from "@features/actions/attackTargets";

const DISPOSITION_TONES: Record<TokenDisposition, string> = {
  HOSTILE: "u-text-danger",
  NEUTRAL: "u-text-warn",
  FRIENDLY: "u-text-success",
  SECRET: "u-text-dim",
};

type Props = {
  targets: AttackTargetVM[];
  rollType?: string;
  onCancel: () => void;
  onConfirm: (target: AttackTargetVM | null) => void;
};

export function TargetDialog({
  targets,
  rollType,
  onCancel,
  onConfirm,
}: Props) {
  const footer = (
    <>
      <Button variant={rollType ? "link" : undefined} onClick={onCancel}>
        Close
      </Button>
      {rollType && (
        <Button variant="primary" onClick={() => onConfirm(null)}>
          Roll {rollType} without target
        </Button>
      )}
    </>
  );

  return (
    <Modal
      open
      title={
        <>
          <i className="fa-solid fa-crosshairs" aria-hidden="true" />
          {rollType ? `Choose a target for ${rollType}` : "Choose a target"}
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
                className="osc-attack-target u-row u-gap-3 u-px-2 u-py-1 u-fs-md u-text"
                onClick={() => onConfirm(t)}
              >
                <Monogram
                  img={t.img}
                  monogram={(t.name.trim().charAt(0) || "?").toUpperCase()}
                  className="osc-attack-target-ic u-r-sm u-bg-2"
                />
                <span className="u-flex-1">{t.name}</span>
                <span
                  className={cx(
                    "u-fs-xs",
                    t.dispositionKey
                      ? DISPOSITION_TONES[t.dispositionKey]
                      : "u-text-dim",
                  )}
                >
                  {t.disposition}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
