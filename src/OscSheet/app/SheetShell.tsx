import { useState } from "react";
import { Frame, Topbar, HeaderBand, Minibar, type TabItem } from "@layout";
import { useOscSheetContext } from "@app/context";
import { EditModal } from "@features/edit/EditModal";
import { tabs, TabIds } from "@app/tabs";
import getLabel from "@src/util/getLabel";
import { ActionsView, SavesExploration } from "@features/actions";
import { InventoryView } from "@features/inventory";
import { selectTopbar } from "@domain/topbar";
import { selectSaves } from "@features/actions/saves";
import {
  selectExploration,
  rollExploration,
} from "@features/actions/exploration";
import {
  selectInventory,
  selectEncumbrance,
  selectCoins,
} from "@features/inventory/inventory";
import { flagPath, FLAGS, readFlag } from "@domain/flags";
import { collectTree, classifyRoute } from "@features/inventory/sendItem";
import {
  applySend,
  emitSendItem,
  type EmbeddedDocActor,
} from "@features/inventory/sendItemSocket";
import type { SendTargetVM } from "@features/inventory/sendTargets";
import { showTokenVariantsPortraitPicker } from "@domain/tokenVariants";
import { selectAc } from "@domain/vitals";
import { usesAscendingAC } from "@domain/chat/targeting";
import { useToast } from "@ui/toastContext";
import type { OseItem } from "@domain/types";
import type { IdentityVM, VitalsVM } from "@domain/vm-types";

/**
 * Foundry-aware container: computes view-models, fills the Shell layout slots,
 * and mounts the Actions body (other tabs still render their legacy Content).
 */
export default function SheetShell() {
  const {
    actor,
    items: invItems,
    currentTab,
    setCurrentTab,
    updateActor,
    optimisticUpdate,
    canEdit,
  } = useOscSheetContext();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);

  // Layout-slot props built inline from the actor (HeaderBand + Minibar share the shape).
  const { details, hp, aac, ac, scores, movement, initiative } = actor.system;
  const identity: IdentityVM = {
    name: actor.name,
    img: actor.img,
    classLabel: details.class,
    level: details.level,
    alignment: details.alignment,
    title: details.title,
  };
  const isAscending = usesAscendingAC();
  const equippedArmor = invItems.filter(
    (i) => i.type === "armor" && i.system.equipped,
  ) as unknown as Item[];
  const vitals: VitalsVM = {
    hp: { value: hp.value, max: hp.max },
    ac: selectAc(aac, ac, equippedArmor, isAscending),
    initMod: scores.dex.init + (initiative?.mod ?? 0),
    hd: hp.hd,
    move: movement.base,
    moveBands: {
      encounter: movement.encounter,
      explore: movement.base,
      travel: movement.overland,
    },
  };
  // Read-only sheets get no HP stepper/input (undefined onSetHp → static value).
  const onSetHp = !canEdit ? undefined : (value: number) => {
    const next = Math.max(0, Math.min(vitals.hp.max, value));
    if (next === vitals.hp.value) return;
    const update = { "system.hp.value": next };
    if (optimisticUpdate)
      optimisticUpdate("actor", update, () => updateActor(update));
    else void updateActor(update);
  };

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

  const onEquipItem = (id: string) => {
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
  const onOpenItem = (id: string) => resolveItem(id)?.sheet?.render(true);
  const onSetCoin = (id: string, value: number) => {
    const it = resolveItem(id);
    if (!it) return;
    writeItem(it, { "system.quantity.value": value }, id);
  };
  // Consume one: decrement the item's quantity (floored at 0).
  const onConsume = (id: string) => {
    const it = resolveItem(id);
    const cur =
      (it?.system as { quantity?: { value: number } })?.quantity?.value ?? 0;
    if (it && cur > 0) writeItem(it, { "system.quantity.value": cur - 1 });
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
  const onDeleteItem = (id: string) => {
    const it = resolveItem(id);
    if (!it) return;
    // Deleting a container: move its contents back to the top level first.
    const kids = (invItems as OseItem[]).filter(
      (c) => (c.system as { containerId?: string }).containerId === id,
    );
    if (kids.length)
      embedUpdate(kids.map((k) => ({ _id: k._id, "system.containerId": "" })));
    deleteItem(it);
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

  const visible = tabs(actor).filter((t) => !t.disabled);
  const items: TabItem[] = visible.map((t) => ({
    id: t.id,
    label: getLabel(t.label),
    icon: <span aria-hidden="true">{t.icon}</span>,
  }));

  const activeTab = visible.find((t) => t.id === currentTab) ?? visible[0];
  if (!activeTab) return null;

  return (
    <>
      <EditModal open={editOpen && canEdit} onClose={() => setEditOpen(false)} />
      <Frame
        tabs={items}
        active={activeTab.id}
        onSelect={(id) => {
          const next = visible.find((t) => t.id === id);
          if (next) setCurrentTab(next.id);
        }}
        topbar={
          <Topbar
            vm={selectTopbar(actor)}
            canEdit={canEdit}
            onEdit={() => setEditOpen(true)}
            onLevelUp={() =>
              toast({
                intent: "warning",
                title: "Level Up",
                message: "Coming soon ;)",
              })
            }
          />
        }
        header={
          <HeaderBand
            identity={identity}
            vitals={vitals}
            onSetHp={onSetHp}
            // Intentionally gated on canEdit (= Foundry `sheet.isEditable`), not
            // raw actor.isOwner: a locked/compendium sheet legitimately shouldn't
            // expose write affordances even to an owner. Same rationale for the
            // inventory context-menu / Send gates.
            onPortraitContextMenu={
              canEdit
                ? () => showTokenVariantsPortraitPicker(actor)
                : undefined
            }
            canEditPortrait={canEdit}
          />
        }
        minibar={
          <Minibar identity={identity} vitals={vitals} onSetHp={onSetHp} />
        }
        railExtra={
          <SavesExploration
            saves={selectSaves(actor)}
            exploration={selectExploration(actor)}
            onRollSave={(key) => actor.rollSave(key, {})}
            onRollExploration={(key) => rollExploration(actor, key)}
            tabbed
          />
        }
      >
        {activeTab.id === TabIds.ACTIONS ? (
          <ActionsView actor={actor} />
        ) : activeTab.id === TabIds.INVENTORY ? (
          <InventoryView
            inventory={selectInventory(invItems as OseItem[])}
            encumbrance={selectEncumbrance(actor, invItems as OseItem[])}
            coins={selectCoins(invItems as OseItem[])}
            onSetCoin={onSetCoin}
            onEquip={onEquipItem}
            onOpen={onOpenItem}
            onDelete={onDeleteItem}
            onConsume={onConsume}
            onReorder={onReorder}
            onReorderEquipped={onReorderEquipped}
            onNest={onNest}
            onSend={onSend}
          />
        ) : (
          activeTab.Content && <activeTab.Content />
        )}
      </Frame>
    </>
  );
}
