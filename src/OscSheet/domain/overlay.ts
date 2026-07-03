// Transparent optimistic overlay over Foundry documents.
//
// A pending change is a flat dot-path patch ({ "system.equipped": true }).
// `overlayDoc` wraps the live document in a read-through Proxy: patched leaves
// return the optimistic value; every other access — derived getters, methods,
// `.sheet` — delegates to the real document (methods stay bound to it). So the
// view-models read the optimistic value and recompute derived data (encumbrance,
// weights) from it, while mutations and Foundry's own data prep stay untouched.
// Patches are dropped once Foundry's (debounced) update reports the same value,
// so reconciliation never flickers.

export type FlatPatch = Record<string, unknown>;

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** Read a dot-path value off a plain object tree (no Foundry dependency). */
function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (isObj(o) ? o[k] : undefined), obj);
}

/** Flat dot-path patch → nested object ({ "system.equipped": true } → { system: { equipped: true } }). */
function toNested(patch: FlatPatch): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [path, val] of Object.entries(patch)) {
    const keys = path.split(".");
    let node = out;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!isObj(node[keys[i]])) node[keys[i]] = {};
      node = node[keys[i]] as Record<string, unknown>;
    }
    node[keys[keys.length - 1]] = val;
  }
  return out;
}

function overlayNested<T extends object>(doc: T, tree: Record<string, unknown>): T {
  return new Proxy(doc, {
    get(target, prop) {
      if (typeof prop === "string" && prop in tree) {
        const pv = tree[prop];
        const ov = Reflect.get(target, prop, target);
        return isObj(pv) && isObj(ov) ? overlayNested(ov as object, pv) : pv;
      }
      // Getters evaluate on the real doc (derived data); methods bind to it.
      const v = Reflect.get(target, prop, target);
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  }) as T;
}

/** Wrap `doc` so reads of patched paths return optimistic values; everything
 *  else (derived getters, methods, `.sheet`) delegates to the live document. */
export function overlayDoc<T extends object>(doc: T, patch?: FlatPatch): T {
  if (!patch || Object.keys(patch).length === 0) return doc;
  return overlayNested(doc, toNested(patch));
}

/** Drop patch paths whose value the live doc already reflects (so removing them
 *  is invisible — no flicker); keep paths Foundry hasn't caught up to yet. */
export function prune(patch: FlatPatch, doc: unknown): FlatPatch {
  const out: FlatPatch = {};
  for (const [path, val] of Object.entries(patch)) {
    if (!Object.is(getPath(doc, path), val)) out[path] = val;
  }
  return out;
}
