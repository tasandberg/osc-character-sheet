import { useOscSheetContext } from "@app/context";
import type { OseItem } from "@domain/types";
import {
  eatRation,
  rationDaysLeft,
  secondsSinceLastAte,
  selectRations,
  timeSinceInWords,
} from "@features/camp/rations";
import { consumeToast } from "@features/inventory/consumeToast";
import { ItemImage } from "@features/inventory/ItemImage";
import { monogram } from "@features/inventory/monogram";
import { Button } from "@ui/Button";
import { Modal } from "@ui/Modal";
import { useToast } from "@ui/toastContext";

type Props = { item: OseItem | null; onClose: () => void };

export function EatRationModal({ item, onClose }: Props) {
  const { actor, items, canEdit } = useOscSheetContext();
  const toast = useToast();
  if (!item) return null;

  const count = item.system.quantity?.value ?? 0;
  const daysLeft = rationDaysLeft(selectRations(items));
  const sinceAte = secondsSinceLastAte(actor);

  const onEat = () => {
    const eaten = canEdit ? eatRation(actor, item) : undefined;
    onClose();
    const t =
      eaten && consumeToast(item.name ?? "ration", eaten.cur, eaten.next);
    if (t)
      toast({
        ...t,
        icon: <i className="fa-solid fa-utensils" aria-hidden="true" />,
      });
  };

  const footer = (
    <>
      <Button variant="link" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        className="u-inline-flex u-items-center u-gap-2"
        disabled={!canEdit || count <= 0}
        onClick={onEat}
      >
        <i className="fa-solid fa-utensils" aria-hidden="true" />
        Eat Ration
      </Button>
    </>
  );

  return (
    <Modal
      open
      title={
        <>
          <i className="fa-solid fa-utensils" />
          Eat a ration
        </>
      }
      onClose={onClose}
      footer={footer}
      className="modal-inset"
    >
      <div className="u-stack u-gap-2">
        <div className="u-row u-gap-3 u-items-center">
          <ItemImage
            img={item.img ?? ""}
            monogram={monogram(item.name ?? "")}
          />
          <span className="u-flex-1 u-fs-sm">{item.name}</span>
          <span className="mono u-fs-xs u-text-muted">×{count}</span>
        </div>
        <span className="tw:font-sans u-fs-sm u-text-dim">
          <span className="mono u-fs-xs u-text">{daysLeft}</span>{" "}
          {daysLeft === 1 ? "day" : "days"} of rations left
          <span
            className={
              sinceAte !== undefined && sinceAte > 86400
                ? "u-text-danger"
                : "u-text-muted"
            }
          >
            {" · "}
            {sinceAte !== undefined
              ? `${timeSinceInWords(sinceAte)} since last ration`
              : "no meal recorded yet"}
          </span>
        </span>
      </div>
    </Modal>
  );
}
