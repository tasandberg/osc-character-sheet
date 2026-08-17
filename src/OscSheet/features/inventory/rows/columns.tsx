import type { ReactNode } from "react";
import type { OnContext } from "../types";
import type {
  InventoryItemVM,
  InventorySortKey,
} from "@src/OscSheet/domain/vm-types";
import { ItemImage } from "../ItemImage";
import { NameCell, RowEquip, RowMore } from "./cells";
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
  width: string;
  headerSpan?: number;
  header?: ReactNode;
  sort?: InventorySortKey;
  hideAt?: "xs";
  cell: (ctx: RowCtx) => ReactNode;
};

export const INV_COLUMNS: InvColumn[] = [
  { key: "drag",  width: px(18),   cell: () => <DragHandle /> },
  { key: "img",   width: px(30),   header: "Item", headerSpan: 2, sort: "name",
                                   cell: (c) => <ItemImage img={c.item.img} monogram={c.item.monogram} /> },
  { key: "name",  width: FLEX,     cell: (c) => <NameCell … /> },
  { key: "cat",   width: em(3.25), header: "Type", sort: "category", hideAt: "xs",
                                   cell: (c) => <span className={INV_ROWCAT}>{c.item.category}</span> },
  { key: "load",  width: em(2.75), sort: "weight", cell: (c) => <span className={INV_WT}>…</span> },
  { key: "equip", width: em(2.75), header: "Equip", cell: (c) => <RowEquip … /> },
  { key: "more",  width: em(1.5),  cell: (c) => <RowMore … /> },
]
