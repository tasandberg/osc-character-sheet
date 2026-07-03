// One-shot world migration: module rename `reactor-sheet` → `osc-character-sheet`
// (sheet class `ose.ReactorSheet` → `ose.OscSheet`). Versioned via the world
// setting `osc-character-sheet.migrationVersion`; only the first active GM runs
// the world pass. Idempotent — re-running finds nothing left to move.
//
// Explicitly NOT migrated:
// - chat-message `damageApplied` flags: old damage cards lose their apply button — fine.
// - unlinked-token actor deltas: cosmetic sort-order loss only — fine.

import { MODULE_ID } from "./flags";

export const OLD_MODULE_ID = "reactor-sheet";
export const OLD_SHEET_CLASS = "ose.ReactorSheet";
export const NEW_SHEET_CLASS = "ose.OscSheet";

const MIGRATION_KEY = "migrationVersion";
const MIGRATION_VERSION = 1;

// --- pure payload builders (unit-tested) --------------------------------------

type Flags = Record<string, unknown> | undefined;
type UpdatePayload = Record<string, unknown>;

/** Move the whole old-scope flag blob to the new scope. Null if nothing to move. */
export function buildFlagScopeMove(flags: Flags): UpdatePayload | null {
  const old = flags?.[OLD_MODULE_ID];
  if (old === undefined) return null;
  return {
    [`flags.${MODULE_ID}`]: old,
    [`flags.-=${OLD_MODULE_ID}`]: null,
  };
}

/** Repoint a pinned old sheet class at the new one. Null if not pinned to it. */
export function buildSheetClassFix(flags: Flags): UpdatePayload | null {
  const core = flags?.core as { sheetClass?: unknown } | undefined;
  if (core?.sheetClass !== OLD_SHEET_CLASS) return null;
  return { "flags.core.sheetClass": NEW_SHEET_CLASS };
}

/** Combined actor update (flag move + pinned sheet). Null if the actor is clean. */
export function buildActorUpdate(flags: Flags): UpdatePayload | null {
  const update = { ...buildFlagScopeMove(flags), ...buildSheetClassFix(flags) };
  return Object.keys(update).length ? update : null;
}

// --- client-side localStorage migration (every user, no GM gate) --------------

/** localStorage keys to carry over: [old, new]. The theme entry is Foundry's
 *  client-setting storage (`<namespace>.<key>`); theme is client-scoped. */
const LOCAL_STORAGE_MOVES: ReadonlyArray<[string, string]> = [
  [`${OLD_MODULE_ID}.theme`, `${MODULE_ID}.theme`],
  ["reactorSheetSettings", "oscSheetSettings"],
];

export function migrateLocalStorage(): void {
  try {
    for (const [oldKey, newKey] of LOCAL_STORAGE_MOVES) {
      const old = localStorage.getItem(oldKey);
      if (old === null) continue;
      if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, old);
      localStorage.removeItem(oldKey);
    }
  } catch {
    // localStorage unavailable — nothing to migrate.
  }
}

// --- world migration runner ----------------------------------------------------

// Minimal structural views of the Foundry documents/collections we touch —
// fvtt-types' generics fight simple sweeps like this.
interface FlaggedDoc {
  id: string;
  flags?: Flags;
  update(data: UpdatePayload): Promise<unknown>;
}
interface ActorDoc extends FlaggedDoc {
  items: Iterable<FlaggedDoc>;
  updateEmbeddedDocuments(type: string, updates: UpdatePayload[]): Promise<unknown>;
}
interface SettingsApi {
  register(ns: string, key: string, data: object): void;
  get(ns: string, key: string): unknown;
  set(ns: string, key: string, value: unknown): Promise<unknown>;
  settings: Map<string, { scope?: string }>;
  storage: Map<string, Iterable<{ key?: string; value?: unknown }>>;
}
interface GameView {
  user: unknown;
  users: { activeGM: unknown };
  actors: Iterable<ActorDoc>;
  items: Iterable<FlaggedDoc>;
  settings: SettingsApi;
}
const getGame = (): GameView => (globalThis as unknown as { game: GameView }).game;

/** Register the version tracker. Call from the `init` hook. */
export function registerMigrationSetting(): void {
  getGame().settings.register(MODULE_ID, MIGRATION_KEY, {
    scope: "world",
    config: false,
    type: Number,
    default: 0,
  });
}

/** Run the world migration if needed. Call from `ready`; never throws. */
export async function runWorldMigration(): Promise<void> {
  const game = getGame();
  try {
    if (!game.users.activeGM || game.users.activeGM !== game.user) return;
    const stored = Number(game.settings.get(MODULE_ID, MIGRATION_KEY)) || 0;
    if (stored >= MIGRATION_VERSION) return;

    // 1+2+3: world actors — scope move, pinned sheet, embedded item flags.
    for (const actor of game.actors) {
      const update = buildActorUpdate(actor.flags);
      if (update) await actor.update(update);
      const itemUpdates: UpdatePayload[] = [];
      for (const item of actor.items) {
        const move = buildFlagScopeMove(item.flags);
        if (move) itemUpdates.push({ _id: item.id, ...move });
      }
      if (itemUpdates.length) await actor.updateEmbeddedDocuments("Item", itemUpdates);
    }

    // 2b: world-level items.
    for (const item of game.items) {
      const move = buildFlagScopeMove(item.flags);
      if (move) await item.update(move);
    }

    // 4: world-scoped settings stored under the old namespace — copy to the new
    // namespace when a matching world setting is still registered. Old orphaned
    // docs are left in place (harmless). Today only `theme` exists and it's
    // client-scoped, so this is future-proofing.
    const worldDocs = game.settings.storage.get("world") ?? [];
    for (const doc of worldDocs) {
      if (!doc.key?.startsWith(`${OLD_MODULE_ID}.`)) continue;
      const key = doc.key.slice(OLD_MODULE_ID.length + 1);
      if (key === MIGRATION_KEY) continue;
      if (game.settings.settings.get(`${MODULE_ID}.${key}`)?.scope !== "world") continue;
      let value = doc.value;
      if (typeof value === "string") {
        try {
          value = JSON.parse(value); // Setting docs store JSON-serialized values.
        } catch {
          // Keep the raw string.
        }
      }
      await game.settings.set(MODULE_ID, key, value);
    }

    await game.settings.set(MODULE_ID, MIGRATION_KEY, MIGRATION_VERSION);
    console.log(`${MODULE_ID} | migrated world data from ${OLD_MODULE_ID}`);
  } catch (err) {
    console.error(`${MODULE_ID} | world migration failed`, err);
    (globalThis as unknown as { ui?: { notifications?: { error(msg: string): void } } }).ui
      ?.notifications?.error(
        "OSC Character Sheet: migration from reactor-sheet failed — see console. It will retry on next reload.",
      );
  }
}
