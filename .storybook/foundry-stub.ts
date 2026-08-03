// Minimal stand-ins for the Foundry globals the feature views reach for, so a
// whole tab can render in Storybook. Only the members our code actually calls —
// anything beyond that belongs in a real world, not here.
//
// Loaded from preview.tsx BEFORE any story module, because several components
// touch these at module scope.

type Any = Record<string, unknown>;

const g = globalThis as Any;

const settings = new Map<string, unknown>([
  ["osc-character-sheet.theme", "dark"],
  ["osc-character-sheet.fontScale", "medium"],
  ["osc-character-sheet.disableMemorization", false],
]);

g.game ??= {
  settings: {
    get: (ns: string, key: string) => settings.get(`${ns}.${key}`),
    set: (ns: string, key: string, value: unknown) => {
      settings.set(`${ns}.${key}`, value);
      return Promise.resolve(value);
    },
  },
  // Real keys pass through unchanged — story fixtures use plain English strings.
  i18n: { localize: (k: string) => k, format: (k: string) => k },
  user: { isGM: true },
};

g.CONFIG ??= {
  OSE: {
    roll_type: { result: "=", above: "≥", below: "≤" },
    languages: ["Common", "Dwarvish", "Elvish", "Gnomish", "Goblin", "Halfling", "Orcish"],
    colors: {},
  },
};

g.foundry ??= {
  applications: {
    // Stories pass already-safe HTML; the real enricher resolves @UUID links,
    // inline rolls and embeds, none of which exist outside a world.
    ux: { TextEditor: { enrichHTML: (html: string) => Promise.resolve(html) } },
  },
  utils: {
    randomID: () => Math.random().toString(36).slice(2, 18),
    duplicate: <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T,
  },
};

export {};
