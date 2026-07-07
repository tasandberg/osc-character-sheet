// Enumerate valid "Send Item" targets: party/owned character & npc actors, minus
// self and GM-only (unowned) actors. Each target is classified `ownedByMe` (direct
// move) vs `crossOwner` (needs a GM socket relay). `gmOnline` gates the relay path.

/** A live actor as far as target selection cares. */
interface TargetActorLike {
  id: string;
  uuid: string;
  name: string;
  img: string;
  type: string;
  isOwner: boolean;
  hasPlayerOwner: boolean;
}

export interface SendTargetVM {
  id: string;
  uuid: string;
  name: string;
  img: string;
  /** I own this actor → transfer applies directly on my client. */
  ownedByMe: boolean;
  /** Owned by another player → transfer must be relayed through a GM. */
  crossOwner: boolean;
}

export interface SendTargetsResult {
  targets: SendTargetVM[];
  /** A GM is connected → cross-owner relays can be delivered. */
  gmOnline: boolean;
}

interface GameView {
  actors: Iterable<TargetActorLike>;
  users: { activeGM: unknown };
}
const getGame = (): GameView =>
  (globalThis as unknown as { game: GameView }).game;

const SENDABLE_TYPES = new Set(["character", "npc"]);

/** Targets a player may send items to from `current`'s sheet, plus GM availability. */
export function selectSendTargets(current: {
  id: string | null;
}): SendTargetsResult {
  const game = getGame();
  const targets: SendTargetVM[] = [];
  for (const a of game.actors) {
    if (a.id === current.id) continue; // never send to self
    if (!SENDABLE_TYPES.has(a.type)) continue;
    if (!a.hasPlayerOwner) continue; // GM-only actors aren't party members
    targets.push({
      id: a.id,
      uuid: a.uuid,
      name: a.name,
      img: a.img,
      ownedByMe: a.isOwner,
      crossOwner: !a.isOwner,
    });
  }
  return { targets, gmOnline: !!game.users.activeGM };
}
