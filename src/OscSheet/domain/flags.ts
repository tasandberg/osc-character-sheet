// Read/write osc-sheet flag data on Foundry documents (items, actors).
// Flags are namespaced under `flags.<MODULE_ID>.<key>` on each document.
// See https://foundryvtt.wiki/en/development/api/flags
//
// Use the wrappers (getFlag/setFlag/unsetFlag) for single-document live writes, the
// path helpers (flagPath/flagDeletePath) for batched update()/updateEmbeddedDocuments
// calls, and readFlag to pull a value straight off raw document data (e.g. in view-models,
// where we don't want to depend on the live-document methods).

/** Our module id — the flag scope (matches module.json `id`). Baked at build time
 *  (vite `define`); a beta build injects the beta id to isolate its namespaces. */
export const MODULE_ID = __MODULE_ID__;

/** Flag keys this module owns on documents. */
export const FLAGS = {
  /** Manual order position of an item within its list (the main list or a container). */
  order: "order",
  /** Manual order position of an equipped item within the equipped tray —
   *  independent of `order` (its row position in the All-Items list). */
  equippedOrder: "equippedOrder",
  /** Spell flagged to appear on the Actions tab when memorization is disabled. */
  favorite: "favorite",
  /** Per-level spell points spent (actor flag) in free-casting mode: Record<level, number>. */
  spellPoints: "spellPoints",
} as const;
export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

/** Minimal flag-bearing surface shared by Foundry documents. */
export interface FlagDocument {
  getFlag(scope: string, key: string): unknown;
  setFlag(scope: string, key: string, value: unknown): Promise<unknown>;
  unsetFlag(scope: string, key: string): Promise<unknown>;
}

/** Read a osc-sheet flag off a live document. */
export function getFlag<T>(doc: FlagDocument, key: FlagKey): T | undefined {
  return doc.getFlag(MODULE_ID, key) as T | undefined;
}

/** Write a osc-sheet flag on a live document. */
export function setFlag<T>(doc: FlagDocument, key: FlagKey, value: T): Promise<unknown> {
  return doc.setFlag(MODULE_ID, key, value);
}

/** Remove a osc-sheet flag from a live document. */
export function unsetFlag(doc: FlagDocument, key: FlagKey): Promise<unknown> {
  return doc.unsetFlag(MODULE_ID, key);
}

/** Dotted path to set a flag inside an update()/updateEmbeddedDocuments payload. */
export function flagPath(key: FlagKey): string {
  return `flags.${MODULE_ID}.${key}`;
}

/** Dotted path (Foundry `-=` delete syntax) to unset a flag in a batched update payload. */
export function flagDeletePath(key: FlagKey): string {
  return `flags.${MODULE_ID}.-=${key}`;
}

/** Read a flag straight off raw document data — no live-document methods required. */
export function readFlag<T>(source: { flags?: unknown }, key: FlagKey): T | undefined {
  const flags = source.flags as Record<string, Record<string, unknown>> | undefined;
  return flags?.[MODULE_ID]?.[key] as T | undefined;
}
