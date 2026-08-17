import { useOscSheetContext } from "@app/context";
import { useToast } from "@ui/toastContext";
import {
  createItem,
  type InventoryItemType,
} from "@features/inventory/createItem";
import { flagPath, FLAGS, readFlag } from "@domain/flags";
import { showDeleteDialog } from "@domain/foundryDialogs";
import { collectTree, classifyRoute } from "@features/inventory/sendItem";
import { consumeToast } from "@features/inventory/consumeToast";
import {
  applySend,
  emitSendItem,
  type EmbeddedDocActor,
} from "@features/inventory/sendItemSocket";
import type { SendTargetVM } from "@features/inventory/sendTargets";
import type { Ops } from "@features/inventory/types";
import type { OseItem } from "@domain/types";

export type InventoryActions = Ops & {
  onSetCoin: (id: string, value: number) => void;
};

export function useInventoryActions(): InventoryActions {
  const {
    actor,
    items: invItems,
    optimisticUpdate,
    canEdit,
  } = useOscSheetContext();
  const toast = useToast();

  const resolveItem = (id: string) =>
    (invItems as OseItem[]).find((i) => i._id === id);

  // --- Item write layer (structural read-only gate) -------------------------
  // Every item mutation funnels through these three primitives, which refuse the
  // write when !canEdit. This keeps read-only STRUCTURAL: a new or ungated item
  // control can never reach Foundry, independent of the per-control UI gating
  // (kept as defense-in-depth). A refused write no-ops silently; Foundry also
  // rejects it server-side for non-owners.
  const writeItem = (
    it: OseItem,
    update: Record<string, unknown>,
    optimisticKey?: string,
  ) => {
    if (!canEdit) return;
    if (optimisticKey && optimisticUpdate)
      optimisticUpdate(optimisticKey, update, () => it.update(update));
    else void it.update(update);
  };
  const deleteItem = (it: OseItem) => {
    if (!canEdit) return;
    void it.delete();
  };
  const embedUpdate = (updates: object[]) => {
    if (!canEdit) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (actor as any).updateEmbeddedDocuments("Item", updates);
  };
  const onCreate = (type: InventoryItemType) => {
    if (!canEdit) return;
    void createItem(actor, type);
  };

  const onEquip = (id: string) => {
    const it = resolveItem(id);
    if (!it || !("equipped" in it.system)) return;
    const equipped = !it.system.equipped;
    const fromContainerId = (it.system as { containerId?: string }).containerId;
    const update: Record<string, unknown> = { "system.equipped": equipped };
    // Equipping pulls the item out of any container it lives in.
    const leftContainer = equipped && !!fromContainerId;
    if (leftContainer) update["system.containerId"] = "";
    if (equipped) {
      // A newly-equipped item goes to the END of the tray (its own order, set
      // explicitly so it never inherits — and so list reorders never move it).
      const maxEq = (invItems as OseItem[])
        .filter(
          (i) =>
            i._id !== id && !!(i.system as { equipped?: boolean }).equipped,
        )
        .reduce(
          (m, i) => Math.max(m, readFlag<number>(i, FLAGS.equippedOrder) ?? 0),
          0,
        );
      update[flagPath(FLAGS.equippedOrder)] = maxEq + 100;
    }
    // Optimistic: flip the hand instantly, reconcile when Foundry confirms.
    writeItem(it, update, id);
    if (leftContainer) {
      const container = resolveItem(fromContainerId!);
      toast({
        intent: "success",
        title: "Equipped",
        message: `${it.name} equipped — removed from ${container?.name ?? "container"}`,
        icon: <i className="fa-solid fa-hand" aria-hidden="true" />,
      });
    }
  };
  const onOpen = (id: string) => resolveItem(id)?.sheet?.render(true);
  const onSetCoin = (id: string, value: number) => {
    const it = resolveItem(id);
    if (!it) return;
    writeItem(it, { "system.quantity.value": value }, id);
  };
  // Set a stackable's quantity directly (pip tick / Use link) — optimistic, floored
  // at 0. A decrease is a "use one" and fires a confirming toast; a no-op is skipped.
  const onSetQty = (id: string, value: number) => {
    const it = resolveItem(id);
    if (!it) return;
    const cur =
      (it.system as { quantity?: { value: number } })?.quantity?.value ?? 0;
    const next = Math.max(0, value);
    if (next === cur) return;
    writeItem(it, { "system.quantity.value": next }, id);
    const t = consumeToast(it.name ?? "item", cur, next);
    if (t)
      toast({
        ...t,
        icon: <i className="fa-solid fa-circle-minus" aria-hidden="true" />,
      });
  };
  // Consume one (right-click): same "use one" path as the pips/Use link.
  const onConsume = (id: string) => {
    const it = resolveItem(id);
    const cur =
      (it?.system as { quantity?: { value: number } })?.quantity?.value ?? 0;
    if (it && cur > 0) onSetQty(id, cur - 1);
  };

  // Manual order is stored in our own flag (not Foundry's `sort`, which the core
  // sheet and other modules also write).
  const onReorder = (u: { id: string; sort: number }[]) =>
    embedUpdate(u.map((x) => ({ _id: x.id, [flagPath(FLAGS.order)]: x.sort })));
  // The equipped tray has its own order, stored in a separate flag.
  const onReorderEquipped = (u: { id: string; sort: number }[]) =>
    embedUpdate(
      u.map((x) => ({ _id: x.id, [flagPath(FLAGS.equippedOrder)]: x.sort })),
    );
  const onNest = (itemId: string, containerId: string | null) => {
    const it = resolveItem(itemId);
    const wasEquipped = !!(it?.system as { equipped?: boolean })?.equipped;
    // Stowing an item in a container also unequips it.
    const update: Record<string, unknown> = {
      _id: itemId,
      "system.containerId": containerId ?? "",
    };
    if (containerId && wasEquipped) update["system.equipped"] = false;
    embedUpdate([update]);
    if (containerId && wasEquipped) {
      const container = resolveItem(containerId);
      toast({
        intent: "warning",
        title: "Unequipped",
        message: `${it?.name} unequipped — stowed in ${container?.name ?? "container"}`,
        icon: <i className="fa-regular fa-hand" aria-hidden="true" />,
      });
    }
  };
  const onDelete = (id: string) => {
    const it = resolveItem(id);
    if (!it || !canEdit) return;
    showDeleteDialog(it, () => {
      // Deleting a container: move its contents back to the top level first.
      const kids = (invItems as OseItem[]).filter(
        (c) => (c.system as { containerId?: string }).containerId === id,
      );
      if (kids.length)
        embedUpdate(
          kids.map((k) => ({ _id: k._id, "system.containerId": "" })),
        );
      deleteItem(it);
    });
  };

  // Send an item to another actor. Direct apply when I own the target; otherwise
  // relay the whole op through the active GM. Pure plan/route logic lives in
  // sendItem.ts; the socket + apply routine in sendItemSocket.ts.
  const onSend = (itemId: string, target: SendTargetVM, qty: number) => {
    // Send mutates the SOURCE actor (delete/decrement), so it's part of the write
    // layer — refuse it read-only (both the local applySend and the GM relay).
    if (!canEdit) return;
    const it = resolveItem(itemId);
    if (!it) return;
    // Resolve the picked token's actor by UUID (fromUuidSync handles linked and
    // unlinked/synthetic token actors on the loaded scene).
    const targetActor = (
      foundry.utils as { fromUuidSync?: (u: string) => unknown }
    ).fromUuidSync?.(target.uuid) as EmbeddedDocActor | undefined;
    if (!targetActor && target.ownedByMe) {
      toast({
        intent: "danger",
        title: "Send failed",
        message: `Couldn't find ${target.name}.`,
      });
      return;
    }
    const plan = collectTree(it, invItems as OseItem[], qty);
    const route = classifyRoute(
      { isOwner: actor.isOwner },
      { isOwner: target.ownedByMe },
    );
    const gift = <i className="fa-solid fa-gift" aria-hidden="true" />;

    if (route === "local" && targetActor) {
      void applySend({
        fromActor: actor as unknown as EmbeddedDocActor,
        toActor: targetActor,
        create: plan.create,
        deleteIds: plan.deleteIds,
        decrement: plan.decrement,
      })
        .then(() =>
          toast({
            intent: "success",
            title: "Sent",
            message: `${it.name} → ${target.name}`,
            icon: gift,
          }),
        )
        .catch(() =>
          toast({
            intent: "danger",
            title: "Send failed",
            message: `Couldn't send ${it.name}.`,
          }),
        );
      return;
    }

    // Cross-owner: relay to the GM. Emit the whole op and toast optimistically.
    emitSendItem({
      type: "sendItem",
      requestId: foundry.utils.randomID(),
      sourceUuid: actor.uuid ?? "",
      targetUuid: target.uuid,
      create: plan.create,
      deleteIds: plan.deleteIds,
      decrement: plan.decrement,
      requesterUserId: game.user?.id ?? "",
    });
    toast({
      intent: "success",
      title: "Sent",
      message: `${it.name} → ${target.name} (via GM)`,
      icon: gift,
    });
  };

  return {
    onCreate,
    onEquip,
    onOpen,
    onDelete,
    onConsume,
    onSetCoin,
    onSetQty,
    onReorder,
    onReorderEquipped,
    onNest,
    onSend,
  };
}
