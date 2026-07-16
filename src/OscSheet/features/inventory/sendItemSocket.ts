// Cross-client relay for "Send Item". When the sender doesn't own the target
// actor, the whole transfer (create-on-target + delete/decrement-on-source) is
// emitted over the module socket and applied by the single active GM — mirroring
// the GM-election precedent in migrations.ts and the GM-gated write in applyDamage.
//
// `applySend` is the shared apply routine used both locally (sender owns both
// actors) and by the GM handler. It always creates on the target FIRST so a
// failure can never destroy the source before its copy exists.

import { rebuildNesting, type SendNode } from "./sendItem";
import { MODULE_ID } from "@domain/flags";
import logger from "@src/util/logger";

/** Module socket channel (Foundry requires the `module.<id>` prefix). */
export const SOCKET = `module.${MODULE_ID}`;

export interface SendItemRequest {
  type: "sendItem";
  requestId: string;
  /** Actor UUID of the source (sender's sheet actor). */
  sourceUuid: string;
  /** Actor UUID of the target (the picked token's actor; may be unlinked). */
  targetUuid: string;
  create: SendNode[];
  deleteIds: string[];
  decrement: { id: string; value: number } | null;
  requesterUserId: string;
}

/** The embedded-document surface `applySend` drives — actors expose these. */
export interface EmbeddedDocActor {
  createEmbeddedDocuments(
    type: "Item",
    data: Record<string, unknown>[],
  ): Promise<Array<{ id?: string; _id?: string }>>;
  updateEmbeddedDocuments(
    type: "Item",
    updates: Record<string, unknown>[],
  ): Promise<unknown>;
  deleteEmbeddedDocuments(type: "Item", ids: string[]): Promise<unknown>;
  /** Foundry Document permission check — used GM-side to authorize a relay. */
  testUserPermission?(user: unknown, permission: string): boolean;
}

/** Drop the transient nesting keys before the data hits Foundry's create. */
function stripKeys(node: SendNode): Record<string, unknown> {
  const { _key, _parentKey, ...data } = node;
  void _key;
  void _parentKey;
  return data;
}

/** Execute a transfer: create the copies on the target (remapping nesting), then
 *  delete/decrement the source. Target-first so source is never lost on failure. */
export async function applySend(args: {
  fromActor: EmbeddedDocActor;
  toActor: EmbeddedDocActor;
  create: SendNode[];
  deleteIds: string[];
  decrement: { id: string; value: number } | null;
}): Promise<void> {
  const { fromActor, toActor, create, deleteIds, decrement } = args;

  // 1. Create on the target one node at a time so each returned id maps
  //    unambiguously to its source `_key`. A batch create does NOT guarantee the
  //    returned docs match input order, which would scramble the nesting remap.
  const idMap = new Map<string, string>();
  for (const node of create) {
    const [doc] = await toActor.createEmbeddedDocuments("Item", [
      stripKeys(node),
    ]);
    const newId = doc?.id ?? doc?._id;
    if (newId) idMap.set(node._key, newId);
  }
  const nesting = rebuildNesting(create, idMap);
  if (nesting.length) await toActor.updateEmbeddedDocuments("Item", nesting);

  // 2. Mutate the source only after the target copy exists.
  if (deleteIds.length) {
    await fromActor.deleteEmbeddedDocuments("Item", deleteIds);
  } else if (decrement) {
    await fromActor.updateEmbeddedDocuments("Item", [
      { _id: decrement.id, "system.quantity.value": decrement.value },
    ]);
  }
}

// --- socket wiring -----------------------------------------------------------

interface LooseSocket {
  on(event: string, cb: (data: unknown) => void): void;
  emit(event: string, data: unknown): void;
}
interface GameLike {
  socket?: LooseSocket;
  user: unknown;
  users?: { activeGM: unknown; get?(id: string): unknown };
}
// fvtt-types narrows `game.socket` to a socket.io shape; read the members we use
// through a loose surface (mirrors applyDamage.ts / flags.ts).
const getGame = (): GameLike =>
  (globalThis as unknown as { game: GameLike }).game;

// Resolve an actor UUID to its live document. `foundry.utils.fromUuid` loads the
// parent scene if needed, so it resolves unlinked token actors even when the GM
// is viewing a different scene than the sender.
async function resolveActor(uuid: string): Promise<EmbeddedDocActor | null> {
  const fromUuid = (
    globalThis as unknown as {
      foundry?: { utils?: { fromUuid?: (u: string) => Promise<unknown> } };
    }
  ).foundry?.utils?.fromUuid;
  if (!fromUuid) return null;
  return (await fromUuid(uuid)) as EmbeddedDocActor | null;
}

/** GM-side: apply an incoming relay request. No-ops on every client but the
 *  single active GM (mirrors migrations.ts / applyDamage.ts). Exported for tests. */
export async function onRequest(data: SendItemRequest): Promise<void> {
  if (data?.type !== "sendItem") return;
  const game = getGame();
  if (!game.users?.activeGM || game.users.activeGM !== game.user) return;
  const [from, to] = await Promise.all([
    resolveActor(data.sourceUuid),
    resolveActor(data.targetUuid),
  ]);
  if (!from || !to) {
    logger(`sendItem relay: could not resolve actors ${data.sourceUuid}→${data.targetUuid}`);
    return;
  }
  // Authorize: never move items on the GM's authority unless the requesting user
  // actually owns the SOURCE actor. Otherwise anyone who can open another
  // character's sheet could relay its items away.
  const requester = game.users?.get?.(data.requesterUserId);
  if (!requester || !from.testUserPermission?.(requester, "OWNER")) {
    logger(
      `sendItem relay: user ${data.requesterUserId} does not own source ${data.sourceUuid} — rejected`,
    );
    return;
  }
  try {
    await applySend({
      fromActor: from,
      toActor: to,
      create: data.create,
      deleteIds: data.deleteIds,
      decrement: data.decrement,
    });
  } catch (err) {
    logger(`sendItem relay failed: ${String(err)}`);
  }
}

/** Bind the relay handler. Call once from the `ready` hook. */
export function registerSendItemSocket(): void {
  getGame().socket?.on(SOCKET, (data) => void onRequest(data as SendItemRequest));
}

/** Sender-side: emit a transfer request for the active GM to apply. */
export function emitSendItem(req: SendItemRequest): void {
  getGame().socket?.emit(SOCKET, req);
}
