import { MODULE_ID } from "./flags";

// OSE 3.2's class migration turns a blank (0) stored slot max into a negative slot adjustment.

type RawChange = { key: string; mode?: number; type?: string; value: unknown };

export interface EffectSource {
  flags?: Record<string, Record<string, unknown> | undefined>;
  changes?: RawChange[];
  system?: { changes?: RawChange[] };
}

type StoredSpells = Record<string, { max?: unknown } | undefined> | undefined;

export type SlotRepair =
  | { delete: true }
  | { update: Record<string, unknown> }
  | null;

const SLOT_MAX = /^system\.spells\.(\d+)\.max$/;
const ADD_MODE = 2;

const isAdd = (c: RawChange) =>
  c.type ? c.type === "add" : (c.mode ?? ADD_MODE) === ADD_MODE;

function fromBlankSlot(change: RawChange, stored: StoredSpells): boolean {
  const level = SLOT_MAX.exec(change.key)?.[1];
  if (!level || !isAdd(change) || !(Number(change.value) < 0)) return false;
  return (Number(stored?.[level]?.max) || 0) === 0;
}

/** Drop slot-max adds made from a blank stored slot; delete the effect if nothing is left. */
export function buildSlotRepair(
  effect: EffectSource,
  stored: StoredSpells,
  systemId: string,
): SlotRepair {
  if (effect.flags?.[systemId]?.migration !== true) return null;
  const v14 = Array.isArray(effect.system?.changes);
  const changes = (v14 ? effect.system!.changes : effect.changes) ?? [];
  const keep = changes.filter((c) => !fromBlankSlot(c, stored));
  if (keep.length === changes.length) return null;
  if (!keep.length) return { delete: true };
  return { update: v14 ? { "system.changes": keep } : { changes: keep } };
}

// --- runner --------------------------------------------------------------------

interface EffectDoc {
  toObject(): EffectSource;
  update(data: Record<string, unknown>): Promise<unknown>;
  delete(): Promise<unknown>;
}

export interface RepairActor {
  type?: string;
  _source?: { system?: { spells?: StoredSpells } };
  effects: Iterable<EffectDoc>;
}

interface GameView {
  user: unknown;
  users: { activeGM: unknown };
  system: { id: string };
  actors: Iterable<RepairActor>;
  scenes?: Iterable<{ tokens: Iterable<{ actorLink?: boolean; actor?: RepairActor | null }> }>;
}

const getGame = () => (globalThis as unknown as { game: GameView }).game;

/** Repair one actor's migration effects; returns how many effects changed. */
export async function repairActorSlots(actor: RepairActor): Promise<number> {
  if (actor.type !== "character") return 0;
  const stored = actor._source?.system?.spells;
  let repaired = 0;
  for (const effect of [...actor.effects]) {
    const fix = buildSlotRepair(effect.toObject(), stored, getGame().system.id);
    if (!fix) continue;
    if ("delete" in fix) await effect.delete();
    else await effect.update(fix.update);
    repaired++;
  }
  return repaired;
}

function* characterActors(game: GameView): Iterable<RepairActor> {
  yield* game.actors;
  for (const scene of game.scenes ?? []) {
    for (const token of scene.tokens) {
      if (!token.actorLink && token.actor) yield token.actor;
    }
  }
}

export function reportSlotRepair(count: number): void {
  if (!count) return;
  const notifications = (globalThis as { ui?: { notifications?: { info(msg: string): void } } }).ui
    ?.notifications;
  notifications?.info(
    `OSC Character Sheet: restored spell slots that OSE's class migration removed (${count} ${count === 1 ? "character" : "characters"}).`,
  );
}

/** GM-only sweep of world actors and unlinked tokens. Call from `ready`; never throws. */
export async function runSlotAdjustmentRepair(): Promise<number> {
  const game = getGame();
  let repaired = 0;
  try {
    if (!game.users.activeGM || game.users.activeGM !== game.user) return 0;
    for (const actor of characterActors(game)) repaired += await repairActorSlots(actor);
  } catch (err) {
    console.error(`${MODULE_ID} | spell slot repair failed`, err);
  }
  return repaired;
}
