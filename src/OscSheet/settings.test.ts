import { describe, it, expect, afterEach, vi } from "vitest";
import {
  SETTINGS,
  getSetting,
  setSetting,
  settingRegistrations,
  getSettingsSnapshot,
  subscribeToSettings,
  subscribeToSetting,
  notifySettingChanged,
  type SettingKey,
} from "@src/OscSheet/settings";

const NS = "osc-character-sheet";

/** Install a Map-backed `game.settings`, seeded with raw stored values. */
function mockSettings(seed: Record<string, unknown> = {}) {
  const store = new Map(Object.entries(seed));
  const set = vi.fn((ns: string, key: string, value: unknown) => {
    store.set(`${ns}.${key}`, value);
    return Promise.resolve(value);
  });
  (globalThis as { game?: unknown }).game = {
    settings: {
      get: (ns: string, key: string) => store.get(`${ns}.${key}`),
      set,
    },
  };
  return { store, set };
}

afterEach(() => {
  delete (globalThis as { game?: unknown }).game;
});

describe("getSetting outside Foundry", () => {
  it("falls back to each setting's default with no game global", () => {
    expect(getSetting("theme")).toBe("dark");
    expect(getSetting("fontScale")).toBe("medium");
    expect(getSetting("disableMemorization")).toBe(false);
    expect(getSetting("showSpellImages")).toBe(true);
  });

  it("falls back when game.settings.get throws", () => {
    (globalThis as { game?: unknown }).game = {
      settings: {
        get: () => {
          throw new Error("Setting not registered");
        },
      },
    };
    expect(getSetting("theme")).toBe("dark");
    expect(getSetting("showSpellImages")).toBe(true);
  });
});

describe("getSetting coercion", () => {
  it("reads stored values through each setting's resolver", () => {
    mockSettings({
      [`${NS}.theme`]: "cream",
      [`${NS}.fontScale`]: "large",
      [`${NS}.disableMemorization`]: true,
      [`${NS}.showSpellImages`]: false,
    });
    expect(getSetting("theme")).toBe("cream");
    expect(getSetting("fontScale")).toBe("large");
    expect(getSetting("disableMemorization")).toBe(true);
    expect(getSetting("showSpellImages")).toBe(false);
  });

  it("coerces unrecognized stored values back to the default", () => {
    mockSettings({
      [`${NS}.theme`]: "nonsense",
      [`${NS}.fontScale`]: "",
      [`${NS}.disableMemorization`]: "yes",
      [`${NS}.showSpellImages`]: null,
    });
    expect(getSetting("theme")).toBe("dark");
    expect(getSetting("fontScale")).toBe("medium");
    expect(getSetting("disableMemorization")).toBe(false);
    expect(getSetting("showSpellImages")).toBe(true);
  });
});

describe("setSetting", () => {
  it("writes to the module namespace and reads back", () => {
    const { set } = mockSettings();
    setSetting("theme", "cream");
    setSetting("fontScale", "compact");
    setSetting("showSpellImages", false);
    expect(set).toHaveBeenCalledWith(NS, "theme", "cream");
    expect(set).toHaveBeenCalledWith(NS, "fontScale", "compact");
    expect(set).toHaveBeenCalledWith(NS, "showSpellImages", false);
    expect(getSetting("theme")).toBe("cream");
    expect(getSetting("fontScale")).toBe("compact");
    expect(getSetting("showSpellImages")).toBe(false);
  });

  it("no-ops outside Foundry", () => {
    expect(() => setSetting("theme", "cream")).not.toThrow();
  });
});

describe("settingRegistrations", () => {
  const onChange = () => {};
  const byKey = Object.fromEntries(
    settingRegistrations(onChange).map((r) => [r.key, r.data]),
  );

  it("covers every registry key, in registry order", () => {
    expect(settingRegistrations(onChange).map((r) => r.key)).toEqual(
      Object.keys(SETTINGS),
    );
  });

  it("keeps the scopes, types and defaults Foundry registers with", () => {
    expect(byKey.theme).toMatchObject({
      scope: "user",
      type: String,
      config: true,
      default: "dark",
      choices: { dark: "Dark", cream: "Cream" },
    });
    expect(byKey.fontScale).toMatchObject({
      scope: "user",
      type: String,
      default: "medium",
      choices: { compact: "Compact", medium: "Medium", large: "Large" },
    });
    expect(byKey.disableMemorization).toMatchObject({
      scope: "world",
      type: Boolean,
      default: false,
    });
    expect(byKey.showSpellImages).toMatchObject({
      scope: "user",
      type: Boolean,
      config: true,
      default: true,
      name: "Show spell images",
    });
  });

  it("omits choices for the boolean settings", () => {
    expect(byKey.disableMemorization).not.toHaveProperty("choices");
    expect(byKey.showSpellImages).not.toHaveProperty("choices");
  });

  it("gives every setting an onChange, a name and a hint", () => {
    for (const key of Object.keys(SETTINGS) as SettingKey[]) {
      expect(typeof byKey[key].onChange).toBe("function");
      expect(byKey[key].name).toBeTruthy();
      expect(byKey[key].hint).toBeTruthy();
    }
  });

  it("notifies that key's subscribers AND re-renders, on every key", () => {
    const rerender = vi.fn();
    const registered = Object.fromEntries(
      settingRegistrations(rerender).map((r) => [r.key, r.data]),
    );
    for (const key of Object.keys(SETTINGS) as SettingKey[]) {
      const listener = vi.fn();
      const off = subscribeToSetting(key, listener);
      registered[key].onChange();
      expect(listener).toHaveBeenCalledTimes(1);
      off();
    }
    expect(rerender).toHaveBeenCalledTimes(Object.keys(SETTINGS).length);
  });
});

describe("settings snapshot", () => {
  it("keeps one object identity while nothing changes", () => {
    mockSettings({ [`${NS}.theme`]: "dark" });
    const first = getSettingsSnapshot();
    expect(getSettingsSnapshot()).toBe(first);
    expect(getSettingsSnapshot()).toBe(first);
  });

  it("mints a new object only when a value actually changes", () => {
    mockSettings({ [`${NS}.theme`]: "dark" });
    const first = getSettingsSnapshot();
    mockSettings({ [`${NS}.theme`]: "cream" });
    const second = getSettingsSnapshot();
    expect(second).not.toBe(first);
    expect(second.theme).toBe("cream");
    expect(getSettingsSnapshot()).toBe(second);
  });

  it("reports every registry key, defaulted with no game global", () => {
    expect(getSettingsSnapshot()).toEqual({
      theme: "dark",
      disableMemorization: false,
      fontScale: "medium",
      showSpellImages: true,
    });
  });
});

describe("settings subscriptions", () => {
  it("notifies whole-snapshot listeners for any key, until unsubscribed", () => {
    const listener = vi.fn();
    const off = subscribeToSettings(listener);
    notifySettingChanged("theme");
    notifySettingChanged("showSpellImages");
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    notifySettingChanged("theme");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies a per-key listener only for its own key", () => {
    const listener = vi.fn();
    const off = subscribeToSetting("showSpellImages", listener);
    notifySettingChanged("theme");
    expect(listener).not.toHaveBeenCalled();
    notifySettingChanged("showSpellImages");
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    notifySettingChanged("showSpellImages");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("survives a listener unsubscribing during the notification", () => {
    const off = subscribeToSettings(() => off());
    expect(() => notifySettingChanged("theme")).not.toThrow();
  });
});
