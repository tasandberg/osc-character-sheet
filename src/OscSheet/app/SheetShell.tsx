import { useState } from "react";
import { Frame, Topbar, HeaderBand, Minibar, type TabItem } from "@layout";
import { useOscSheetContext } from "@app/context";
import { EditModal } from "@features/edit/EditModal";
import { tabs, TabIds } from "@app/tabs";
import getLabel from "@src/util/getLabel";
import { ActionsView, SavesExploration } from "@features/actions";
import { InventoryView } from "@features/inventory";
import { SendItemHost } from "@features/inventory/SendItemHost";
import { useInventoryActions } from "@features/inventory/useInventoryActions";
import { selectTopbar } from "@domain/topbar";
import { selectSaves } from "@features/actions/saves";
import {
  selectExploration,
  rollExploration,
} from "@features/actions/exploration";
import {
  selectInventory,
  selectEncumbrance,
  selectWealth,
} from "@features/inventory/inventory";
import { showTokenVariantsPortraitPicker } from "@domain/tokenVariants";
import { selectAc } from "@domain/vitals";
import { selectIdentity } from "@domain/identity";
import { usesAscendingAC } from "@domain/chat/targeting";
import { useToast } from "@ui/toastContext";
import type { OseItem } from "@domain/types";
import type { VitalsVM } from "@domain/vm-types";

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
  const { hp, aac, ac, scores, movement, initiative } = actor.system;
  const identity = selectIdentity(actor);
  const isAscending = usesAscendingAC();
  const equippedArmor = invItems.filter(
    (i) => i.type === "armor" && i.system.equipped,
  ) as unknown as Item[];
  const vitals: VitalsVM = {
    hp: { value: hp.value, max: hp.max },
    ac: selectAc(aac, ac, equippedArmor, isAscending),
    initMod: scores.dex.init + (initiative?.mod ?? 0),
    hd: hp.hd,
    move: Math.floor(movement.base),
    moveBands: {
      encounter: Math.floor(movement.encounter),
      explore: Math.floor(movement.base),
      travel: Math.floor(movement.overland),
    },
  };
  // One encumbrance VM for both consumers — the header MOVE hover and the inventory
  // rates line must never disagree about the tier.
  const encumbrance = selectEncumbrance(actor, invItems as OseItem[]);
  // Read-only sheets get no HP stepper/input (undefined onSetHp → static value).
  const onSetHp = !canEdit
    ? undefined
    : (value: number) => {
        const next = Math.max(0, Math.min(vitals.hp.max, value));
        if (next === vitals.hp.value) return;
        const update = { "system.hp.value": next };
        if (optimisticUpdate)
          optimisticUpdate("actor", update, () => updateActor(update));
        else void updateActor(update);
      };

  const inventoryActions = useInventoryActions();

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
      <EditModal
        open={editOpen && canEdit}
        onClose={() => setEditOpen(false)}
      />
      <SendItemHost>
        <Frame
          nav={{
            tabs: items,
            active: activeTab.id,
            onSelect: (id) => {
              const next = visible.find((t) => t.id === id);
              if (next) setCurrentTab(next.id);
            },
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
              encumbrance={encumbrance}
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
              onRollSave={(key, event) => actor.rollSave(key, { event })}
              onRollExploration={(key, event) =>
                rollExploration(actor, key, event)
              }
              tabbed
            />
          }
        >
          {activeTab.id === TabIds.ACTIONS ? (
            <ActionsView actor={actor} />
          ) : activeTab.id === TabIds.INVENTORY ? (
            <InventoryView
              inventory={selectInventory(invItems as OseItem[])}
              encumbrance={encumbrance}
              wealth={selectWealth(invItems as OseItem[])}
              {...inventoryActions}
            />
          ) : (
            activeTab.Content && <activeTab.Content />
          )}
        </Frame>
      </SendItemHost>
    </>
  );
}
