import { type ReactNode } from "react";
import type { OnContext } from "../types";
import type {
  InventoryItemVM,
  InventorySortKey,
} from "@src/OscSheet/domain/vm-types";
import { ItemImage } from "../ItemImage";
import { countedLoad, loadText, loadHeading } from "../groups";
import { DragHandle, InlineUse, NameCell, RowEquip, RowMore } from "./cells";
import { UsesRow } from "./UsesRow";
import { INV_ROWCAT, INV_WT } from "./classes";

export type RowCtx = {
  item: InventoryItemVM;
  canEdit: boolean;
  variant?: string;
  onEquip: (id: string) => void;
  onOpen: (id: string) => void;
  onSetQty: (id: string, value: number) => void;
  onMore: OnContext;
  nameSlots?: { badge?: ReactNode; trailing?: ReactNode };
};

export type InvColumn = {
  key: string;
  /** Raw CSS grid track. */
  width: string;
  headerSpan?: number;
  header?: (o: { variant?: string }) => ReactNode;
  headerClass?: string;
  sort?: InventorySortKey;
  hideAt?: "xs";
  cell: (ctx: RowCtx) => ReactNode;
};

export const INV_COLUMNS: InvColumn[] = [
  { key: "drag", width: "18px", cell: () => <DragHandle /> },
  {
    key: "img",
    width: "30px",
    header: () => "Item",
    headerSpan: 2,
    headerClass: "osc-inv-th-item",
    sort: "name",
    cell: (c) => <ItemImage img={c.item.img} monogram={c.item.monogram} />,
  },
  {
    key: "name",
    width: "1fr",
    cell: (c) => {
      const stacked = !c.item.isContainer && c.item.quantity != null;
      return (
        <NameCell
          item={c.item}
          onOpen={c.onOpen}
          badge={c.nameSlots?.badge}
          trailing={c.nameSlots?.trailing}
          action={
            stacked && c.canEdit ? (
              <InlineUse item={c.item} onSetQty={c.onSetQty} />
            ) : undefined
          }
          below={
            stacked ? (
              <UsesRow
                item={c.item}
                canEdit={c.canEdit}
                onSetQty={c.onSetQty}
              />
            ) : undefined
          }
        />
      );
    },
  },
  {
    key: "cat",
    width: "calc(var(--fs-base, 16px) * 3.25)",
    header: () => "Type",
    headerClass: "osc-inv-th-cat tw:justify-self-start tw:@max-md/app:hidden",
    sort: "category",
    hideAt: "xs",
    cell: (c) => <span className={INV_ROWCAT}>{c.item.category}</span>,
  },
  {
    key: "load",
    width: "calc(var(--fs-base, 16px) * 2.75)",
    header: (o) => loadHeading(o.variant).column,
    headerClass: "osc-inv-th-wt tw:justify-self-center",
    sort: "weight",
    cell: (c) => (
      <span className={INV_WT}>{loadText(countedLoad(c.item, c.variant))}</span>
    ),
  },
  {
    key: "equip",
    width: "calc(var(--fs-base, 16px) * 2.75)",
    header: () => "Equip",
    cell: (c) => <RowEquip item={c.item} onEquip={c.onEquip} />,
  },
  {
    key: "more",
    width: "calc(var(--fs-base, 16px) * 1.5)",
    cell: (c) => <RowMore item={c.item} onMore={c.onMore} />,
  },
];

export const trackTemplate = (cols: InvColumn[]) =>
  cols.map((c) => c.width).join(" ");

export const XS_COLUMNS = INV_COLUMNS.filter((c) => c.hideAt !== "xs");
