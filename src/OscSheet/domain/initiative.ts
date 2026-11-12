export const individualInitiative = () => {
  try {
    const settings = game.settings as {
      get(ns: string, key: string): unknown;
    };
    return settings.get(game.system.id, "initiative") === "individual";
  } catch {
    return false;
  }
};
