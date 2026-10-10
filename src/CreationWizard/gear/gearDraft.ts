import type { RolledScore } from "../scores/scoresDraft";
import type { CartLine, GearItem } from "./gearTypes";

export const STARTING_GOLD_FORMULA = "3d6 * 10";

export type GearLine = { item: GearItem; quantity: number };

export type GearDraft = { gold?: RolledScore; cart: GearLine[] };

export const emptyGearDraft = (): GearDraft => ({ cart: [] });

export const cartLines = (cart: GearLine[]): CartLine[] =>
  cart.map(({ item, quantity }) => ({ uuid: item.uuid, quantity }));

export const quantityOf = (draft: GearDraft, uuid: string) =>
  draft.cart.find((line) => line.item.uuid === uuid)?.quantity ?? 0;

export const itemCount = (draft: GearDraft) =>
  draft.cart.reduce((sum, line) => sum + line.quantity, 0);

export const spent = (draft: GearDraft) =>
  draft.cart.reduce((sum, line) => sum + line.item.cost * line.quantity, 0);

export const goldLeft = (draft: GearDraft) =>
  (draft.gold?.total ?? 0) - spent(draft);

export function setQuantity(
  draft: GearDraft,
  item: GearItem,
  quantity: number,
): GearDraft {
  const rest = draft.cart.filter((line) => line.item.uuid !== item.uuid);
  if (quantity <= 0) return { ...draft, cart: rest };
  const index = draft.cart.findIndex((line) => line.item.uuid === item.uuid);
  const line = { item, quantity };
  return {
    ...draft,
    cart:
      index < 0
        ? [...draft.cart, line]
        : draft.cart.map((l, i) => (i === index ? line : l)),
  };
}

export function affordReason(
  draft: GearDraft,
  item: GearItem,
): string | undefined {
  if (!draft.gold) return "Roll starting gold first";
  return item.cost > goldLeft(draft) ? "Not enough gold" : undefined;
}

export const gearBlockedReason = (draft: GearDraft) =>
  draft.gold ? undefined : "Roll starting gold to continue";

export const gearSummary = (draft: GearDraft) => {
  if (gearBlockedReason(draft)) return undefined;
  const count = itemCount(draft);
  return `${count} ${count === 1 ? "item" : "items"} · ${goldLeft(draft)} gp left`;
};
