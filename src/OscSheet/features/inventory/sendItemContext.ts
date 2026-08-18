// Send-dialog context + hook, split from SendItemHost.tsx so that component file
// can fast-refresh cleanly (a file mixing a hook export with a component export
// trips react-refresh/only-export-components).
import { createContext, useContext } from "react";
import type { InventoryItemVM } from "@domain/vm-types";

/** Open the Send dialog for an item. null when sending isn't available at all —
 *  read-only sheet, or no GM connected to relay through. */
export const SendItemContext = createContext<
  ((item: InventoryItemVM) => void) | null
>(null);

export function useSendItem() {
  return useContext(SendItemContext);
}
