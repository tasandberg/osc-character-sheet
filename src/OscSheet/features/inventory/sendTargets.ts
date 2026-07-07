// Enumerate valid "Send Item" targets: the actors behind every visible, non-hostile
// token in the current scene, minus the sender. Each is classified `ownedByMe`
// (direct move) vs `crossOwner` (needs a GM socket relay). `gmOnline` gates the relay.
//
// Token-based (not game.actors) so the list matches what the player can actually see
// on the map, and so it works without any formal "party" concept. Targets are keyed
// by actor UUID — this resolves both linked and unlinked (synthetic) token actors.

/** The actor behind a token, as far as target selection cares. */
interface TargetActorLike {
  id: string;
  uuid: string;
  name: string;
  img: string;
  isOwner: boolean;
}

/** A placeable token on the active scene. */
interface TokenLike {
  visible: boolean;
  actor: TargetActorLike | null;
  document: { disposition: number };
}

export interface SendTargetVM {
  id: string;
  uuid: string;
  name: string;
  img: string;
  /** I own this actor → transfer applies directly on my client. */
  ownedByMe: boolean;
  /** I don't own this actor → transfer must be relayed through a GM. */
  crossOwner: boolean;
}

export interface SendTargetsResult {
  targets: SendTargetVM[];
  /** A GM is connected → cross-owner relays can be delivered. */
  gmOnline: boolean;
}

interface CanvasView {
  tokens?: { placeables: Iterable<TokenLike> } | null;
}
interface GameView {
  users: { activeGM: unknown };
}
const getGame = (): GameView =>
  (globalThis as unknown as { game: GameView }).game;
const getCanvas = (): CanvasView =>
  (globalThis as unknown as { canvas?: CanvasView }).canvas ?? {};

/** True when a GM is connected. Cross-owner transfers can't be delivered without
 *  one, so Send is hidden entirely when no GM is online. */
export function isGmConnected(): boolean {
  return !!getGame().users.activeGM;
}

// Non-hostile = NEUTRAL(0) or FRIENDLY(1); excludes HOSTILE(-1) and SECRET(-2).
// (CONST.TOKEN_DISPOSITIONS — hardcoded to avoid a global dependency in tests.)
const MIN_DISPOSITION = 0;

/** Targets a player may send items to from `current`'s sheet, plus GM availability.
 *  = the actor behind every visible, non-hostile scene token except the sender. */
export function selectSendTargets(current: {
  id: string | null;
  uuid?: string | null;
}): SendTargetsResult {
  const canvas = getCanvas();
  const targets: SendTargetVM[] = [];
  const seen = new Set<string>(); // dedupe multiple tokens sharing one actor
  for (const t of canvas.tokens?.placeables ?? []) {
    const a = t.actor;
    if (!a) continue;
    if (!t.visible) continue; // hidden or out of this user's sight
    if (t.document.disposition < MIN_DISPOSITION) continue; // hostile / secret
    if (a.id === current.id || (!!current.uuid && a.uuid === current.uuid)) {
      continue; // never send to self
    }
    if (seen.has(a.uuid)) continue;
    seen.add(a.uuid);
    targets.push({
      id: a.id,
      uuid: a.uuid,
      name: a.name,
      img: a.img,
      ownedByMe: a.isOwner,
      crossOwner: !a.isOwner,
    });
  }
  return { targets, gmOnline: !!getGame().users.activeGM };
}
