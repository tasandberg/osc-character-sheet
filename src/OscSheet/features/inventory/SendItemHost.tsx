import { useState, type ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { useInventoryActions } from "@features/inventory/useInventoryActions";
import { SendItemModal } from "@features/inventory/SendItemModal";
import {
  selectSendTargets,
  isGmConnected,
} from "@features/inventory/sendTargets";
import { flattenItems } from "@features/inventory/groups";
import { SendItemContext } from "@features/inventory/sendItemContext";
import type { InventoryItemVM } from "@domain/vm-types";

export function SendItemHost({ children }: { children: ReactNode }) {
  const { actor, canEdit } = useOscSheetContext();
  const { onSend } = useInventoryActions();
  const [sending, setSending] = useState<InventoryItemVM | null>(null);
  const open = canEdit && isGmConnected() ? setSending : null;

  return (
    <SendItemContext.Provider value={open}>
      {children}
      {sending &&
        (() => {
          const { targets, gmOnline } = selectSendTargets(actor);
          const contentCount = flattenItems(sending.children).length;
          return (
            <SendItemModal
              open
              item={sending}
              contentCount={contentCount}
              targets={targets}
              gmOnline={gmOnline}
              onClose={() => setSending(null)}
              onSend={(target, qty) => {
                onSend(sending.id, target, qty);
                setSending(null);
              }}
            />
          );
        })()}
    </SendItemContext.Provider>
  );
}
