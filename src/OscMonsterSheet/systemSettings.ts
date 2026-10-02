import type { MonsterSettings } from "./viewModel";

function systemSetting(key: string): unknown {
  try {
    const settings = game.settings as unknown as {
      get(namespace: string, key: string): unknown;
    };
    return settings.get(game.system.id, key);
  } catch {
    return undefined;
  }
}

export function readMonsterSettings(): MonsterSettings {
  return {
    ascendingAC: !!systemSetting("ascendingAC"),
    morale: !!systemSetting("morale"),
  };
}
