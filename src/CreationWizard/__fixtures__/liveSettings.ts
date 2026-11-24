import { vi } from "vitest";
import { notifySettingChanged, type SettingKey } from "@src/OscSheet/settings";

export function stubLiveSettingsAsGM() {
  const store = new Map<string, unknown>();
  vi.stubGlobal("game", {
    user: { isGM: true },
    settings: {
      get: (_namespace: string, key: string) => store.get(key),
      set: async (_namespace: string, key: SettingKey, value: unknown) => {
        store.set(key, value);
        notifySettingChanged(key);
      },
    },
  });
}
