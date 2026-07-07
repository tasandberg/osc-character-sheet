// Pure logic for "Send Item" — transfer an item (optionally a stack split, or a
// container with all its nested contents) from one actor to another. No React,
// no Foundry side effects here: this builds the create/delete/decrement plan that
// `applySend` (SheetShell) executes locally or a GM executes via the socket relay.
//
// Nesting is rebuilt on the target after creation: each copy carries a temporary
// `_key` (its original id) and `_parentKey` (its original containerId, null at
// root). Once the target assigns fresh ids, `rebuildNesting` maps old→new so
// children re-nest under the newly-created container.

import { MODULE_ID, FLAGS } from "@domain/flags";
import type { OseItem } from "@domain/types";

/** A serialized item copy destined for the target, tagged for nesting rebuild. */
export type SendNode = Record<string, unknown> & {
  /** Original item id — key for old→new id remap. */
  _key: string;
  /** Original containerId (null at the sent root). */
  _parentKey: string | null;
};

export interface SendPlan {
  /** Item docs to create on the target (root first, then descendants). */
  create: SendNode[];
  /** Source item ids to delete after the target copy exists (full moves). */
  deleteIds: string[];
  /** Source stack to decrement instead of delete (partial stacked send). */
  decrement: { id: string; value: number } | null;
}

/** Direct children of `containerId` in `allItems`. */
function childrenOf(containerId: string, allItems: OseItem[]): OseItem[] {
  return allItems.filter(
    (i) => (i.system as { containerId?: string }).containerId === containerId,
  );
}

/** Depth-first descendants of `containerId` (incl. sub-containers). */
function descendantsOf(containerId: string, allItems: OseItem[]): OseItem[] {
  const out: OseItem[] = [];
  for (const child of childrenOf(containerId, allItems)) {
    out.push(child);
    out.push(...descendantsOf(child._id as string, allItems));
  }
  return out;
}

/** Serialize `item` into a clean create node: strip _id, clear our order flags,
 *  unequip, and tag with `_key`/`_parentKey` for nesting rebuild. `qty` overrides
 *  the copy's stack size; `rootContainerId` is "" at the sent root. */
function toSendNode(
  item: OseItem,
  parentKey: string | null,
  opts: { qty?: number; containerIdOverride?: string } = {},
): SendNode {
  const raw = item.toObject() as Record<string, unknown>;
  delete raw._id;

  const flags = (raw.flags ?? {}) as Record<string, Record<string, unknown>>;
  const scope = { ...(flags[MODULE_ID] ?? {}) };
  delete scope[FLAGS.order];
  delete scope[FLAGS.equippedOrder];
  raw.flags = { ...flags, [MODULE_ID]: scope };

  const system = { ...((raw.system ?? {}) as Record<string, unknown>) };
  if ("equipped" in system) system.equipped = false;
  if (opts.containerIdOverride !== undefined)
    system.containerId = opts.containerIdOverride;
  if (opts.qty !== undefined) {
    const q = (system.quantity ?? {}) as { value?: number; max?: number };
    system.quantity = { ...q, value: opts.qty };
  }
  raw.system = system;

  return { ...raw, _key: item._id as string, _parentKey: parentKey } as SendNode;
}

/** Build the transfer plan for sending `qty` of `root` (a live item) off its
 *  actor. Containers send their whole subtree (qty ignored); a stacked non-
 *  container splits (partial → decrement source, full → delete source). */
export function collectTree(
  root: OseItem,
  allItems: OseItem[],
  qty: number,
): SendPlan {
  const isContainer = root.type === "container";

  if (isContainer) {
    const kids = descendantsOf(root._id as string, allItems);
    const create: SendNode[] = [
      toSendNode(root, null, { containerIdOverride: "" }),
      ...kids.map((k) =>
        toSendNode(k, (k.system as { containerId?: string }).containerId ?? null),
      ),
    ];
    return {
      create,
      deleteIds: [root._id as string, ...kids.map((k) => k._id as string)],
      decrement: null,
    };
  }

  const current = (root.system as { quantity?: { value?: number } }).quantity?.value ?? 1;
  const sending = Math.min(qty, current);
  const partial = sending < current;
  const node = toSendNode(root, null, { qty: sending, containerIdOverride: "" });
  return {
    create: [node],
    deleteIds: partial ? [] : [root._id as string],
    decrement: partial ? { id: root._id as string, value: current - sending } : null,
  };
}

/** After the target creates the copies, remap each child's containerId from its
 *  original parent key to the parent's freshly-assigned id. Root nodes (already
 *  containerId "") are skipped. `idMap` maps original `_key` → new doc id. */
export function rebuildNesting(
  nodes: SendNode[],
  idMap: Map<string, string>,
): { _id: string; "system.containerId": string }[] {
  const out: { _id: string; "system.containerId": string }[] = [];
  for (const n of nodes) {
    if (n._parentKey == null) continue;
    const newId = idMap.get(n._key);
    const newParent = idMap.get(n._parentKey);
    if (newId && newParent)
      out.push({ _id: newId, "system.containerId": newParent });
  }
  return out;
}

/** Local apply when I own both actors; otherwise the op is relayed through a GM. */
export function classifyRoute(
  source: { isOwner: boolean },
  target: { isOwner: boolean },
): "local" | "gm-relay" {
  return source.isOwner && target.isOwner ? "local" : "gm-relay";
}
