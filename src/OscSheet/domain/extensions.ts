// Module extension points. Nothing fires unless a module is listening, so the
// sheet does no extra work for the common case.
import type { OSEActor, OseItem } from "@domain/types";

const NS = "osc-character-sheet";

export const HOOKS = {
  /** Fires after the item menu paints, once per commit while it is open. */
  itemMenu: `${NS}.renderItemMenu`,
} as const;

/** Payload of {@link HOOKS.itemMenu}. `item` is undefined on a coin row — coins
 *  are real Foundry items but aren't inventory VM nodes. */
export type ItemMenuHookPayload = {
  actor: OSEActor;
  item?: OseItem;
  /** Empty element at the end of the menu; a listener owns its children. */
  element: HTMLElement;
  close: () => void;
};

type HookApi = {
  callAll: (hook: string, ...args: unknown[]) => boolean;
  on: (hook: string, fn: (...args: unknown[]) => void) => number;
  events?: Record<string, unknown[] | undefined>;
};

const hooks = (): HookApi | undefined =>
  (globalThis as { foundry?: { helpers?: { Hooks?: HookApi } } }).foundry
    ?.helpers?.Hooks;

export function hasListeners(hook: string): boolean {
  return (hooks()?.events?.[hook]?.length ?? 0) > 0;
}

export function fireHook(hook: string, payload: object): void {
  hooks()?.callAll(hook, payload);
}

/** Subscribe to one of our hooks. Wraps `Hooks.on` because fvtt-types only
 *  admits hook names it knows about, and ours aren't in its HookConfig. */
export function onHook<T>(hook: string, fn: (payload: T) => void): void {
  hooks()?.on(hook, (payload) => fn(payload as T));
}
