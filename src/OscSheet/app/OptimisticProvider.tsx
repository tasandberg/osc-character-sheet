import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { OscSheetContext, useOscSheetContext } from "@app/context";
import { overlayDoc, prune, type FlatPatch } from "@domain/overlay";
import type { OseItem } from "@domain/types";

/** Pending optimistic patches, keyed by item `_id` (or "actor" for actor.system). */
type Pending = Record<string, FlatPatch>;
const ACTOR_KEY = "actor";

/**
 * Subordinate to OscSheetProvider. Holds shadow state of in-flight changes
 * and re-provides the same context with the actor/items overlaid, so consumers
 * see edits instantly. Each pending patch is dropped once the (debounced) Foundry
 * sync reports the same value — equal, so nothing flickers — or rolled back if the
 * write rejects. Derived values (encumbrance, weights) recompute from the overlay
 * because the view-models read through it.
 */
export function OptimisticProvider({ children }: { children: ReactNode }) {
  const parent = useOscSheetContext();
  const { actor, items } = parent;
  const [pending, setPending] = useState<Pending>({});

  // Reconcile against Foundry truth on every sync: keep only patches it hasn't
  // caught up to yet. Runs when actor/items change (not on `pending`), so no loop.
  useEffect(() => {
    setPending((p) => reconcile(p, actor, items));
  }, [actor, items]);

  // Per-key trailing debounce: rapid edits update the overlay instantly but
  // coalesce into ONE backend write of the final value (the latest commit wins).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const writes = useRef<Record<string, () => Promise<unknown>>>({});

  const flush = useCallback((key: string) => {
    const commit = writes.current[key];
    clearTimeout(timers.current[key]);
    delete timers.current[key];
    delete writes.current[key];
    if (!commit) return;
    // On failure, drop the whole doc's overlay → snap back to Foundry truth.
    void Promise.resolve()
      .then(commit)
      .catch(() =>
        setPending((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        }),
      );
  }, []);

  const optimisticUpdate = useCallback(
    (key: string, patch: FlatPatch, commit: () => Promise<unknown>, debounceMs = 250) => {
      setPending((p) => ({ ...p, [key]: { ...p[key], ...patch } })); // overlay now
      writes.current[key] = commit; // latest write wins
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => flush(key), debounceMs);
    },
    [flush],
  );

  // Flush in-flight debounced writes on unmount (sheet close) so none are lost.
  useEffect(() => {
    const t = timers.current;
    return () => Object.keys(t).forEach(flush);
  }, [flush]);

  const overlaidItems = useMemo(
    () => items.map((it) => overlayDoc(it, pending[it._id as string])),
    [items, pending],
  );
  const overlaidActor = useMemo(() => overlayDoc(actor, pending[ACTOR_KEY]), [actor, pending]);

  const value = useMemo(
    () => ({
      ...parent,
      actor: overlaidActor,
      actorData: overlaidActor.system as typeof parent.actorData,
      items: overlaidItems,
      optimisticUpdate,
    }),
    [parent, overlaidActor, overlaidItems, optimisticUpdate],
  );

  return <OscSheetContext.Provider value={value}>{children}</OscSheetContext.Provider>;
}

function reconcile(pending: Pending, actor: unknown, items: OseItem[]): Pending {
  if (Object.keys(pending).length === 0) return pending;
  const next: Pending = {};
  for (const [key, patch] of Object.entries(pending)) {
    const doc = key === ACTOR_KEY ? actor : items.find((it) => (it._id as string) === key);
    const remaining = doc ? prune(patch, doc) : patch;
    if (Object.keys(remaining).length) next[key] = remaining;
  }
  return next;
}

