import { useSyncExternalStore } from "react";

export interface AttackTargetVM {
  id: string;
  name: string;
  img: string;
}

interface TokenLike {
  id: string;
  name: string;
  visible: boolean;
  actor: { id: string; uuid: string; img: string } | null;
  document: { disposition: number; texture?: { src?: string | null } };
  setTarget(targeted?: boolean, options?: { releaseOthers?: boolean }): void;
}

interface CanvasView {
  tokens?: {
    placeables: Iterable<TokenLike>;
    get(id: string): TokenLike | undefined;
    setTargets(ids: string[], options?: { mode?: "replace" }): void;
  } | null;
}

interface GameView {
  user?: { targets?: Iterable<TokenLike> };
}

interface HooksView {
  on(hook: string, fn: () => void): number;
  off(hook: string, id: number): void;
}

const getCanvas = (): CanvasView =>
  (globalThis as unknown as { canvas?: CanvasView }).canvas ?? {};
const getGame = (): GameView =>
  (globalThis as unknown as { game?: GameView }).game ?? {};

const getHooks = (): HooksView | undefined =>
  (globalThis as unknown as { Hooks?: HooksView }).Hooks;

const HOSTILE = -1;

const toTargetVM = (t: TokenLike): AttackTargetVM => ({
  id: t.id,
  name: t.name,
  img: t.document.texture?.src || t.actor?.img || "",
});

export function selectAttackTargets(current: {
  id: string | null;
  uuid?: string | null;
}): AttackTargetVM[] {
  const hostile: AttackTargetVM[] = [];
  const others: AttackTargetVM[] = [];
  for (const t of getCanvas().tokens?.placeables ?? []) {
    if (!t.visible) continue;
    const a = t.actor;
    if (
      a &&
      (a.id === current.id || (!!current.uuid && a.uuid === current.uuid))
    )
      continue;
    (t.document.disposition === HOSTILE ? hostile : others).push(toTargetVM(t));
  }
  return [...hostile, ...others];
}

let cached: AttackTargetVM | null = null;

export function currentUserTarget(): AttackTargetVM | null {
  const [token] = getGame().user?.targets ?? [];
  const next = token ? toTargetVM(token) : null;
  if (
    next?.id !== cached?.id ||
    next?.name !== cached?.name ||
    next?.img !== cached?.img
  )
    cached = next;
  return cached;
}

function subscribeToUserTarget(listener: () => void): () => void {
  const hooks = getHooks();
  const id = hooks?.on("targetToken", listener);
  return () => {
    if (id != null) hooks?.off("targetToken", id);
  };
}

export function useUserTarget(): AttackTargetVM | null {
  return useSyncExternalStore(
    subscribeToUserTarget,
    currentUserTarget,
    currentUserTarget,
  );
}

export function clearUserTarget(): void {
  getCanvas().tokens?.setTargets([], { mode: "replace" });
}

export function targetToken(tokenId: string): void {
  getCanvas().tokens?.get(tokenId)?.setTarget(true, { releaseOthers: true });
}
