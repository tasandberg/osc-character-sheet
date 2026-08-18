import { useOscSheetContext } from "@app/context";
import { MenuItem, MenuLabel } from "@ui/Menu";
import {
  ITEM_ACTIONS,
  type ItemActionCtx,
} from "@features/inventory/itemActions";
import { useInventoryActions } from "@features/inventory/useInventoryActions";
import { useSendItem } from "@features/inventory/sendItemContext";
import type { CtxItem } from "@features/inventory/types";
import type { InventoryItemVM } from "@domain/vm-types";

export function ItemMenuBody({
  item,
  vm = null,
  onClose,
}: {
  item: CtxItem;
  vm?: InventoryItemVM | null;
  onClose: () => void;
}) {
  const { canEdit } = useOscSheetContext();
  const ops = useInventoryActions();
  const sendItem = useSendItem();
  const ctx: ItemActionCtx = { item, vm, canEdit, ops, sendItem };
  return (
    <>
      <MenuLabel>{item.name}</MenuLabel>
      {ITEM_ACTIONS.filter((a) => a.show(ctx)).map((a) => (
        <MenuItem
          key={a.key}
          icon={<i className={a.icon} aria-hidden="true" />}
          danger={a.danger}
          tabIndex={0}
          onClick={() => {
            a.run(ctx);
            onClose();
          }}
        >
          {a.label}
        </MenuItem>
      ))}
      <div className="osc-item-menu-addtions"></div>
    </>
  );
}
