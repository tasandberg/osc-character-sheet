// The single source of truth for every sheet preference is its Foundry setting
// under `<MODULE_ID>.<key>`. Each one's onChange re-renders every sheet, and
// osc-sheet.js `_onRender` applies the visual ones to each *window* element
// (this.element). Controls therefore flip the SETTING — not a DOM attribute on
// the inner app, which the window's setting-driven attributes would just
// override by inheritance.
import { useCallback, useSyncExternalStore } from "react";
import { MODULE_ID } from "@domain/flags";
import { resolveFontScale } from "@src/OscSheet/fontScale";
import { resolveTheme } from "@src/OscSheet/theme";

type SettingScope = "world" | "user";

type SettingDefinition<T> = {
  readonly name: string;
  readonly hint: string;
  readonly scope: SettingScope;
  readonly config: boolean;
  readonly type: typeof String | typeof Boolean;
  readonly choices?: Readonly<Record<string, string>>;
  readonly default: T;
  readonly resolve: (value: unknown) => T;
};

const resolveBoolean =
  (fallback: boolean) =>
  (value: unknown): boolean =>
    typeof value === "boolean" ? value : fallback;

export const SETTINGS = {
  theme: {
    name: "Sheet theme",
    hint: "Color theme for the OSC Character Sheet.",
    scope: "user",
    config: true,
    type: String,
    choices: { dark: "Dark", cream: "Cream" },
    default: "dark",
    resolve: resolveTheme,
  },
  disableMemorization: {
    name: "Disable spell memorization",
    hint: "Casters may cast any known spell while spell slots remain for its level, and favorite spells for the Actions tab (fits spell-point / free-casting tables).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    resolve: resolveBoolean(false),
  },
  fontScale: {
    name: "Sheet font size",
    hint: "Scales all sheet text up for readability.",
    scope: "user",
    config: true,
    type: String,
    choices: { compact: "Compact", medium: "Medium", large: "Large" },
    default: "medium",
    resolve: resolveFontScale,
  },
  showSpellImages: {
    name: "Show spell images",
    hint: "Show each spell's item image in the spell list.",
    scope: "user",
    config: true,
    type: Boolean,
    default: true,
    resolve: resolveBoolean(true),
  },
} as const satisfies Record<string, SettingDefinition<unknown>>;

export type SettingKey = keyof typeof SETTINGS;
export type SettingValue<K extends SettingKey> = ReturnType<
  (typeof SETTINGS)[K]["resolve"]
>;

type GameSettings = {
  get(namespace: string, key: string): unknown;
  set(namespace: string, key: string, value: unknown): Promise<unknown>;
};

const gameSettings = (): GameSettings | undefined =>
  (globalThis as unknown as { game?: { settings?: GameSettings } }).game
    ?.settings;

/** Coerced to the setting's declared type; falls back to its default outside
 *  Foundry (tests) and for anything unrecognized. */
export function getSetting<K extends SettingKey>(key: K): SettingValue<K> {
  const resolve = SETTINGS[key].resolve as (value: unknown) => SettingValue<K>;
  try {
    return resolve(gameSettings()?.get(MODULE_ID, key));
  } catch {
    return resolve(undefined);
  }
}

/** The setting's onChange re-renders sheets. No-ops outside Foundry (tests). */
export function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValue<K>,
): void {
  void gameSettings()?.set(MODULE_ID, key, value);
}

export type OscSettings = { readonly [K in SettingKey]: SettingValue<K> };

type SettingsListener = () => void;

const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

const allListeners = new Set<SettingsListener>();
const keyListeners = new Map<SettingKey, Set<SettingsListener>>();

let snapshot: OscSettings | null = null;

function readSettings(): OscSettings {
  const next = {} as Record<SettingKey, unknown>;
  for (const key of SETTING_KEYS) next[key] = getSetting(key);
  return next as OscSettings;
}

export function getSettingsSnapshot(): OscSettings {
  const next = readSettings();
  const current = snapshot;
  if (current && SETTING_KEYS.every((key) => current[key] === next[key]))
    return current;
  snapshot = next;
  return next;
}

export function subscribeToSettings(listener: SettingsListener): () => void {
  allListeners.add(listener);
  return () => {
    allListeners.delete(listener);
  };
}

export function subscribeToSetting(
  key: SettingKey,
  listener: SettingsListener,
): () => void {
  const listeners = keyListeners.get(key) ?? new Set<SettingsListener>();
  keyListeners.set(key, listeners);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySettingChanged(key: SettingKey): void {
  for (const listener of [...(keyListeners.get(key) ?? [])]) listener();
  for (const listener of [...allListeners]) listener();
}

export function useOscSettings(): OscSettings {
  return useSyncExternalStore(
    subscribeToSettings,
    getSettingsSnapshot,
    getSettingsSnapshot,
  );
}

export function useSetting<K extends SettingKey>(key: K): SettingValue<K> {
  const subscribe = useCallback(
    (listener: SettingsListener) => subscribeToSetting(key, listener),
    [key],
  );
  const read = useCallback(() => getSetting(key), [key]);
  return useSyncExternalStore(subscribe, read, read);
}

export type SettingRegistration = Omit<
  SettingDefinition<unknown>,
  "resolve"
> & {
  readonly onChange: () => void;
};

export function settingRegistrations(
  onChange: () => void,
): { key: SettingKey; data: SettingRegistration }[] {
  const defs: Record<SettingKey, SettingDefinition<unknown>> = SETTINGS;
  return (Object.keys(defs) as SettingKey[]).map((key) => {
    const { name, hint, scope, config, type, choices } = defs[key];
    return {
      key,
      data: {
        name,
        hint,
        scope,
        config,
        type,
        default: defs[key].default,
        onChange: () => {
          notifySettingChanged(key);
          onChange();
        },
        ...(choices ? { choices } : {}),
      },
    };
  });
}
